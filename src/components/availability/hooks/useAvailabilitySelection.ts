import { useState } from "react";

import {
  findIntervalContainingHour,
  isDateInPast,
} from "@/components/availability/utils";
import {
  addInterval,
  AvailabilityInterval,
  getAvailabilityForDate,
  removeInterval,
  updateDayAvailability,
} from "@/lib/availability";
import { Doc } from "@convex/_generated/dataModel";

interface SelectedTime {
  date: string;
  hour: number;
}

export const useAvailabilitySelection = (
  selectedSlots: Doc<"users">["availability"],
  onUpdate: (availability: Doc<"users">["availability"]) => void,
) => {
  const [selectedTime, setSelectedTime] = useState<SelectedTime | null>(null);
  const [hoveredTime, setHoveredTime] = useState<SelectedTime | null>(null);

  const isSlotSelected = (date: string, hour: number) => {
    const intervals = getAvailabilityForDate(selectedSlots, date);
    const timeInMinutes = hour * 60;
    return intervals.some(
      interval =>
        timeInMinutes >= interval.start &&
        timeInMinutes < interval.end &&
        interval.type !== "committed", // Don't count committed slots as selected
    );
  };

  const isSlotCommitted = (date: string, hour: number) => {
    const intervals = getAvailabilityForDate(selectedSlots, date);
    const timeInMinutes = hour * 60;
    return intervals.some(
      interval =>
        timeInMinutes >= interval.start &&
        timeInMinutes < interval.end &&
        interval.type === "committed",
    );
  };

  const isTimeSelected = (date: string, hour: number) =>
    selectedTime?.date === date && selectedTime?.hour === hour;

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

    // Case 1: If this exact time is already selected (light purple)
    if (isTimeSelected(date, hour)) {
      // Create a 1-hour interval at this exact time
      const newInterval: AvailabilityInterval = {
        start: hour * 60,
        end: (hour + 1) * 60,
      };

      const existingIntervals = getAvailabilityForDate(selectedSlots, date);
      const updatedIntervals = addInterval(existingIntervals, newInterval);
      const newSlots = updateDayAvailability(
        selectedSlots,
        date,
        updatedIntervals,
      );

      onUpdate(newSlots);
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

      const existingIntervals = getAvailabilityForDate(selectedSlots, date);
      const updatedIntervals = addInterval(existingIntervals, newInterval);
      const newSlots = updateDayAvailability(
        selectedSlots,
        date,
        updatedIntervals,
      );

      onUpdate(newSlots);
      setSelectedTime(null);
      return;
    }

    // Case 3: If this time is part of an existing time interval (dark purple) and no selection active
    if (isSlotSelected(date, hour) && !selectedTime) {
      // Find and remove the interval containing this hour
      const intervals = getAvailabilityForDate(selectedSlots, date);
      const intervalToRemove = findIntervalContainingHour(intervals, hour);

      if (intervalToRemove) {
        const updatedIntervals = removeInterval(intervals, intervalToRemove);
        const newSlots = updateDayAvailability(
          selectedSlots,
          date,
          updatedIntervals,
        );

        onUpdate(newSlots);
      }

      setSelectedTime(null);
      return;
    }

    // Case 4: No other time is selected
    setSelectedTime({ date, hour });
  };

  const clearSelection = () => {
    setSelectedTime(null);
    setHoveredTime(null);
  };

  return {
    selectedTime,
    hoveredTime,
    setHoveredTime,
    isSlotSelected,
    isSlotCommitted,
    isTimeSelected,
    isInHoverRange,
    handleSlotClick,
    clearSelection,
  };
};
