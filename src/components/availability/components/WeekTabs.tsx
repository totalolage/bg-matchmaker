import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

import {
  formatDateToISO,
  getShortDate,
  getShortDayName,
  isDateInPast,
} from "../utils";

interface WeekTabsProps {
  weekDates: Date[];
  selectedDayIndex: number;
  onDayChange: (dayIndex: number) => void;
  children: React.ReactNode;
}

export const WeekTabs = ({
  weekDates,
  selectedDayIndex,
  onDayChange,
  children,
}: WeekTabsProps) => {
  return (
    <Tabs
      value={selectedDayIndex.toString()}
      onValueChange={v => onDayChange(parseInt(v))}
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
      {children}
    </Tabs>
  );
};
