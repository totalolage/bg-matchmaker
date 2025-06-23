import { Check, Heart, List, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface FilterOption {
  value: string;
  label: string;
  icon: React.ComponentType<{ size?: number | string; className?: string }>;
  color?: string;
}

const filterOptions: FilterOption[] = [
  { value: "all", label: "All Sessions", icon: List, color: "text-gray-600" },
  {
    value: "interested",
    label: "Interested",
    icon: Heart,
    color: "text-pink-600",
  },
  { value: "declined", label: "Declined", icon: X, color: "text-red-600" },
  {
    value: "accepted",
    label: "Accepted",
    icon: Check,
    color: "text-green-600",
  },
];

interface SessionHistoryFilterProps {
  selectedFilters: string[];
  onFilterChange: (filters: string[]) => void;
}

export function SessionHistoryFilter({
  selectedFilters,
  onFilterChange,
}: SessionHistoryFilterProps) {
  const handleFilterClick = (value: string) => {
    if (value === "all") {
      onFilterChange(["all"]);
    } else {
      const newFilters = selectedFilters.includes(value)
        ? selectedFilters.filter(f => f !== value && f !== "all")
        : [...selectedFilters.filter(f => f !== "all"), value];

      onFilterChange(newFilters.length === 0 ? ["all"] : newFilters);
    }
  };

  return (
    <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
      {filterOptions.map(option => {
        const Icon = option.icon;
        const isSelected = selectedFilters.includes(option.value);

        return (
          <Button
            key={option.value}
            variant={isSelected ? "default" : "outline"}
            size="sm"
            onClick={() => handleFilterClick(option.value)}
            className={cn(
              "flex items-center gap-1.5 whitespace-nowrap",
              isSelected &&
                option.value !== "all" &&
                "bg-purple-600 hover:bg-purple-700 border-purple-600",
              !isSelected && option.color
            )}
          >
            <Icon size={16} className={cn(isSelected && "text-white")} />
            {option.label}
          </Button>
        );
      })}
    </div>
  );
}
