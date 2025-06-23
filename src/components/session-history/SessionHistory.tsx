import { useState } from "react";

import { SectionHeader } from "@/components/SectionHeader";

import { SessionHistoryList } from "./SessionHistoryList";

export function SessionHistory() {
  const [selectedFilters, setSelectedFilters] = useState<string[]>(["all"]);

  return (
    <>
      <SectionHeader title="Session History" />

      <SessionHistoryList
        selectedFilters={selectedFilters}
        onFilterChange={setSelectedFilters}
      />
    </>
  );
}
