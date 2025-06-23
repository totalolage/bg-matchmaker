import { Doc } from "@convex/_generated/dataModel";

import { HOURS } from "@/components/availability/constants";
import {
  findIntervalContainingHour,
  formatTime,
  isDateInPast,
} from "@/components/availability/utils";
import { TimeSlotButton } from "@/components/TimeSlotButton";
import {
  AvailabilityInterval,
  getAvailabilityForDate,
} from "@/lib/availability";

interface TimeGridProps {
  date: Date;
  selectedSlots: Doc<"users">["availability"];
  selectedTime: { date: string; hour: number } | null;
  hoveredTime: { date: string; hour: number } | null;
  isTimeSelected: (date: string, hour: number) => boolean;
  isSlotSelected: (date: string, hour: number) => boolean;
  isSlotCommitted: (date: string, hour: number) => boolean;
  isInHoverRange: (date: string, hour: number) => boolean;
  onSlotClick: (date: string, hour: number) => void;
  onSlotHover: (time: { date: string; hour: number } | null) => void;
}

export const TimeGrid = ({
  date,
  selectedSlots,
  selectedTime,
  hoveredTime,
  isTimeSelected,
  isSlotSelected,
  isSlotCommitted,
  isInHoverRange,
  onSlotClick,
  onSlotHover,
}: TimeGridProps) => {
  const dateISO = date.toISOString().split("T")[0];
  const isPast = isDateInPast(date);

  return (
    <div className="grid grid-cols-12 gap-1">
      {HOURS.map(hour => {
        const timeString = formatTime(hour);
        const isSelected = dateISO ? isTimeSelected(dateISO, hour) : false;
        const isConfirmed = dateISO ? isSlotSelected(dateISO, hour) : false;
        const isCommitted = dateISO ? isSlotCommitted(dateISO, hour) : false;
        const inHoverRange = dateISO ? isInHoverRange(dateISO, hour) : false;

        // Find which interval contains the hovered time (only when not selecting)
        let hoveredIntervalToDelete: AvailabilityInterval | null = null;
        if (hoveredTime && !selectedTime) {
          const intervals = getAvailabilityForDate(
            selectedSlots,
            hoveredTime.date,
          );
          const foundInterval = findIntervalContainingHour(
            intervals,
            hoveredTime.hour,
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
          | "committed"
          | "disabled"
          | "hoverRange"
          | "hoverDelete" = "default";

        if (isPast) {
          buttonState = "disabled";
        } else if (isCommitted) {
          buttonState = "committed";
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
            onClick={() => dateISO && onSlotClick(dateISO, hour)}
            onMouseEnter={() => dateISO && onSlotHover({ date: dateISO, hour })}
            onMouseLeave={() => onSlotHover(null)}
            disabled={isPast}
          />
        );
      })}
    </div>
  );
};
