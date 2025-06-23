import { useDebouncedValue } from "@tanstack/react-pacer";
import { useVirtualizer } from "@tanstack/react-virtual";
import { AlertCircle } from "lucide-react";
import { useEffect, useRef } from "react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { api } from "@convex/_generated/api";
import { usePaginatedQuery } from "convex/react";

import {
  EXPERTISE_LEVELS,
  MIN_SEARCH_LENGTH,
  SEARCH_DEBOUNCE_MS,
} from "../constants";
import type { GameLibraryItem, GameSearchResult } from "../types";

import { GameSearchSkeleton } from "./GameSearchSkeleton";

interface VirtualizedGameSearchResultsProps {
  searchQuery: string;
  userLibrary: GameLibraryItem[];
  onAddGame: (game: GameSearchResult, expertiseLevel: string) => void;
}

const ITEMS_PER_PAGE = 20;
const ITEM_HEIGHT = 64; // Height of each game item in pixels

export function VirtualizedGameSearchResults({
  searchQuery,
  userLibrary,
  onAddGame,
}: VirtualizedGameSearchResultsProps) {
  const parentRef = useRef<HTMLDivElement>(null);
  const [debouncedSearchQuery] = useDebouncedValue(searchQuery, {
    wait: SEARCH_DEBOUNCE_MS,
  });

  const shouldSearch = debouncedSearchQuery.trim().length >= MIN_SEARCH_LENGTH;

  // Use paginated query for infinite scrolling
  const { results, status, loadMore } = usePaginatedQuery(
    api.games.searchGamesPaginated,
    shouldSearch
      ? {
          query: debouncedSearchQuery.trim(),
        }
      : "skip",
    { initialNumItems: ITEMS_PER_PAGE }
  );

  const allItems = results || [];
  const isInitialLoading = status === "LoadingFirstPage";
  const isLoadingMore = status === "LoadingMore";
  const canLoadMore = status === "CanLoadMore";

  // Virtualizer setup
  const virtualizer = useVirtualizer({
    count: allItems.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => ITEM_HEIGHT,
    overscan: 5,
  });

  const items = virtualizer.getVirtualItems();

  // Load more when scrolling near the bottom
  useEffect(() => {
    if (!canLoadMore || isLoadingMore) return;

    const lastItem = items[items.length - 1];
    if (!lastItem) return;

    // Load more when the last visible item is within 5 items of the end
    if (lastItem.index >= allItems.length - 5) {
      loadMore(ITEMS_PER_PAGE);
    }
  }, [items, allItems.length, canLoadMore, isLoadingMore, loadMore]);

  // Reset scroll when search query changes
  useEffect(() => {
    if (parentRef.current) {
      parentRef.current.scrollTop = 0;
    }
    virtualizer.scrollToOffset(0, { align: "start" });
    virtualizer.measure();
  }, [debouncedSearchQuery, virtualizer]);

  // Show initial loading state only when searching
  if (isInitialLoading && shouldSearch) {
    return <GameSearchSkeleton count={5} />;
  }

  // Show error state
  if (!isInitialLoading && allItems.length === 0 && shouldSearch) {
    return (
      <div className="flex items-center gap-2 p-3 bg-red-50 text-red-700 rounded-md text-sm">
        <AlertCircle size={16} />
        No games found. Try a different search term.
      </div>
    );
  }

  // Show empty state when no search
  if (!shouldSearch || allItems.length === 0) {
    return null;
  }

  return (
    <div className="space-y-2">
      <p className="text-xs text-gray-500 mb-2">
        Data provided by{" "}
        <a
          href="https://boardgamegeek.com"
          target="_blank"
          rel="noopener noreferrer"
          className="underline"
        >
          BoardGameGeek
        </a>
      </p>

      {/* Virtualized scrollable container */}
      <div
        ref={parentRef}
        className="h-[400px] overflow-auto rounded-lg border bg-gray-50"
        style={{ contain: "strict" }}
      >
        <div
          style={{
            height: `${virtualizer.getTotalSize()}px`,
            width: "100%",
            position: "relative",
          }}
        >
          {items.map(virtualItem => {
            const game = allItems[virtualItem.index];
            if (!game) return null;

            const isInLibrary = userLibrary.some(g => g.gameId === game.bggId);

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
                <div className="flex items-center space-x-3 p-2 bg-white rounded border mx-2 h-full">
                  {game.image ? (
                    <img
                      src={game.image}
                      alt={game.name}
                      className="w-12 h-12 rounded object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded bg-gray-200" />
                  )}

                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-gray-900 truncate">
                      {game.name}
                    </h4>
                    <p className="text-sm text-gray-500">
                      {game.minPlayers}-{game.maxPlayers} players •{" "}
                      {game.playingTime}min
                      {game.complexity > 0 &&
                        ` • ${game.complexity.toFixed(1)} complexity`}
                    </p>
                  </div>

                  <Select
                    onValueChange={value => void onAddGame(game, value)}
                    disabled={isInLibrary}
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue
                        placeholder={
                          isInLibrary ? "Already added" : "Select level"
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {EXPERTISE_LEVELS.map(level => (
                        <SelectItem key={level.value} value={level.value}>
                          {level.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            );
          })}

          {/* Loading more skeletons */}
          {isLoadingMore && (
            <div
              style={{
                position: "absolute",
                top: `${virtualizer.getTotalSize()}px`,
                left: 0,
                width: "100%",
                padding: "0 8px",
              }}
            >
              <GameSearchSkeleton count={3} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
