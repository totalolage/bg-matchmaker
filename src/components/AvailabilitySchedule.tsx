import {
  useState,
  useEffect,
  ComponentProps,
  useImperativeHandle,
  Ref,
} from "react";
import { Save, ChevronLeft, ChevronRight, CalendarIcon } from "lucide-react";
import { Button } from "./ui/button";
import { cn } from "../lib/utils";
import { Doc } from "../../convex/_generated/dataModel";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Calendar } from "./ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { TimeSlotButton } from "./TimeSlotButton";
import {
  DayAvailability,
  AvailabilityInterval,
  timeToMinutes,
  minutesToTime,
  updateDayAvailability,
  getAvailabilityForDate,
  addInterval,
  removeInterval,
} from "../lib/availability";

// Remove old TimeSlot type - now using DayAvailability and AvailabilityInterval

const HOURS = Array.from({ length: 24 }, (_, i) => i);

// Get short day names for tabs
const getShortDayName = (date: Date) => {
  return new Intl.DateTimeFormat(undefined, { weekday: "short" }).format(date);
};

// Get full day name
const getFullDayName = (date: Date) => {
  return new Intl.DateTimeFormat(undefined, { weekday: "long" }).format(date);
};

// Get short date format (DD/MM or MM/DD based on locale)
const getShortDate = (date: Date) => {
  return new Intl.DateTimeFormat(undefined, {
    day: "numeric",
    month: "numeric",
  }).format(date);
};

// Get the first day of the week for the user's locale
const getLocaleFirstDayOfWeek = () => {
  try {
    // Try modern Intl.Locale.getWeekInfo() API (Chrome 130+, Safari 17+)
    const locale = new Intl.Locale(navigator.language);
    if ('getWeekInfo' in locale && typeof locale.getWeekInfo === 'function') {
      const weekInfo = locale.getWeekInfo();
      // getWeekInfo returns 1=Monday, 7=Sunday, but getDay() returns 0=Sunday, 6=Saturday
      // Convert: 1->1, 2->2, ..., 6->6, 7->0
      return weekInfo.firstDay === 7 ? 0 : weekInfo.firstDay;
    }
  } catch (e) {
    // Ignore errors and fall back
  }

  // Fallback: Use locale-based detection
  // Most countries use Monday (1), but US, Canada, some others use Sunday (0)
  const locale = navigator.language.toLowerCase();
  
  // Countries/locales that typically start the week on Sunday
  const sundayStartLocales = [
    'en-us', 'en-ca', 'he', 'ar-sa', 'ar-ae', 'ar-bh', 'ar-dz', 
    'ar-eg', 'ar-iq', 'ar-jo', 'ar-kw', 'ar-lb', 'ar-ly', 'ar-ma', 
    'ar-om', 'ar-qa', 'ar-sy', 'ar-tn', 'ar-ye', 'th', 'pt-br'
  ];
  
  // Check for exact match or if it starts with a Sunday-start locale
  if (sundayStartLocales.some(loc => locale === loc || locale.startsWith(loc + '-'))) {
    return 0; // Sunday
  }
  
  // Check for US English specifically
  if (locale.startsWith('en') && (locale.includes('us') || locale === 'en')) {
    // Default to Sunday for generic 'en' since it's often US
    return 0;
  }
  
  // Default to Monday for most other locales
  return 1;
};

// Get week dates starting from the locale-appropriate day
const getWeekDates = (currentDate: Date) => {
  const week: Date[] = [];
  const startOfWeek = new Date(currentDate);
  const currentDay = startOfWeek.getDay(); // 0=Sunday, 1=Monday, ..., 6=Saturday
  const localeFirstDay = getLocaleFirstDayOfWeek(); // 0=Sunday, 1=Monday
  
  // Calculate how many days to go back to reach the first day of the week
  let daysBack = currentDay - localeFirstDay;
  if (daysBack < 0) {
    daysBack += 7;
  }
  
  startOfWeek.setDate(startOfWeek.getDate() - daysBack);

  for (let i = 0; i < 7; i++) {
    const date = new Date(startOfWeek);
    date.setDate(startOfWeek.getDate() + i);
    week.push(date);
  }

  return week;
};

