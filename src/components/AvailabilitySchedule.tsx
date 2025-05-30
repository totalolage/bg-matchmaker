import { useState, useEffect } from "react";
import { Save } from "lucide-react";
import { Button } from "./ui/button";
import { cn } from "../lib/utils";
import { Doc } from "../../convex/_generated/dataModel";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";

type TimeSlot = {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
};

interface AvailabilityScheduleProps {
  user: Doc<"users">;
}

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const HOURS = Array.from({ length: 24 }, (_, i) => i);

export function AvailabilitySchedule({ user }: AvailabilityScheduleProps) {
  const [selectedSlots, setSelectedSlots] = useState<TimeSlot[]>(user.availability);
  const updateAvailability = useMutation(api.users.updateAvailability);
  const [selectionStart, setSelectionStart] = useState<{ day: number; hour: number } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    setSelectedSlots(user.availability);
  }, [user.availability]);

  const isSlotSelected = (dayOfWeek: number, hour: number) => {
    return selectedSlots.some(slot => 
      slot.dayOfWeek === dayOfWeek && 
      parseInt(slot.startTime) <= hour && 
      parseInt(slot.endTime) > hour
    );
  };

  const handleSlotClick = (dayOfWeek: number, hour: number) => {
    if (!selectionStart) {
      // Start selection
      setSelectionStart({ day: dayOfWeek, hour });
      setIsDragging(true);
    } else if (isDragging) {
      // End selection
      const startHour = Math.min(selectionStart.hour, hour);
      const endHour = Math.max(selectionStart.hour, hour) + 1;
      
      if (selectionStart.day === dayOfWeek) {
        const newSlot: TimeSlot = {
          dayOfWeek,
          startTime: `${startHour.toString().padStart(2, '0')}:00`,
          endTime: `${endHour.toString().padStart(2, '0')}:00`,
        };
        
        // Toggle selection - if all hours in range are selected, deselect them
        const allSelected = Array.from({ length: endHour - startHour }, (_, i) => startHour + i)
          .every(h => isSlotSelected(dayOfWeek, h));
        
        if (allSelected) {
          // Remove the time slot
          setSelectedSlots(slots => {
            const newSlots = slots.filter(slot => 
              !(slot.dayOfWeek === dayOfWeek && 
                parseInt(slot.startTime) < endHour && 
                parseInt(slot.endTime) > startHour)
            );
            setHasChanges(true);
            return newSlots;
          });
        } else {
          // Add the time slot (merge with existing if needed)
          setSelectedSlots(slots => {
            setHasChanges(true);
            return [...slots, newSlot];
          });
        }
      }
      
      setSelectionStart(null);
      setIsDragging(false);
    }
  };

  const handleMouseEnter = (dayOfWeek: number, hour: number) => {
    if (isDragging && selectionStart && selectionStart.day === dayOfWeek) {
      // Visual feedback during drag can be added here
    }
  };

  const isInDragRange = (dayOfWeek: number, hour: number) => {
    if (!isDragging || !selectionStart || selectionStart.day !== dayOfWeek) return false;
    const minHour = Math.min(selectionStart.hour, hour);
    const maxHour = Math.max(selectionStart.hour, hour);
    return hour >= minHour && hour <= maxHour;
  };

  const handleSave = async () => {
    try {
      // Merge overlapping slots and sort by day and time
      const mergedSlots = selectedSlots.reduce<TimeSlot[]>((acc, slot) => {
        const existing = acc.find(s => 
          s.dayOfWeek === slot.dayOfWeek &&
          ((parseInt(s.startTime) <= parseInt(slot.startTime) && parseInt(s.endTime) >= parseInt(slot.startTime)) ||
           (parseInt(slot.startTime) <= parseInt(s.startTime) && parseInt(slot.endTime) >= parseInt(s.startTime)))
        );
        
        if (existing) {
          // Merge slots
          existing.startTime = `${Math.min(parseInt(existing.startTime), parseInt(slot.startTime)).toString().padStart(2, '0')}:00`;
          existing.endTime = `${Math.max(parseInt(existing.endTime), parseInt(slot.endTime)).toString().padStart(2, '0')}:00`;
        } else {
          acc.push(slot);
        }
        return acc;
      }, []);

      await updateAvailability({ availability: mergedSlots });
      setHasChanges(false);
      toast.success("Availability updated successfully");
    } catch (error) {
      toast.error("Failed to update availability");
    }
  };

  // Format time for display
  const formatTime = (hour: number) => {
    const period = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    return `${displayHour}${period}`;
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Weekly Availability</CardTitle>
              <CardDescription>
                Click and drag to select your available time slots
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
          <Tabs defaultValue="0" className="w-full">
            <TabsList className="grid w-full grid-cols-7">
              {DAYS.map((day, index) => (
                <TabsTrigger key={index} value={index.toString()} className="text-xs">
                  {day.slice(0, 3)}
                </TabsTrigger>
              ))}
            </TabsList>
            
            {DAYS.map((day, dayIndex) => (
              <TabsContent key={dayIndex} value={dayIndex.toString()} className="mt-4">
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-gray-700 mb-3">{day}</h4>
                  <div className="grid grid-cols-12 gap-1">
                    {HOURS.map(hour => (
                      <div
                        key={hour}
                        className={cn(
                          "col-span-3 h-10 border rounded-md cursor-pointer transition-all flex items-center justify-center text-xs font-medium",
                          isSlotSelected(dayIndex, hour) && "bg-purple-500 text-white border-purple-600",
                          isInDragRange(dayIndex, hour) && !isSlotSelected(dayIndex, hour) && "bg-purple-100 border-purple-300",
                          !isSlotSelected(dayIndex, hour) && !isInDragRange(dayIndex, hour) && "hover:bg-gray-50 border-gray-200"
                        )}
                        onClick={() => handleSlotClick(dayIndex, hour)}
                        onMouseEnter={() => handleMouseEnter(dayIndex, hour)}
                        onMouseUp={() => isDragging && handleSlotClick(dayIndex, hour)}
                      >
                        {formatTime(hour)}
                      </div>
                    ))}
                  </div>
                </div>
              </TabsContent>
            ))}
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
            <div className="space-y-1 text-sm">
              {DAYS.map((day, dayIndex) => {
                const daySlots = selectedSlots
                  .filter(slot => slot.dayOfWeek === dayIndex)
                  .sort((a, b) => parseInt(a.startTime) - parseInt(b.startTime));
                
                if (daySlots.length === 0) return null;
                
                return (
                  <div key={dayIndex} className="flex items-center gap-2">
                    <span className="font-medium w-24">{day}:</span>
                    <span className="text-gray-600">
                      {daySlots.map((slot, i) => (
                        <span key={i}>
                          {i > 0 && ", "}
                          {formatTime(parseInt(slot.startTime))} - {formatTime(parseInt(slot.endTime))}
                        </span>
                      ))}
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
}