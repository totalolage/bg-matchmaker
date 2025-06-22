import { useDebouncedValue } from "@tanstack/react-pacer";
import { createFileRoute } from "@tanstack/react-router";
import { type } from "arktype";
import { motion } from "framer-motion";
import { Search } from "lucide-react";
import { useEffect, useRef } from "react";

import { GameSearchResultsVirtualized } from "@/components/game-library/components/GameSearchResultsVirtualized";
import { PageHeader, PageLayout } from "@/components/PageLayout";
import { Input } from "@/components/ui/input";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { usePaginatedSearchWithParams } from "@/hooks/usePaginatedSearchWithParams";

const searchSchema = type({
  "q?": "string",
  "cursor?": "string",
  "page?": "string",
});

export const Route = createFileRoute("/games/search")({
  component: GamesSearch,
  validateSearch: (search: Record<string, unknown>) => {
    const parsed = searchSchema(search);
    if (parsed instanceof type.errors) {
      return {};
    }
    // Convert page string to number
    if (parsed.page) {
      return {
        ...parsed,
        page: parseInt(parsed.page, 10),
      };
    }
    return parsed;
  },
});

function GamesSearch() {
  const user = useCurrentUser();
  const inputRef = useRef<HTMLInputElement>(null);
  
  const {
    searchQuery,
    setSearchQuery,
    results,
    isLoading,
    hasMore,
    loadMore,
    totalLoaded,
    currentPage,
  } = usePaginatedSearchWithParams({
    itemsPerPage: 50, // Increased for smoother virtual scrolling
    enableUrlParams: true,
  });

  // Debounce the search query for better performance
  const [debouncedSearchQuery] = useDebouncedValue(searchQuery, {
    wait: 500,
  });

  // Focus search input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const showResults = debouncedSearchQuery.trim().length >= 2;

  return (
    <PageLayout>
      <PageHeader>
        <h1 className="text-2xl font-bold text-gray-900">Search Games</h1>
        <p className="text-gray-600 mt-1">
          Find board games from our collection of over 20,000 titles
        </p>
      </PageHeader>

      <div className="p-4 space-y-4">
        <div className="relative">
          <Input
            ref={inputRef}
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search for board games..."
            className="pl-10 pr-4 py-3 text-lg"
            before={<Search size={20} className="text-gray-400" />}
            aria-label="Search games"
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
          />
        </div>

        {showResults && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className="mb-3 text-sm text-gray-600">
              {totalLoaded > 0 ? (
                <>
                  Showing {totalLoaded} results for "{debouncedSearchQuery}"
                  {currentPage > 1 && ` (Page ${currentPage})`}
                </>
              ) : (
                isLoading ? "Searching..." : `No results found for "${debouncedSearchQuery}"`
              )}
            </div>

            <GameSearchResultsVirtualized
              searchResults={results}
              isLoading={isLoading}
              hasMore={hasMore}
              onLoadMore={loadMore}
              userLibrary={user.gameLibrary}
              onAddGame={(_game, _expertiseLevel) => {
                // Navigate to profile after adding game
                window.location.href = "/profile#games";
              }}
              totalLoaded={totalLoaded}
            />
          </motion.div>
        )}

        {!showResults && searchQuery.length > 0 && searchQuery.length < 2 && (
          <p className="text-sm text-gray-500 text-center mt-8">
            Type at least 2 characters to search
          </p>
        )}
      </div>
    </PageLayout>
  );
}