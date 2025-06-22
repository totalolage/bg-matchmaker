import { useNavigate, useSearch } from "@tanstack/react-router";
import { useEffect, useState } from "react";

import type { GameSearchResult } from "@/components/game-library/types";
import { api } from "@convex/_generated/api";
import { useQuery } from "convex/react";

interface SearchParams {
  q?: string;
  cursor?: string;
  page?: number;
}

interface UsePaginatedSearchWithParamsOptions {
  itemsPerPage?: number;
  enableUrlParams?: boolean;
}

interface UsePaginatedSearchWithParamsReturn {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  results: GameSearchResult[];
  isLoading: boolean;
  hasMore: boolean;
  loadMore: () => void;
  reset: () => void;
  totalLoaded: number;
  currentPage: number;
}

const SEARCH_RESULTS_CACHE = new Map<string, {
  results: GameSearchResult[];
  cursor: string | null;
  timestamp: number;
}>();

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export function usePaginatedSearchWithParams({
  itemsPerPage = 10,
  enableUrlParams = true,
}: UsePaginatedSearchWithParamsOptions = {}): UsePaginatedSearchWithParamsReturn {
  const navigate = useNavigate();
  const urlParams = useSearch({ strict: false }) as SearchParams;
  
  // Initialize state from URL params if enabled
  const [searchQuery, setSearchQueryState] = useState(
    enableUrlParams && urlParams.q ? urlParams.q : "",
  );
  const [cursor, setCursor] = useState<string | null>(
    enableUrlParams && urlParams.cursor ? urlParams.cursor : null,
  );
  const [currentPage, setCurrentPage] = useState(
    enableUrlParams && urlParams.page ? Number(urlParams.page) : 1,
  );
  const [allResults, setAllResults] = useState<GameSearchResult[]>([]);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // Create cache key based on search query and page
  const cacheKey = `${searchQuery}-${currentPage}`;

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

  // Update URL params when search changes
  useEffect(() => {
    if (!enableUrlParams) return;

    const params: Record<string, string | undefined> = {};
    if (searchQuery) params.q = searchQuery;
    if (cursor) params.cursor = cursor;
    if (currentPage > 1) params.page = currentPage.toString();

    void navigate({
      search: params as any,
      replace: true,
    });
  }, [searchQuery, cursor, currentPage, enableUrlParams, navigate]);

  // Check cache before loading
  useEffect(() => {
    const cached = SEARCH_RESULTS_CACHE.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      setAllResults(cached.results);
      setCursor(cached.cursor);
    }
  }, [cacheKey]);

  // Reset results when search query changes
  useEffect(() => {
    setAllResults([]);
    setCursor(null);
    setCurrentPage(1);
    setIsLoadingMore(false);
    // Clear cache for old search queries
    const now = Date.now();
    for (const [key, value] of SEARCH_RESULTS_CACHE.entries()) {
      if (now - value.timestamp > CACHE_DURATION) {
        SEARCH_RESULTS_CACHE.delete(key);
      }
    }
  }, [searchQuery]);

  // Append new results to existing ones and update cache
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
      
      // Update cache
      SEARCH_RESULTS_CACHE.set(cacheKey, {
        results: allResults,
        cursor: paginatedResults.continueCursor,
        timestamp: Date.now(),
      });
      
      setIsLoadingMore(false);
    } else if (paginatedResults && paginatedResults.page.length === 0) {
      setIsLoadingMore(false);
    }
  }, [paginatedResults, cursor, cacheKey, allResults]);

  const loadMore = () => {
    if (paginatedResults && !paginatedResults.isDone && !isLoadingMore) {
      setIsLoadingMore(true);
      setCursor(paginatedResults.continueCursor);
      setCurrentPage((prev) => prev + 1);
    }
  };

  const reset = () => {
    setAllResults([]);
    setCursor(null);
    setCurrentPage(1);
    setIsLoadingMore(false);
    if (enableUrlParams) {
      void navigate({ search: {} as any });
    }
  };

  const setSearchQuery = (query: string) => {
    setSearchQueryState(query);
  };

  const isLoading = !paginatedResults && searchQuery.trim().length >= 2;
  const hasMore = !!paginatedResults && !paginatedResults.isDone;

  return {
    searchQuery,
    setSearchQuery,
    results: allResults,
    isLoading,
    hasMore,
    loadMore,
    reset,
    totalLoaded: allResults.length,
    currentPage,
  };
}