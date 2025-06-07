import type { ExpertiseLevelOption } from "./types";

export const EXPERTISE_LEVELS: ExpertiseLevelOption[] = [
  { value: "novice", label: "Novice", color: "bg-gray-100 text-gray-800" },
  {
    value: "beginner",
    label: "Beginner",
    color: "bg-blue-100 text-blue-800",
  },
  {
    value: "intermediate",
    label: "Intermediate",
    color: "bg-green-100 text-green-800",
  },
  {
    value: "advanced",
    label: "Advanced",
    color: "bg-yellow-100 text-yellow-800",
  },
  {
    value: "expert",
    label: "Expert",
    color: "bg-purple-100 text-purple-800",
  },
];

export const SEARCH_DEBOUNCE_MS = 500;
export const MIN_SEARCH_LENGTH = 2;