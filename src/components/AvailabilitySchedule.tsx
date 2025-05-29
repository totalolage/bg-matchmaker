import { useState } from "react";

export function AvailabilitySchedule() {
  const [selectedDates, setSelectedDates] = useState<string[]>([]);

  return (
    <div className="p-4">
      <h3 className="text-lg font-semibold mb-2">Availability Schedule</h3>
      <p className="text-sm text-gray-600">Select your available dates</p>
      {/* TODO: Implement calendar component */}
    </div>
  );
}