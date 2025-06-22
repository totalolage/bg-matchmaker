import { useVirtualizer } from "@tanstack/react-virtual";
import { AlertCircle, Loader2 } from "lucide-react";
import { memo, useCallback, useEffect, useRef } from "react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { EXPERTISE_LEVELS } from "../constants";
import type { GameLibraryItem, GameSearchResult } from "../types";

import { PaginationError } from "./PaginationError";

interface GameSearchResultsVirtualizedProps {
  searchResults: GameSearchResult[];
  isLoading: boolean;
  hasMore: boolean;
  onLoadMore: () => void;
  userLibrary: GameLibraryItem[];
  onAddGame: (game: GameSearchResult, expertiseLevel: string) => void;
  totalLoaded: number;
  error?: Error | null;
  onRetry?: () => void;
}

const ITEM_HEIGHT = 76; // Height of each game item in pixels
const LOADER_HEIGHT = 280; // Height of the loader section (3 skeleton items + loading text)
const OVERSCAN = 5; // Number of items to render outside the visible area

const GameRow = memo(({
  game,
  isInLibrary,
  onAddGame,
}: {
  game: GameSearchResult;
  isInLibrary: boolean;
  onAddGame: (game: GameSearchResult, expertiseLevel: string) => void;
}) => (
  <div className="flex items-center space-x-3 p-2 border-b hover:bg-gray-50 transition-colors">
    {game.image && (
      <img
        src={game.image}
        alt={game.name}
        className="w-12 h-12 rounded object-cover"
        loading="lazy"
      />
    )}
    <div className="flex-1 min-w-0">
      <h4 className="font-medium text-gray-900 truncate">{game.name}</h4>
      <p className="text-sm text-gray-500">
        {game.minPlayers}-{game.maxPlayers} players • {game.playingTime} min
      </p>
    </div>
    <Select
      onValueChange={(value) => void onAddGame(game, value)}
      disabled={isInLibrary}
    >
      <SelectTrigger className="w-32">
        <SelectValue
          placeholder={isInLibrary ? "Already added" : "Select level"}
        />
      </SelectTrigger>
      <SelectContent>
        {EXPERTISE_LEVELS.map((level) => (
          <SelectItem key={level.value} value={level.value}>
            {level.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  </div>
));

export function GameSearchResultsVirtualized({
  searchResults,
  isLoading,
  hasMore,
  onLoadMore,
  userLibrary,
  onAddGame,
  totalLoaded,
  error,
  onRetry,
}: GameSearchResultsVirtualizedProps) {
  const parentRef = useRef<HTMLDivElement>(null);
  const loadMoreTriggered = useRef(false);

  // Set up virtualizer
  const virtualizer = useVirtualizer({
    count: searchResults.length + (hasMore ? 1 : 0), // Add 1 for loader row
    getScrollElement: () => parentRef.current,
    estimateSize: useCallback(
      (index) => {
        // Use different height for loader row
        const isLoaderRow = index >= searchResults.length;
        return isLoaderRow ? LOADER_HEIGHT : ITEM_HEIGHT;
      },
      [searchResults.length],
    ),
    overscan: OVERSCAN,
  });

  const virtualItems = virtualizer.getVirtualItems();

  // Trigger load more when scrolling near the end
  useEffect(() => {
    if (!hasMore || isLoading || loadMoreTriggered.current) return;

    const [lastItem] = [...virtualItems].reverse();

    if (
      lastItem &&
      lastItem.index >= searchResults.length - 5 &&
      searchResults.length > 0
    ) {
      loadMoreTriggered.current = true;
      onLoadMore();
    }
  }, [virtualItems, searchResults.length, hasMore, isLoading, onLoadMore]);

  // Reset trigger when new results arrive
  useEffect(() => {
    loadMoreTriggered.current = false;
  }, [searchResults.length]);

  // Error state
  if (error && onRetry) {
    return (
      <PaginationError
        onRetry={onRetry}
        message="Failed to load search results"
      />
    );
  }

  // Loading state for initial load
  if (isLoading && searchResults.length === 0) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 3 }, (_, i) => (
          <div
            key={i}
            className="flex items-center space-x-3 p-2 bg-white rounded border animate-pulse"
          >
            <div className="w-12 h-12 bg-gray-200 rounded" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-gray-200 rounded w-3/4" />
              <div className="h-3 bg-gray-200 rounded w-1/2" />
            </div>
            <div className="w-32 h-9 bg-gray-200 rounded" />
          </div>
        ))}
      </div>
    );
  }

  // No results
  if (!isLoading && searchResults.length === 0) {
    return (
      <div className="flex items-center gap-2 p-3 bg-red-50 text-red-700 rounded-md text-sm">
        <AlertCircle size={16} />
        No games found. Try a different search term or import by BGG ID.
      </div>
    );
  }

  return (
    <div className="space-y-4 h-full">
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

        {/* Virtual scroll container */}
        <div
          ref={parentRef}
          className="h-[calc(100vh-300px)] min-h-[400px] max-h-[800px] overflow-auto rounded-lg border bg-white shadow-sm"
          style={{
            contain: "strict",
          }}
        >
          <div
            style={{
              height: `${virtualizer.getTotalSize()}px`,
              width: "100%",
              position: "relative",
            }}
          >
            {virtualItems.map((virtualRow) => {
              const isLoaderRow = virtualRow.index >= searchResults.length;
              const game = searchResults[virtualRow.index];

              return (
                <div
                  key={virtualRow.key}
                  data-index={virtualRow.index}
                  ref={virtualizer.measureElement}
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    transform: `translateY(${virtualRow.start}px)`,
                  }}
                >
                  {isLoaderRow ? (
                    // Loading indicator row
                    <div className="space-y-2 p-2">
                      {/* Show skeleton loaders for next batch */}
                      {[...Array(3)].map((_, i) => (
                        <div
                          key={`skeleton-${i}`}
                          className="flex items-center space-x-3 p-2 animate-pulse"
                        >
                          <div className="w-12 h-12 bg-gray-200 rounded" />
                          <div className="flex-1 space-y-2">
                            <div className="h-4 bg-gray-200 rounded w-3/4" />
                            <div className="h-3 bg-gray-200 rounded w-1/2" />
                          </div>
                          <div className="w-32 h-9 bg-gray-200 rounded" />
                        </div>
                      ))}
                      <div className="flex items-center justify-center pt-2">
                        <Loader2 className="mr-2 h-4 w-4 animate-spin text-gray-500" />
                        <span className="text-sm text-gray-500">
                          Loading more...
                        </span>
                      </div>
                    </div>
                  ) : game ? (
                    // Game row
                    <GameRow
                      game={game}
                      isInLibrary={userLibrary.some(
                        (g) => g.gameId === game.bggId,
                      )}
                      onAddGame={onAddGame}
                    />
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Results info */}
      {totalLoaded > 0 && (
        <p className="text-xs text-gray-500 text-center">
          Showing {totalLoaded} results
          {!hasMore && " (all results)"}
        </p>
      )}
    </div>
  );
}

