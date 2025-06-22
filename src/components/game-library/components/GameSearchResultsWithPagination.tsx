import { AlertCircle, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { EXPERTISE_LEVELS } from "../constants";
import type { GameLibraryItem, GameSearchResult } from "../types";

interface GameSearchResultsWithPaginationProps {
  searchResults: GameSearchResult[];
  isLoading: boolean;
  hasMore: boolean;
  onLoadMore: () => void;
  userLibrary: GameLibraryItem[];
  onAddGame: (game: GameSearchResult, expertiseLevel: string) => void;
  totalLoaded: number;
}

export function GameSearchResultsWithPagination({
  searchResults,
  isLoading,
  hasMore,
  onLoadMore,
  userLibrary,
  onAddGame,
  totalLoaded,
}: GameSearchResultsWithPaginationProps) {
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
    <div className="space-y-4">
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
        {searchResults.map((game) => (
          <div
            key={game.bggId}
            className="flex items-center space-x-3 p-2 bg-white rounded border"
          >
            {game.image && (
              <img
                src={game.image}
                alt={game.name}
                className="w-12 h-12 rounded object-cover"
              />
            )}
            <div className="flex-1">
              <h4 className="font-medium text-gray-900">{game.name}</h4>
              <p className="text-sm text-gray-500">
                {game.minPlayers}-{game.maxPlayers} players • {game.playingTime}
                min
              </p>
            </div>
            <Select
              onValueChange={(value) => void onAddGame(game, value)}
              disabled={userLibrary.some((g) => g.gameId === game.bggId)}
            >
              <SelectTrigger className="w-32">
                <SelectValue
                  placeholder={
                    userLibrary.some((g) => g.gameId === game.bggId)
                      ? "Already added"
                      : "Select level"
                  }
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
        ))}
      </div>

      {/* Load More Button */}
      {hasMore && (
        <div className="flex justify-center pt-2">
          <Button
            onClick={onLoadMore}
            disabled={isLoading}
            variant="outline"
            size="sm"
            className="min-w-[100px]"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Loading...
              </>
            ) : (
              "Load More"
            )}
          </Button>
        </div>
      )}

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
