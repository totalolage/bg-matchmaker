import { useEffect,useState } from "react";

import type { GameSearchResult } from "@/components/game-library/types";
import { api } from "@convex/_generated/api";
import { useQuery } from "convex/react";

interface UsePaginatedSearchOptions {
  searchQuery: string;
  itemsPerPage?: number;
}

interface UsePaginatedSearchReturn {
  results: GameSearchResult[];
  isLoading: boolean;
  hasMore: boolean;
  loadMore: () => void;
  reset: () => void;
  totalLoaded: number;
  retry: () => void;
  error?: Error;
}

export function usePaginatedSearch({
  searchQuery,
  itemsPerPage = 10,
}: UsePaginatedSearchOptions): UsePaginatedSearchReturn {
  const [cursor, setCursor] = useState<string | null>(null);
  const [allResults, setAllResults] = useState<GameSearchResult[]>([]);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // Query for paginated results
  const paginatedResults = useQuery(
    api.games.searchGamesPaginated,
    searchQuery.trim().length >= 2
      ? {
          query: searchQuery,
          paginationOpts: {
            numItems: itemsPerPage,
            cursor,
          },
        }
      : "skip",
  );

  // Reset results when search query changes
  useEffect(() => {
    setAllResults([]);
    setCursor(null);
    setIsLoadingMore(false);
  }, [searchQuery]);

  // Append new results to existing ones
  useEffect(() => {
    if (paginatedResults && paginatedResults.page.length > 0) {
      if (cursor === null) {
        // First page, replace all results
        setAllResults(paginatedResults.page);
      } else {
        // Subsequent pages, append results
        setAllResults((prev) => {
          // Avoid duplicates by checking bggId
          const existingIds = new Set(prev.map((r) => r.bggId));
          const newResults = paginatedResults.page.filter(
            (r) => !existingIds.has(r.bggId),
          );
          return [...prev, ...newResults];
        });
      }
      setIsLoadingMore(false);
    } else if (paginatedResults && paginatedResults.page.length === 0) {
      setIsLoadingMore(false);
    }
  }, [paginatedResults, cursor]);

  const loadMore = () => {
    if (paginatedResults && !paginatedResults.isDone && !isLoadingMore) {
      setIsLoadingMore(true);
      setCursor(paginatedResults.continueCursor);
    }
  };

  const reset = () => {
    setAllResults([]);
    setCursor(null);
    setIsLoadingMore(false);
  };

  const retry = () => {
    // Force re-query by updating cursor
    if (cursor) {
      const tempCursor = cursor;
      setCursor(null);
      setTimeout(() => setCursor(tempCursor), 0);
    }
  };

  const isLoading = !paginatedResults && searchQuery.trim().length >= 2;
  const hasMore = !!paginatedResults && !paginatedResults.isDone;

  return {
    results: allResults,
    isLoading,
    hasMore,
    loadMore,
    reset,
    totalLoaded: allResults.length,
    retry,
    error: undefined,
  };
}
