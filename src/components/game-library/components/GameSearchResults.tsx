import { AlertCircle } from "lucide-react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { EXPERTISE_LEVELS } from "../constants";
import type { GameLibraryItem,GameSearchResult } from "../types";

interface GameSearchResultsProps {
  searchResults: GameSearchResult[];
  isSearching: boolean;
  searchError: string | null;
  userLibrary: GameLibraryItem[];
  onAddGame: (game: GameSearchResult, expertiseLevel: string) => void;
}

export function GameSearchResults({
  searchResults,
  isSearching,
  searchError,
  userLibrary,
  onAddGame,
}: GameSearchResultsProps) {
  if (searchError) {
    return (
      <div className="flex items-center gap-2 p-3 bg-red-50 text-red-700 rounded-md text-sm">
        <AlertCircle size={16} />
        {searchError}
      </div>
    );
  }

  if (isSearching && searchResults.length === 0) {
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

  if (searchResults.length === 0) {
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
              {game.minPlayers}-{game.maxPlayers} players •{" "}
              {game.playingTime}min
            </p>
          </div>
          <Select
            onValueChange={(value) => void onAddGame(game, value)}
            disabled={userLibrary.some(
              (g) => g.gameId === game.bggId,
            )}
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
  );
}