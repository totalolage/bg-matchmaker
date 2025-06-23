import { CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react";

import { formatWeekRange } from "@/components/availability/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface WeekNavigationProps {
  weekDates: Date[];
  selectedDate: Date;
  datePickerOpen: boolean;
  onDatePickerChange: (open: boolean) => void;
  onDateSelect: (date: Date) => void;
  onPreviousWeek: () => void;
  onNextWeek: () => void;
}

export const WeekNavigation = ({
  weekDates,
  selectedDate,
  datePickerOpen,
  onDatePickerChange,
  onDateSelect,
  onPreviousWeek,
  onNextWeek,
}: WeekNavigationProps) => (
  <div className="flex items-center justify-between mb-4">
    <Button
      variant="ghost"
      size="sm"
      onClick={onPreviousWeek}
      className="h-8 px-2"
    >
      <ChevronLeft className="h-4 w-4" />
    </Button>

    <Popover open={datePickerOpen} onOpenChange={onDatePickerChange}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 px-3 text-sm font-medium hover:bg-gray-100"
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {formatWeekRange(weekDates)}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="center">
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={date => {
            if (date) {
              onDateSelect(date);
            }
          }}
          initialFocus
        />
      </PopoverContent>
    </Popover>

    <Button variant="ghost" size="sm" onClick={onNextWeek} className="h-8 px-2">
      <ChevronRight className="h-4 w-4" />
    </Button>
  </div>
);
