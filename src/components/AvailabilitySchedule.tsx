import { useState, useEffect, ComponentProps, useImperativeHandle, Ref } from "react";
import { Save, ChevronLeft, ChevronRight, CalendarIcon } from "lucide-react";
import { Button } from "./ui/button";
import { cn } from "../lib/utils";
import { Doc } from "../../convex/_generated/dataModel";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Calendar } from "./ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "./ui/popover";
import { TimeSlotButton } from "./TimeSlotButton";

type TimeSlot = {
  date: string; // ISO date string
  startTime: string;
  endTime: string;
};

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
    month: "numeric"
  }).format(date);
};

// Get week dates starting from Sunday
const getWeekDates = (currentDate: Date) => {
  const week: Date[] = [];
  const startOfWeek = new Date(currentDate);
  const day = startOfWeek.getDay();
  startOfWeek.setDate(startOfWeek.getDate() - day); // Go to Sunday
  
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

export const AvailabilitySchedule = ({ user, ref }: { user: Doc<"users">; ref?: Ref<DatePickerRef> }) => {
  const [currentWeekStart, setCurrentWeekStart] = useState(() => {
    const today = new Date();
    const day = today.getDay();
    const start = new Date(today);
    start.setDate(today.getDate() - day);
    return start;
  });
  
  const [selectedSlots, setSelectedSlots] = useState<TimeSlot[]>(
    user.availability,
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
    // Start with current day selected
    const today = new Date();
    return today.getDay(); // 0 = Sunday, 6 = Saturday
  });
  const [previousDayIndex, setPreviousDayIndex] = useState(selectedDayIndex);
  const [animationDirection, setAnimationDirection] = useState<'left' | 'right' | null>(null);
  const [animationKey, setAnimationKey] = useState(0);
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
    setSelectedSlots(user.availability);
  }, [user.availability]);

  const weekDates = getWeekDates(currentWeekStart);
  const selectedDate = weekDates[selectedDayIndex];
  const selectedDateISO = formatDateToISO(selectedDate);

  const isSlotSelected = (date: string, hour: number) => {
    return selectedSlots.some(
      (slot) =>
        slot.date === date &&
        parseInt(slot.startTime) <= hour &&
        parseInt(slot.endTime) > hour,
    );
  };

  const isTimeSelected = (date: string, hour: number) => {
    return selectedTime?.date === date && selectedTime?.hour === hour;
  };

  const isInHoverRange = (date: string, hour: number) => {
    if (!selectedTime || !hoveredTime || selectedTime.date !== date || hoveredTime.date !== date) {
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
      // Create a 1-hour slot at this exact time
      const newSlot: TimeSlot = {
        date,
        startTime: `${hour.toString().padStart(2, "0")}:00`,
        endTime: `${(hour + 1).toString().padStart(2, "0")}:00`,
      };

      setSelectedSlots((slots) => {
        // Add and merge the new slot
        const mergedSlots = mergeSlots([...slots, newSlot], date);
        return mergedSlots;
      });
      setSelectedTime(null);
      return;
    }

    // Case 2: If another time is selected (creating a range)
    if (selectedTime && selectedTime.date === date) {
      // Create a time slot from the lower to upper time
      const startHour = Math.min(selectedTime.hour, hour);
      const endHour = Math.max(selectedTime.hour, hour) + 1;

      const newSlot: TimeSlot = {
        date,
        startTime: `${startHour.toString().padStart(2, "0")}:00`,
        endTime: `${endHour.toString().padStart(2, "0")}:00`,
      };

      setSelectedSlots((slots) => {
        // Add and merge the new slot (this will merge with existing slots if they overlap)
        const mergedSlots = mergeSlots([...slots, newSlot], date);
        return mergedSlots;
      });
      setSelectedTime(null);
      return;
    }

    // Case 3: If this time is part of an existing time slot (dark purple) and no selection active
    if (isSlotSelected(date, hour) && !selectedTime) {
      // Delete the whole time slot containing this hour
      setSelectedSlots((slots) => {
        return slots.filter(
          (slot) =>
            !(
              slot.date === date &&
              parseInt(slot.startTime) <= hour &&
              parseInt(slot.endTime) > hour
            ),
        );
      });
      setSelectedTime(null);
      return;
    }

    // Case 4: No other time is selected
    setSelectedTime({ date, hour });
  };

  // Helper function to merge overlapping or adjacent slots for a specific date
  const mergeSlots = (slots: TimeSlot[], date: string): TimeSlot[] => {
    // Separate slots by date
    const slotsForOtherDates = slots.filter(slot => slot.date !== date);
    const slotsForDate = slots.filter(slot => slot.date === date);
    
    if (slotsForDate.length === 0) {
      return slots;
    }
    
    // Create events for each start and end time
    type TimeEvent = {
      hour: number;
      type: 'start' | 'end';
    };
    
    const events: TimeEvent[] = [];
    slotsForDate.forEach(slot => {
      events.push({ hour: parseInt(slot.startTime), type: 'start' });
      events.push({ hour: parseInt(slot.endTime), type: 'end' });
    });
    
    // Sort events by hour, with 'start' events before 'end' events at the same hour
    events.sort((a, b) => {
      if (a.hour !== b.hour) return a.hour - b.hour;
      // If same hour, process 'end' before 'start' to handle adjacent slots
      return a.type === 'end' ? -1 : 1;
    });
    
    // Remove adjacent end+start pairs
    const filteredEvents: TimeEvent[] = [];
    for (let i = 0; i < events.length; i++) {
      if (i < events.length - 1 && 
          events[i].type === 'end' && 
          events[i + 1].type === 'start' && 
          events[i].hour === events[i + 1].hour) {
        // Skip both the end and start event
        i++;
      } else {
        filteredEvents.push(events[i]);
      }
    }
    
    // Walk through events to create merged slots
    const mergedSlotsForDate: TimeSlot[] = [];
    let openCount = 0;
    let currentSlotStart: number | null = null;
    
    filteredEvents.forEach(event => {
      if (event.type === 'start') {
        if (openCount === 0) {
          // Starting a new slot
          currentSlotStart = event.hour;
        }
        openCount++;
      } else { // event.type === 'end'
        openCount--;
        if (openCount === 0 && currentSlotStart !== null) {
          // Closing the current slot
          mergedSlotsForDate.push({
            date,
            startTime: `${currentSlotStart.toString().padStart(2, "0")}:00`,
            endTime: `${event.hour.toString().padStart(2, "0")}:00`,
          });
          currentSlotStart = null;
        }
      }
    });
    
    return [...slotsForOtherDates, ...mergedSlotsForDate];
  };


  const handleSave = async () => {
    try {
      // Group slots by date
      const slotsByDate = new Map<string, TimeSlot[]>();
      selectedSlots.forEach(slot => {
        const existing = slotsByDate.get(slot.date) || [];
        existing.push(slot);
        slotsByDate.set(slot.date, existing);
      });
      
      // Merge slots for each date
      const mergedSlots: TimeSlot[] = [];
      slotsByDate.forEach((slotsForDate, date) => {
        const merged = mergeSlots(slotsForDate, date);
        // Only keep slots for the current date
        mergedSlots.push(...merged.filter(s => s.date === date));
      });

      await updateAvailability({ availability: mergedSlots });
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
    setSelectedTime(null); // Clear selection when navigating
    setHoveredTime(null); // Clear hover state
    // Animate from left when going to previous week
    setAnimationDirection('left');
    setPreviousDayIndex(selectedDayIndex);
    setAnimationKey(prev => prev + 1);
  };

  const goToNextWeek = () => {
    const newStart = new Date(currentWeekStart);
    newStart.setDate(newStart.getDate() + 7);
    setCurrentWeekStart(newStart);
    setSelectedTime(null); // Clear selection when navigating
    setHoveredTime(null); // Clear hover state
    // Animate from right when going to next week
    setAnimationDirection('right');
    setPreviousDayIndex(selectedDayIndex);
    setAnimationKey(prev => prev + 1);
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
      const month = parts.find(p => p.type === 'month')?.value || '';
      const year = parts.find(p => p.type === 'year')?.value || '';
      
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
                Click times to select availability. Click again to confirm or extend selection.
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
                      // Calculate the start of the week for the selected date
                      const day = date.getDay();
                      const weekStart = new Date(date);
                      weekStart.setDate(date.getDate() - day);
                      setCurrentWeekStart(weekStart);
                      
                      // Select the day in the tabs
                      const dayIndex = day;
                      // Determine animation direction based on week change
                      const weekDiff = weekStart.getTime() - currentWeekStart.getTime();
                      if (weekDiff !== 0) {
                        setAnimationDirection(weekDiff > 0 ? 'right' : 'left');
                      } else {
                        setAnimationDirection(dayIndex > selectedDayIndex ? 'right' : 'left');
                      }
                      setPreviousDayIndex(selectedDayIndex);
                      setSelectedDayIndex(dayIndex);
                      setAnimationKey(prev => prev + 1);
                      
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
              // Determine animation direction
              const newDirection = newIndex > selectedDayIndex ? 'right' : 'left';
              setAnimationDirection(newDirection);
              setPreviousDayIndex(selectedDayIndex);
              setSelectedDayIndex(newIndex);
              setAnimationKey(prev => prev + 1);
              setSelectedTime(null); // Clear selection when switching days
              setHoveredTime(null); // Clear hover state
            }} 
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-7 h-auto p-1">
              {weekDates.map((date, index) => {
                const isPast = isDateInPast(date);
                const isToday = formatDateToISO(date) === formatDateToISO(new Date());
                
                return (
                  <TabsTrigger
                    key={index}
                    value={index.toString()}
                    className={cn(
                      "text-xs flex flex-col gap-0.5 py-2 px-1 min-h-[3.5rem]",
                      isPast && "opacity-50",
                      isToday && "ring-2 ring-purple-500 ring-offset-2"
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

            <AnimatePresence mode="wait" initial={false}>
              {weekDates.map((date, dayIndex) => {
                const dateISO = formatDateToISO(date);
                const isPast = isDateInPast(date);
                
                if (dayIndex !== selectedDayIndex) return null;
                
                return (
                  <TabsContent
                    key={`${dayIndex}-${animationKey}`}
                    value={dayIndex.toString()}
                    className="mt-4"
                    forceMount
                    asChild
                  >
                    <motion.div
                      custom={animationDirection}
                      initial={(custom) => ({ 
                        opacity: 0, 
                        x: custom === 'left' ? -50 : custom === 'right' ? 50 : 0 
                      })}
                      animate={{ opacity: 1, x: 0 }}
                      exit={(custom) => ({ 
                        opacity: 0, 
                        x: custom === 'left' ? 50 : custom === 'right' ? -50 : 0 
                      })}
                      transition={{ duration: 0.3, ease: "easeInOut" }}
                      className="grid grid-cols-12 gap-1"
                    >
                      {HOURS.map((hour) => {
                        const timeString = formatTime(hour);
                        const isSelected = isTimeSelected(dateISO, hour);
                        const isConfirmed = isSlotSelected(dateISO, hour);
                        const inHoverRange = isInHoverRange(dateISO, hour);
                        const isHoveredSlot = hoveredTime?.date === dateISO && hoveredTime?.hour === hour;
                        
                        // Find which slot contains the hovered time (only when not selecting)
                        let hoveredSlotToDelete: TimeSlot | null = null;
                        if (hoveredTime && !selectedTime) {
                          const foundSlot = selectedSlots.find(
                            slot =>
                              slot.date === hoveredTime.date &&
                              parseInt(slot.startTime) <= hoveredTime.hour &&
                              parseInt(slot.endTime) > hoveredTime.hour
                          );
                          if (foundSlot) {
                            hoveredSlotToDelete = foundSlot;
                          }
                        }
                        
                        // Check if this hour is part of the slot that would be deleted
                        const isPartOfDeleteSlot = hoveredSlotToDelete &&
                          hoveredSlotToDelete.date === dateISO &&
                          parseInt(hoveredSlotToDelete.startTime) <= hour &&
                          parseInt(hoveredSlotToDelete.endTime) > hour;
                        
                        let buttonState: "default" | "selected" | "confirmed" | "disabled" | "hoverRange" | "hoverDelete" = "default";
                        let showStripes = false;
                        
                        if (isPast) {
                          buttonState = "disabled";
                        } else if (isConfirmed) {
                          // If this slot is part of the one being hovered for deletion
                          if (isPartOfDeleteSlot) {
                            buttonState = "hoverDelete";
                            showStripes = true;
                          } else {
                            buttonState = "confirmed";
                          }
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
                            showDeleteStripes={showStripes}
                            onClick={() => handleSlotClick(dateISO, hour)}
                            onMouseEnter={() => setHoveredTime({ date: dateISO, hour })}
                            onMouseLeave={() => setHoveredTime(null)}
                            disabled={isPast}
                          />
                        );
                      })}
                    </motion.div>
                  </TabsContent>
                );
              })}
            </AnimatePresence>
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
                .sort((a, b) => a.date.localeCompare(b.date) || parseInt(a.startTime) - parseInt(b.startTime))
                .map((slot, i) => {
                  const date = new Date(slot.date + "T00:00:00");
                  const dateFormatted = new Intl.DateTimeFormat(undefined, {
                    weekday: "short",
                    month: "short",
                    day: "numeric",
                  }).format(date);
                  
                  return (
                    <div key={i} className="flex items-center gap-2">
                      <span className="font-medium min-w-[120px]">{dateFormatted}:</span>
                      <span className="text-gray-600">
                        {formatTime(parseInt(slot.startTime))} -{" "}
                        {formatTime(parseInt(slot.endTime))}
                      </span>
                    </div>
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