// Format date to ISO string (YYYY-MM-DD)
const formatDateToISO = (date: Date) => {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const day = date.getDate().toString().padStart(2, "0");
  return `${year}-${month}-${day}`;
};

// Check if date is in the past
const isDateInPast = (date: Date) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return date < today;
};

interface DatePickerRef {
  state: "open" | "closed";
  set: (state: "open" | "closed") => void;
  toggle: () => void;
  open: () => void;
  close: () => void;
}

export const AvailabilitySchedule = ({
  user,
  ref,
}: {
  user: Doc<"users">;
  ref?: Ref<DatePickerRef>;
}) => {
  const [currentWeekStart, setCurrentWeekStart] = useState(() => {
    const today = new Date();
    const currentDay = today.getDay(); // 0=Sunday, 1=Monday, ..., 6=Saturday
    const localeFirstDay = getLocaleFirstDayOfWeek(); // 0=Sunday, 1=Monday
    
    // Calculate how many days to go back to reach the first day of the week
    let daysBack = currentDay - localeFirstDay;
    if (daysBack < 0) {
      daysBack += 7;
    }
    
    const start = new Date(today);
    start.setDate(today.getDate() - daysBack);
    return start;
  });

  const [selectedSlots, setSelectedSlots] = useState<DayAvailability[]>(
    user.availability as DayAvailability[],
  );
  const updateAvailability = useMutation(api.users.updateAvailability);
  const [selectedTime, setSelectedTime] = useState<{
    date: string;
    hour: number;
  } | null>(null);
  const [hoveredTime, setHoveredTime] = useState<{
    date: string;
    hour: number;
  } | null>(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [selectedDayIndex, setSelectedDayIndex] = useState(() => {
    // Start with current day selected, adjusted for locale
    const today = new Date();
    const currentDay = today.getDay(); // 0=Sunday, 1=Monday, ..., 6=Saturday
    const localeFirstDay = getLocaleFirstDayOfWeek(); // 0=Sunday, 1=Monday
    // Calculate the day index within the week (0-6)
    return (currentDay - localeFirstDay + 7) % 7;
  });
  const [datePickerOpen, setDatePickerOpen] = useState(false);

  useImperativeHandle(
    ref,
    () => ({
      state: datePickerOpen ? "open" : ("closed" as "open" | "closed"),
      set: (state: "open" | "closed") =>
        setDatePickerOpen(
          {
            open: true,
            closed: false,
          }[state],
        ),
      toggle: () => setDatePickerOpen((prev) => !prev),
      open: () => setDatePickerOpen(true),
      close: () => setDatePickerOpen(false),
    }),
    [datePickerOpen],
  );

  useEffect(() => {
    setSelectedSlots(user.availability as DayAvailability[]);
  }, [user.availability]);

  const weekDates = getWeekDates(currentWeekStart);
  const selectedDate = weekDates[selectedDayIndex];
  const selectedDateISO = formatDateToISO(selectedDate);

  const isSlotSelected = (date: string, hour: number) => {
    const intervals = getAvailabilityForDate(selectedSlots, date);
    const timeInMinutes = hour * 60;
    return intervals.some(
      (interval) =>
        timeInMinutes >= interval.start && timeInMinutes < interval.end,
    );
  };

  const isTimeSelected = (date: string, hour: number) => {
    return selectedTime?.date === date && selectedTime?.hour === hour;
  };

  const isInHoverRange = (date: string, hour: number) => {
    if (
      !selectedTime ||
      !hoveredTime ||
      selectedTime.date !== date ||
      hoveredTime.date !== date
    ) {
      return false;
    }
    const minHour = Math.min(selectedTime.hour, hoveredTime.hour);
    const maxHour = Math.max(selectedTime.hour, hoveredTime.hour);
    return hour >= minHour && hour <= maxHour;
  };

  const handleSlotClick = (date: string, hour: number) => {
    // Don't allow selection on past dates
    if (isDateInPast(new Date(date))) return;

    setHasChanges(true);

    // Case 1: If this exact time is already selected (light purple)
    if (isTimeSelected(date, hour)) {
      // Create a 1-hour interval at this exact time
      const newInterval: AvailabilityInterval = {
        start: hour * 60,
        end: (hour + 1) * 60,
      };

      setSelectedSlots((slots) => {
        const existingIntervals = getAvailabilityForDate(slots, date);
        const updatedIntervals = addInterval(existingIntervals, newInterval);
        return updateDayAvailability(slots, date, updatedIntervals);
      });
      setSelectedTime(null);
      return;
    }

    // Case 2: If another time is selected (creating a range)
    if (selectedTime && selectedTime.date === date) {
      // Create a time interval from the lower to upper time
      const startHour = Math.min(selectedTime.hour, hour);
      const endHour = Math.max(selectedTime.hour, hour) + 1;

      const newInterval: AvailabilityInterval = {
        start: startHour * 60,
        end: endHour * 60,
      };

      setSelectedSlots((slots) => {
        const existingIntervals = getAvailabilityForDate(slots, date);
        const updatedIntervals = addInterval(existingIntervals, newInterval);
        return updateDayAvailability(slots, date, updatedIntervals);
      });
      setSelectedTime(null);
      return;
    }

    // Case 3: If this time is part of an existing time interval (dark purple) and no selection active
    if (isSlotSelected(date, hour) && !selectedTime) {
      // Find and remove the interval containing this hour
      setSelectedSlots((slots) => {
        const intervals = getAvailabilityForDate(slots, date);
        const timeInMinutes = hour * 60;

        // Find the interval to remove
        const intervalToRemove = intervals.find(
          (interval) =>
            timeInMinutes >= interval.start && timeInMinutes < interval.end,
        );

        if (intervalToRemove) {
          const updatedIntervals = removeInterval(intervals, intervalToRemove);
          return updateDayAvailability(slots, date, updatedIntervals);
        }

        return slots;
      });
      setSelectedTime(null);
      return;
    }

    // Case 4: No other time is selected
    setSelectedTime({ date, hour });
  };

  // Merging is now handled by the utility functions in availability.ts

  const handleSave = async () => {
    try {
      await updateAvailability({ availability: selectedSlots });
      setHasChanges(false);
      toast.success("Availability updated successfully");
    } catch {
      toast.error("Failed to update availability");
    }
  };

  // Format time for display using Intl API
  const formatTime = (hour: number) => {
    const date = new Date();
    date.setHours(hour, 0, 0, 0);

    // Create formatter to check if locale uses 12-hour time
    const formatter = new Intl.DateTimeFormat(undefined, {
      hour: "numeric",
      hour12: true,
    });

    // Check if this locale actually uses 12-hour format
    const resolvedOptions = formatter.resolvedOptions();

    if (resolvedOptions.hour12) {
      const formatted = formatter.format(date);
      // Replace lowercase am/pm with uppercase AM/PM
      return formatted.replace(/\s(am|pm)$/i, (match) => match.toUpperCase());
    }

    return new Intl.DateTimeFormat(undefined, {
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

  // Navigation functions
  const goToPreviousWeek = () => {
    const newStart = new Date(currentWeekStart);
    newStart.setDate(newStart.getDate() - 7);
    setCurrentWeekStart(newStart);
    setSelectedTime(null);
    setHoveredTime(null);
  };

  const goToNextWeek = () => {
    const newStart = new Date(currentWeekStart);
    newStart.setDate(newStart.getDate() + 7);
    setCurrentWeekStart(newStart);
    setSelectedTime(null);
    setHoveredTime(null);
  };

  // Navigate to a specific date
  const navigateToDate = (dateString: string) => {
    const targetDate = new Date(dateString + "T00:00:00");

    // Calculate the start of the week for the selected date using locale-aware logic
    const currentDay = targetDate.getDay(); // 0=Sunday, 1=Monday, ..., 6=Saturday
    const localeFirstDay = getLocaleFirstDayOfWeek(); // 0=Sunday, 1=Monday
    
    // Calculate how many days to go back to reach the first day of the week
    let daysBack = currentDay - localeFirstDay;
    if (daysBack < 0) {
      daysBack += 7;
    }
    
    const weekStart = new Date(targetDate);
    weekStart.setDate(targetDate.getDate() - daysBack);
    setCurrentWeekStart(weekStart);

    // Calculate the day index within the week (0-6)
    const dayIndex = (currentDay - localeFirstDay + 7) % 7;
    setSelectedDayIndex(dayIndex);

    // Clear selection
    setSelectedTime(null);
    setHoveredTime(null);
  };

  // Format week range for display
  const formatWeekRange = () => {
    const start = weekDates[0];
    const end = weekDates[6];

    // Check if dates are in same month and year
    const sameMonth = start.getMonth() === end.getMonth();
    const sameYear = start.getFullYear() === end.getFullYear();

    if (sameMonth && sameYear) {
      // Format as "May 25 - 31, 2025"
      const monthYearFormatter = new Intl.DateTimeFormat(undefined, {
        month: "short",
        year: "numeric",
      });
      const startDayFormatter = new Intl.DateTimeFormat(undefined, {
        day: "numeric",
      });
      const endDayFormatter = new Intl.DateTimeFormat(undefined, {
        day: "numeric",
      });

      const monthYear = monthYearFormatter.format(start);
      const startDay = startDayFormatter.format(start);
      const endDay = endDayFormatter.format(end);

      // Extract month and year parts
      const parts = monthYearFormatter.formatToParts(start);
      const month = parts.find((p) => p.type === "month")?.value || "";
      const year = parts.find((p) => p.type === "year")?.value || "";

      return `${month} ${startDay} - ${endDay}, ${year}`;
    }

    // Different months or years - format both dates fully
    const formatter = new Intl.DateTimeFormat(undefined, {
      month: "short",
      day: "numeric",
      year: sameYear ? undefined : "numeric",
    });

    return `${formatter.format(start)} - ${formatter.format(end)}`;
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Weekly Availability</CardTitle>
              <CardDescription>
                Click times to select availability. Click again to confirm or
                extend selection.
              </CardDescription>
            </div>
            {hasChanges && (
              <Button onClick={() => void handleSave()} size="sm">
                <Save className="mr-2 h-4 w-4" />
                Save Changes
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {/* Week navigation */}
          <div className="flex items-center justify-between mb-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={goToPreviousWeek}
              className="h-8 px-2"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>

            <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 px-3 text-sm font-medium hover:bg-gray-100"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {formatWeekRange()}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="center">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => {
                    if (date) {
                      // Calculate the start of the week for the selected date using locale-aware logic
                      const currentDay = date.getDay(); // 0=Sunday, 1=Monday, ..., 6=Saturday
                      const localeFirstDay = getLocaleFirstDayOfWeek(); // 0=Sunday, 1=Monday
                      
                      // Calculate how many days to go back to reach the first day of the week
                      let daysBack = currentDay - localeFirstDay;
                      if (daysBack < 0) {
                        daysBack += 7;
                      }
                      
                      const weekStart = new Date(date);
                      weekStart.setDate(date.getDate() - daysBack);
                      setCurrentWeekStart(weekStart);

                      // Calculate the day index within the week (0-6)
                      const dayIndex = (currentDay - localeFirstDay + 7) % 7;
                      setSelectedDayIndex(dayIndex);

                      // Clear selection
                      setSelectedTime(null);

                      // Close the popover
                      setDatePickerOpen(false);
                    }
                  }}
                  initialFocus
                />
              </PopoverContent>
            </Popover>

            <Button
              variant="ghost"
              size="sm"
              onClick={goToNextWeek}
              className="h-8 px-2"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          <Tabs
            value={selectedDayIndex.toString()}
            onValueChange={(v) => {
              const newIndex = parseInt(v);
              setSelectedDayIndex(newIndex);
              setSelectedTime(null);
              setHoveredTime(null);
            }}
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-7 h-auto p-1">
              {weekDates.map((date, index) => {
                const isPast = isDateInPast(date);
                const isToday =
                  formatDateToISO(date) === formatDateToISO(new Date());

                return (
                  <TabsTrigger
                    key={index}
                    value={index.toString()}
                    className={cn(
                      "text-xs flex flex-col gap-0.5 py-2 px-1 min-h-[3.5rem]",
                      isPast && "opacity-50",
                      isToday && "ring-2 ring-purple-500 ring-offset-2",
                    )}
                  >
                    <span className="font-medium">{getShortDayName(date)}</span>
                    <span className="text-[10px] text-muted-foreground">
                      {getShortDate(date)}
                    </span>
                  </TabsTrigger>
                );
              })}
            </TabsList>

            {weekDates.map((date, dayIndex) => {
              const dateISO = formatDateToISO(date);
              const isPast = isDateInPast(date);

              if (dayIndex !== selectedDayIndex) return null;

              return (
                <TabsContent
                  key={dayIndex}
                  value={dayIndex.toString()}
                  className="mt-4"
                >
                  <div className="grid grid-cols-12 gap-1">
                    {HOURS.map((hour) => {
                      const timeString = formatTime(hour);
                      const isSelected = isTimeSelected(dateISO, hour);
                      const isConfirmed = isSlotSelected(dateISO, hour);
                      const inHoverRange = isInHoverRange(dateISO, hour);

                      // Find which interval contains the hovered time (only when not selecting)
                      let hoveredIntervalToDelete: AvailabilityInterval | null =
                        null;
                      if (hoveredTime && !selectedTime) {
                        const intervals = getAvailabilityForDate(
                          selectedSlots,
                          hoveredTime.date,
                        );
                        const timeInMinutes = hoveredTime.hour * 60;
                        const foundInterval = intervals.find(
                          (interval) =>
                            timeInMinutes >= interval.start &&
                            timeInMinutes < interval.end,
                        );
                        if (foundInterval) {
                          hoveredIntervalToDelete = foundInterval;
                        }
                      }

                      // Check if this hour is part of the interval that would be deleted
                      const isPartOfDeleteSlot =
                        hoveredIntervalToDelete &&
                        hour * 60 >= hoveredIntervalToDelete.start &&
                        hour * 60 < hoveredIntervalToDelete.end;

                      let buttonState:
                        | "default"
                        | "selected"
                        | "confirmed"
                        | "disabled"
                        | "hoverRange"
                        | "hoverDelete" = "default";

                      if (isPast) {
                        buttonState = "disabled";
                      } else if (isConfirmed) {
                        // If this slot is part of the one being hovered for deletion
                        if (isPartOfDeleteSlot) buttonState = "hoverDelete";
                        else buttonState = "confirmed";
                      } else if (isSelected) {
                        buttonState = "selected";
                      } else if (inHoverRange && selectedTime) {
                        buttonState = "hoverRange";
                      }

                      return (
                        <TimeSlotButton
                          key={hour}
                          time={timeString}
                          state={buttonState}
                          onClick={() => handleSlotClick(dateISO, hour)}
                          onMouseEnter={() =>
                            setHoveredTime({ date: dateISO, hour })
                          }
                          onMouseLeave={() => setHoveredTime(null)}
                          disabled={isPast}
                        />
                      );
                    })}
                  </div>
                </TabsContent>
              );
            })}
          </Tabs>
        </CardContent>
      </Card>

      {/* Summary of selected slots */}
      {selectedSlots.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Your Availability Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1 text-sm max-h-48 overflow-y-auto">
              {selectedSlots
                .sort((a, b) => a.date.localeCompare(b.date))
                .flatMap((day) =>
                  day.intervals.map((interval) => ({
                    date: day.date,
                    interval,
                  })),
                )
                .map(({ date, interval }, i) => {
                  const dateObj = new Date(date + "T00:00:00");
                  const dateFormatted = new Intl.DateTimeFormat(undefined, {
                    weekday: "short",
                    month: "short",
                    day: "numeric",
                  }).format(dateObj);

                  return (
                    <button
                      key={dateFormatted}
                      onClick={() => navigateToDate(date)}
                      className="flex items-center gap-2 w-full text-left p-2 rounded hover:bg-gray-50 transition-colors cursor-pointer"
                      title={`Click to view ${dateFormatted}`}
                    >
                      <span className="font-medium min-w-[120px]">
                        {dateFormatted}:
                      </span>
                      <span className="text-gray-600">
                        {formatTime(Math.floor(interval.start / 60))} -{" "}
                        {formatTime(Math.floor(interval.end / 60))}
                      </span>
                    </button>
                  );
                })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export type AvailabilityScheduleProps = ComponentProps<
  typeof AvailabilitySchedule
>;
