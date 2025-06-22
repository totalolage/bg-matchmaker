/**
 * Utility functions for interval-based availability storage
 * Optimized for efficient merging and querying without loops
 */

export type AvailabilityInterval = {
  start: number; // minutes since midnight (0-1439)
  end: number;   // minutes since midnight (0-1439)
};

export type DayAvailability = {
  date: string; // ISO date string "YYYY-MM-DD"
  intervals: AvailabilityInterval[];
};

/**
 * Convert time string "HH:MM" to minutes since midnight
 */
export function timeToMinutes(timeString: string): number {
  const [hours, minutes] = timeString.split(':').map(Number);
  return (hours || 0) * 60 + (minutes || 0);
}

/**
 * Convert minutes since midnight to time string "HH:MM"
 */
export function minutesToTime(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
}


/**
 * Merge overlapping and adjacent intervals efficiently
 * Uses sorting and single pass - O(n log n) complexity
 */
export function mergeIntervals(intervals: AvailabilityInterval[]): AvailabilityInterval[] {
  if (intervals.length <= 1) return intervals;
  
  // Sort by start time
  const sorted = [...intervals].sort((a, b) => a.start - b.start);
  const firstInterval = sorted[0];
  if (!firstInterval) return [];
  
  const merged: AvailabilityInterval[] = [firstInterval];
  
  for (let i = 1; i < sorted.length; i++) {
    const current = sorted[i];
    const last = merged[merged.length - 1];
    
    if (!current || !last) continue;
    
    // Check if intervals overlap or are adjacent
    if (current.start <= last.end) {
      // Merge intervals
      last.end = Math.max(last.end, current.end);
    } else {
      // No overlap, add new interval
      merged.push(current);
    }
  }
  
  return merged;
}

/**
 * Add a new interval to existing intervals for a day
 * Returns merged intervals
 */
export function addInterval(
  existingIntervals: AvailabilityInterval[],
  newInterval: AvailabilityInterval
): AvailabilityInterval[] {
  return mergeIntervals([...existingIntervals, newInterval]);
}

/**
 * Remove an interval from existing intervals
 * Handles partial overlaps by splitting intervals
 */
export function removeInterval(
  existingIntervals: AvailabilityInterval[],
  intervalToRemove: AvailabilityInterval
): AvailabilityInterval[] {
  const result: AvailabilityInterval[] = [];
  
  for (const existing of existingIntervals) {
    // No overlap - keep the interval
    if (existing.end <= intervalToRemove.start || existing.start >= intervalToRemove.end) {
      result.push(existing);
      continue;
    }
    
    // Partial overlap - may need to split
    // Keep part before the removal interval
    if (existing.start < intervalToRemove.start) {
      result.push({
        start: existing.start,
        end: Math.min(existing.end, intervalToRemove.start)
      });
    }
    
    // Keep part after the removal interval
    if (existing.end > intervalToRemove.end) {
      result.push({
        start: Math.max(existing.start, intervalToRemove.end),
        end: existing.end
      });
    }
  }
  
  return result;
}

/**
 * Check if a specific time (in minutes) is available
 */
export function isTimeAvailable(intervals: AvailabilityInterval[], timeInMinutes: number): boolean {
  return intervals.some(interval => 
    timeInMinutes >= interval.start && timeInMinutes < interval.end
  );
}

/**
 * Find all available time slots of a specific duration within intervals
 */
export function findAvailableSlots(
  intervals: AvailabilityInterval[],
  durationMinutes: number,
  granularityMinutes: number = 15
): AvailabilityInterval[] {
  const slots: AvailabilityInterval[] = [];
  
  for (const interval of intervals) {
    const duration = interval.end - interval.start;
    if (duration < durationMinutes) continue;
    
    // Generate slots within this interval
    for (let start = interval.start; start + durationMinutes <= interval.end; start += granularityMinutes) {
      slots.push({
        start,
        end: start + durationMinutes
      });
    }
  }
  
  return slots;
}

/**
 * Get intersection of two sets of intervals (useful for matching availability)
 */
export function intersectIntervals(
  intervalsA: AvailabilityInterval[],
  intervalsB: AvailabilityInterval[]
): AvailabilityInterval[] {
  const result: AvailabilityInterval[] = [];
  
  for (const a of intervalsA) {
    for (const b of intervalsB) {
      const start = Math.max(a.start, b.start);
      const end = Math.min(a.end, b.end);
      
      if (start < end) {
        result.push({ start, end });
      }
    }
  }
  
  return mergeIntervals(result);
}

/**
 * Update availability for a specific date
 * Creates new day availability or updates existing one
 */
export function updateDayAvailability(
  availability: DayAvailability[],
  date: string,
  intervals: AvailabilityInterval[]
): DayAvailability[] {
  const merged = mergeIntervals(intervals);
  const existingIndex = availability.findIndex(day => day.date === date);
  
  if (existingIndex >= 0) {
    // Update existing day
    const updated = [...availability];
    if (merged.length === 0) {
      // Remove day if no intervals
      updated.splice(existingIndex, 1);
    } else {
      updated[existingIndex] = { date, intervals: merged };
    }
    return updated;
  } else if (merged.length > 0) {
    // Add new day
    return [...availability, { date, intervals: merged }].sort((a, b) => a.date.localeCompare(b.date));
  }
  
  return availability;
}

/**
 * Get availability for a specific date
 */
export function getAvailabilityForDate(
  availability: DayAvailability[],
  date: string
): AvailabilityInterval[] {
  const day = availability.find(d => d.date === date);
  return day ? day.intervals : [];
}