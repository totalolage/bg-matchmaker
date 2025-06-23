import { useVirtualizer } from "@tanstack/react-virtual";
import { useEffect, useRef, useState } from "react";

import { usePaginatedQuery } from "convex/react";
import { api } from "@convex/_generated/api";

import { EmptyState } from "@/components/EmptyState";

import { SessionHistoryFilter } from "./SessionHistoryFilter";
import { SessionHistoryItem } from "./SessionHistoryItem";
import { SessionHistorySkeleton } from "./SessionHistorySkeleton";

interface VirtualizedSessionHistoryListProps {
  selectedFilters: string[];
  onFilterChange: (filters: string[]) => void;
}

const ITEM_HEIGHT = 180;
const ITEM_GAP = 12;
const ITEMS_PER_PAGE = 10;
const OVERSCAN = 3;

export function VirtualizedSessionHistoryList({
  selectedFilters,
  onFilterChange,
}: VirtualizedSessionHistoryListProps) {
  const parentRef = useRef<HTMLDivElement>(null);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  // Track previous filters to detect changes
  const prevFiltersRef = useRef(selectedFilters);

  // Reset on filter change
  useEffect(() => {
    const filtersChanged =
      JSON.stringify(prevFiltersRef.current) !==
      JSON.stringify(selectedFilters);
    if (filtersChanged) {
      setIsInitialLoad(true);
      prevFiltersRef.current = selectedFilters;
    }
  }, [selectedFilters]);

  const { results, status, isLoading, loadMore } = usePaginatedQuery(
    api.sessionInteractions.getUserSessionHistoryPaginated,
    { filters: selectedFilters },
    { initialNumItems: ITEMS_PER_PAGE },
  );

  const allItems = results || [];

  // Mark initial load as complete when we have data
  useEffect(() => {
    if (status === "CanLoadMore" || status === "Exhausted") {
      setIsInitialLoad(false);
    }
  }, [status]);

  const virtualizer = useVirtualizer({
    count: allItems.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => ITEM_HEIGHT,
    overscan: OVERSCAN,
    gap: ITEM_GAP,
  });

  const items = virtualizer.getVirtualItems();

  // Load more when scrolling near the bottom
  useEffect(() => {
    const [lastItem] = [...items].reverse();

    if (!lastItem) {
      return;
    }

    if (
      lastItem.index >= allItems.length - 1 &&
      status === "CanLoadMore" &&
      !isLoading
    ) {
      loadMore(ITEMS_PER_PAGE);
    }
  }, [items, allItems.length, status, isLoading, loadMore]);

  // Handle initial loading state
  if (isInitialLoad && isLoading) {
    return (
      <div>
        <SessionHistoryFilter
          selectedFilters={selectedFilters}
          onFilterChange={onFilterChange}
        />
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <SessionHistorySkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  const filterLabel =
    selectedFilters.includes("all") ? "sessions" : (
      selectedFilters.join(", ") + " sessions"
    );

  // Handle empty state
  if (!isLoading && allItems.length === 0) {
    return (
      <div>
        <SessionHistoryFilter
          selectedFilters={selectedFilters}
          onFilterChange={onFilterChange}
        />
        <EmptyState
          emoji="📅"
          title={`No ${filterLabel} found`}
          subtitle={
            selectedFilters.includes("all") ?
              "Your session history will appear here once you interact with sessions"
            : "Try selecting different filters to see more sessions"
          }
        />
      </div>
    );
  }

  return (
    <div>
      <SessionHistoryFilter
        selectedFilters={selectedFilters}
        onFilterChange={onFilterChange}
      />

      <div
        ref={parentRef}
        className="h-[600px] overflow-auto"
        style={{
          contain: "strict",
        }}
      >
        <div
          style={{
            height: virtualizer.getTotalSize(),
            width: "100%",
            position: "relative",
          }}
        >
          {items.map(virtualItem => {
            const item = allItems[virtualItem.index];
            const isLoaderRow = virtualItem.index > allItems.length - 1;

            return (
              <div
                key={virtualItem.key}
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  height: `${virtualItem.size}px`,
                  transform: `translateY(${virtualItem.start}px)`,
                }}
              >
                {isLoaderRow ?
                  <SessionHistorySkeleton />
                : item ?
                  <SessionHistoryItem
                    interaction={item.interaction}
                    session={item.session}
                  />
                : null}
              </div>
            );
          })}

          {/* Loading more indicator */}
          {status === "CanLoadMore" && isLoading && (
            <div
              style={{
                position: "absolute",
                top: virtualizer.getTotalSize(),
                left: 0,
                width: "100%",
              }}
            >
              <div className="space-y-3 pt-3">
                {Array.from({ length: 2 }).map((_, i) => (
                  <SessionHistorySkeleton key={`loader-${i}`} />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
