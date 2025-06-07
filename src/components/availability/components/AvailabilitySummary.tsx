import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatTime } from "../utils";
import { Doc } from "@convex/_generated/dataModel";

interface AvailabilitySummaryProps {
  selectedSlots: Doc<"users">["availability"];
  onDateClick: (date: string) => void;
}

export const AvailabilitySummary = ({
  selectedSlots,
  onDateClick,
}: AvailabilitySummaryProps) => {
  if (selectedSlots.length === 0) {
    return null;
  }

  return (
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
            .map(({ date, interval }) => {
              const dateObj = new Date(date + "T00:00:00");
              const dateFormatted = new Intl.DateTimeFormat(undefined, {
                weekday: "short",
                month: "short",
                day: "numeric",
              }).format(dateObj);

              return (
                <button
                  key={`${date}-${interval.start}-${interval.end}`}
                  onClick={() => onDateClick(date)}
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
  );
};
