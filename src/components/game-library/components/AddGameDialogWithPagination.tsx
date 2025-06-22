import { useDebouncedValue } from "@tanstack/react-pacer";
import { Loader2, Search, X } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { usePaginatedSearch } from "@/hooks/usePaginatedSearch";
import { Doc } from "@convex/_generated/dataModel";

import { MIN_SEARCH_LENGTH, SEARCH_DEBOUNCE_MS } from "../constants";
import type { GameSearchResult } from "../types";

import { GameSearchResultsWithPagination } from "./GameSearchResultsWithPagination";

interface AddGameDialogWithPaginationProps {
  user: Doc<"users">;
  onAddGame: (game: GameSearchResult, expertiseLevel: string) => void;
  onClose: () => void;
  enableUrlParams?: boolean;
}

export function AddGameDialogWithPagination({
  user,
  onAddGame,
  onClose,
  enableUrlParams: _enableUrlParams = false,
}: AddGameDialogWithPaginationProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery] = useDebouncedValue(searchQuery, {
    wait: SEARCH_DEBOUNCE_MS,
  });

  const { results, isLoading, hasMore, loadMore, totalLoaded, error, retry } =
    usePaginatedSearch({
      searchQuery: debouncedSearchQuery.trim(),
      itemsPerPage: 10,
    });

  const isSearching =
    searchQuery.trim().length >= MIN_SEARCH_LENGTH &&
    searchQuery !== debouncedSearchQuery;

  const showResults = debouncedSearchQuery.trim().length >= MIN_SEARCH_LENGTH;

  return (
    <div className="mb-6 p-4 bg-gray-50 rounded-lg">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-medium text-gray-900">Add New Game</h3>
        <Button
          onClick={onClose}
          variant="ghost"
          size="icon"
          className="text-gray-400 hover:text-gray-600 h-8 w-8"
        >
          <X size={20} />
        </Button>
      </div>

      <div className="mb-3">
        <Input
          type="search"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search for a game..."
          onKeyDown={(e) => e.key === "Enter" && e.preventDefault()}
          before={<Search size={16} className="text-gray-400" />}
          after={
            isSearching ? (
              <Loader2 size={16} className="animate-spin text-gray-400" />
            ) : null
          }
          {...{ incremental: true }}
        />
      </div>

      {showResults && (
        <GameSearchResultsWithPagination
          searchResults={results}
          isLoading={isLoading}
          hasMore={hasMore}
          onLoadMore={loadMore}
          userLibrary={user.gameLibrary}
          onAddGame={onAddGame}
          totalLoaded={totalLoaded}
          error={error}
          onRetry={retry}
        />
      )}
    </div>
  );
}
