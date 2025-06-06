import { useNavigate, useLocation, useSearch } from "@tanstack/react-router";
import { formatDateToISO, getWeekStartFromDate } from "../utils";
import { Debouncer } from "@tanstack/react-pacer";
import { toast } from "sonner";

export const useWeekNavigation = (successDebouncer: Debouncer<() => void>) => {
  const navigate = useNavigate();
  const location = useLocation();
  const search = useSearch({ from: "/profile" });

  // Initialize currentWeekStart based on URL or today
  const currentWeekStart = (() => {
    if (search.date) {
      const parsedDate = new Date(search.date);
      if (!isNaN(parsedDate.getTime())) {
        return getWeekStartFromDate(parsedDate);
      }
    }
    return getWeekStartFromDate(new Date());
  })();

  // Navigate to a specific date
  const navigateToDate = (date: string | Date) => {
    void navigate({
      to: ".",
      search: { date: formatDateToISO(date) },
      hash: location.hash,
      replace: true,
      viewTransition: false,
    });
  };

  // Update URL when week changes
  const setCurrentWeekStart = (newWeekStart: Date) => {
    navigateToDate(newWeekStart);
  };

  // Navigation functions with debounce handling
  const goToPreviousWeek = () => {
    // Show success notification immediately if we have pending changes
    if (successDebouncer.getIsPending()) {
      successDebouncer.cancel();
      toast.success("Availability updated");
    }
    
    const newStart = new Date(currentWeekStart);
    newStart.setDate(newStart.getDate() - 7);
    setCurrentWeekStart(newStart);
  };

  const goToNextWeek = () => {
    // Show success notification immediately if we have pending changes
    if (successDebouncer.getIsPending()) {
      successDebouncer.cancel();
      toast.success("Availability updated");
    }
    
    const newStart = new Date(currentWeekStart);
    newStart.setDate(newStart.getDate() + 7);
    setCurrentWeekStart(newStart);
  };

  const navigateWithToast = (date: Date) => {
    if (successDebouncer.getIsPending()) {
      successDebouncer.cancel();
      toast.success("Availability updated");
    }
    navigateToDate(date);
  };

  return {
    currentWeekStart,
    navigateToDate,
    goToPreviousWeek,
    goToNextWeek,
    navigateWithToast,
  };
};