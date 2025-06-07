import { AvailabilityInterval } from "@/lib/availability";

// Get short day names for tabs
export const getShortDayName = (date: Date) => {
  return new Intl.DateTimeFormat(undefined, { weekday: "short" }).format(date);
};

// Get short date format (DD/MM or MM/DD based on locale)
export const getShortDate = (date: Date) => {
  return new Intl.DateTimeFormat(undefined, {
    day: "numeric",
    month: "numeric",
  }).format(date);
};

// Get the first day of the week for the user's locale
export const getLocaleFirstDayOfWeek = () => {
  // Try modern Intl.Locale.getWeekInfo() API (Chrome 130+, Safari 17+)
  const locale = new Intl.Locale(navigator.language);
  if ('getWeekInfo' in locale && typeof locale.getWeekInfo === 'function') {
    const weekInfo = locale.getWeekInfo();
    // getWeekInfo returns 1=Monday, 7=Sunday, but getDay() returns 0=Sunday, 6=Saturday
    // Convert: 1->1, 2->2, ..., 6->6, 7->0
    return weekInfo.firstDay === 7 ? 0 : weekInfo.firstDay;
  }
  // Fallback to Monday for browsers without getWeekInfo
  return 1;
};

// Get week dates starting from the locale-appropriate day
export const getWeekDates = (currentDate: Date) => {
  const week: Date[] = [];
  const startOfWeek = new Date(currentDate);
  const currentDay = startOfWeek.getDay(); // 0=Sunday, 1=Monday, ..., 6=Saturday
  const localeFirstDay = getLocaleFirstDayOfWeek(); // 0=Sunday, 1=Monday
  
  // Calculate how many days to go back to reach the first day of the week
  let daysBack = currentDay - localeFirstDay;
  if (daysBack < 0) {
    daysBack += 7;
  }
  
  startOfWeek.setDate(startOfWeek.getDate() - daysBack);

  for (let i = 0; i < 7; i++) {
    const date = new Date(startOfWeek);
    date.setDate(startOfWeek.getDate() + i);
    week.push(date);
  }

  return week;
};

// Format date to ISO string (YYYY-MM-DD)
export const formatDateToISO = (dateOrString: Date | string) => {
  const date = new Date(dateOrString);
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const day = date.getDate().toString().padStart(2, "0");
  return `${year}-${month}-${day}`;
};

// Check if date is in the past
export const isDateInPast = (date: Date) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return date < today;
};

// Get week start from a given date
export const getWeekStartFromDate = (date: Date) => {
  const currentDay = date.getDay();
  const localeFirstDay = getLocaleFirstDayOfWeek();
  let daysBack = currentDay - localeFirstDay;
  if (daysBack < 0) {
    daysBack += 7;
  }
  const start = new Date(date);
  start.setDate(date.getDate() - daysBack);
  return start;
};

// Format time for display using Intl API
export const formatTime = (hour: number) => {
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

// Format week range for display
export const formatWeekRange = (weekDates: Date[]) => {
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

    const startDay = startDayFormatter.format(start);
    const endDay = endDayFormatter.format(end);

    // Extract month and year parts
    const parts = monthYearFormatter.formatToParts(start);
    const month = parts.find((p) => p.type === "month")?.value || "";
    const year = parts.find((p) => p.type === "year")?.value || "";

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

// Find interval containing a specific hour
export const findIntervalContainingHour = (
  intervals: AvailabilityInterval[],
  hour: number
): AvailabilityInterval | null => {
  const timeInMinutes = hour * 60;
  return intervals.find(
    (interval) =>
      timeInMinutes >= interval.start && timeInMinutes < interval.end
  ) || null;
};

// Check if a time slot is selected
export const isTimeInInterval = (
  intervals: AvailabilityInterval[],
  hour: number
): boolean => {
  return findIntervalContainingHour(intervals, hour) !== null;
};