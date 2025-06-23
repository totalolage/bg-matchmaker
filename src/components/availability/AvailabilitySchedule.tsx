import { useDebouncer } from "@tanstack/react-pacer";
import { useMutation } from "@tanstack/react-query";
import { useRouter, useSearch } from "@tanstack/react-router";
import { Ref, useEffect, useImperativeHandle, useState } from "react";
import { toast } from "sonner";

import { useMutation as useConvexMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import { Doc } from "@convex/_generated/dataModel";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { TabsContent } from "@/components/ui/tabs";

import { AvailabilitySummary } from "./components/AvailabilitySummary";
import { TimeGrid } from "./components/TimeGrid";
import { WeekNavigation } from "./components/WeekNavigation";
import { WeekTabs } from "./components/WeekTabs";
import { useAvailabilitySelection } from "./hooks/useAvailabilitySelection";
import { useWeekNavigation } from "./hooks/useWeekNavigation";
// Local imports
import { DEBOUNCE_DELAY } from "./constants";
import { getLocaleFirstDayOfWeek, getWeekDates } from "./utils";

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
  const router = useRouter();
  const search = useSearch({ from: "/profile" });

  // Use availability directly from Convex query - no local state
  const selectedSlots = user.availability;

  // Debounced success notification
  const successDebouncer = useDebouncer(
    () => toast.success("Availability updated"),
    {
      wait: DEBOUNCE_DELAY,
      trailing: true,
      leading: false,
    },
  );

  // Mutation with debounced success notification
  const updateAvailability = useMutation({
    mutationFn: useConvexMutation(api.users.updateAvailability),
    onSuccess: () => {
      successDebouncer.maybeExecute();
    },
    onError: () => {
      toast.error("Failed to update availability");
    },
  });

  // Use custom hooks
  const {
    currentWeekStart,
    navigateToDate,
    goToPreviousWeek,
    goToNextWeek,
    navigateWithToast,
  } = useWeekNavigation(successDebouncer);

  const {
    selectedTime,
    hoveredTime,
    setHoveredTime,
    isSlotSelected,
    isSlotCommitted,
    isTimeSelected,
    isInHoverRange,
    handleSlotClick,
    clearSelection,
  } = useAvailabilitySelection(selectedSlots, availability =>
    updateAvailability.mutate({ availability }),
  );

  const [datePickerOpen, setDatePickerOpen] = useState(false);

  // Calculate selectedDayIndex from URL date
  const selectedDayIndex = (() => {
    if (!search.date) {
      // If no date in URL, use today
      const today = new Date();
      const currentDay = today.getDay();
      const localeFirstDay = getLocaleFirstDayOfWeek();
      return (currentDay - localeFirstDay + 7) % 7;
    }

    // Calculate day index from URL date
    const urlDate = new Date(search.date);
    const dayOfWeek = urlDate.getDay();
    const localeFirstDay = getLocaleFirstDayOfWeek();
    return (dayOfWeek - localeFirstDay + 7) % 7;
  })();

  // Show notification immediately on navigation
  useEffect(
    () =>
      router.subscribe("onBeforeNavigate", () => {
        if (successDebouncer.getIsPending()) {
          // Cancel the debounced notification
          successDebouncer.cancel();
          // Show immediately
          toast.success("Availability updated");
        }
      }),
    [router, successDebouncer],
  );

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
      toggle: () => setDatePickerOpen(prev => !prev),
      open: () => setDatePickerOpen(true),
      close: () => setDatePickerOpen(false),
    }),
    [datePickerOpen],
  );

  const weekDates = getWeekDates(currentWeekStart);
  const selectedDate = weekDates[selectedDayIndex];

  const handleDayChange = (dayIndex: number) => {
    const date = weekDates[dayIndex];
    if (date) {
      navigateWithToast(date);
      clearSelection();
    }
  };

  const handleDateSelect = (date: Date) => {
    navigateWithToast(date);
    clearSelection();
    setDatePickerOpen(false);
  };

  const handlePreviousWeek = () => {
    goToPreviousWeek();
    clearSelection();
  };

  const handleNextWeek = () => {
    goToNextWeek();
    clearSelection();
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
          </div>
        </CardHeader>
        <CardContent>
          <WeekNavigation
            weekDates={weekDates}
            selectedDate={selectedDate || new Date()}
            datePickerOpen={datePickerOpen}
            onDatePickerChange={setDatePickerOpen}
            onDateSelect={handleDateSelect}
            onPreviousWeek={handlePreviousWeek}
            onNextWeek={handleNextWeek}
          />

          <WeekTabs
            weekDates={weekDates}
            selectedDayIndex={selectedDayIndex}
            onDayChange={handleDayChange}
          >
            {weekDates.map((date, dayIndex) => {
              if (dayIndex !== selectedDayIndex) return null;

              return (
                <TabsContent
                  key={dayIndex}
                  value={dayIndex.toString()}
                  className="mt-4"
                >
                  <TimeGrid
                    date={date}
                    selectedSlots={selectedSlots}
                    selectedTime={selectedTime}
                    hoveredTime={hoveredTime}
                    isTimeSelected={isTimeSelected}
                    isSlotSelected={isSlotSelected}
                    isSlotCommitted={isSlotCommitted}
                    isInHoverRange={isInHoverRange}
                    onSlotClick={handleSlotClick}
                    onSlotHover={setHoveredTime}
                  />
                </TabsContent>
              );
            })}
          </WeekTabs>
        </CardContent>
      </Card>

      <AvailabilitySummary
        selectedSlots={selectedSlots}
        onDateClick={navigateToDate}
      />
    </div>
  );
};
