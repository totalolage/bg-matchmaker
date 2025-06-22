import { useDebouncedValue } from "@tanstack/react-pacer";
import { Loader2, Search, X } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api } from "@convex/_generated/api";
import { Doc } from "@convex/_generated/dataModel";
import { useQuery } from "convex/react";

import { MIN_SEARCH_LENGTH,SEARCH_DEBOUNCE_MS } from "../constants";
import type { GameSearchResult } from "../types";

import { GameSearchResults } from "./GameSearchResults";

interface AddGameDialogProps {
  user: Doc<"users">;
  onAddGame: (game: GameSearchResult, expertiseLevel: string) => void;
  onClose: () => void;
}

export function AddGameDialog({ user, onAddGame, onClose }: AddGameDialogProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery] = useDebouncedValue(searchQuery, { wait: SEARCH_DEBOUNCE_MS });

  const searchResults =
    useQuery(
      api.games.searchGames,
      debouncedSearchQuery.trim().length >= MIN_SEARCH_LENGTH
        ? { query: debouncedSearchQuery.trim() }
        : "skip",
    ) || [];

  const isSearching =
    searchQuery.trim().length >= MIN_SEARCH_LENGTH && searchQuery !== debouncedSearchQuery;

  const searchError =
    searchQuery.trim().length >= MIN_SEARCH_LENGTH && !isSearching && searchResults.length === 0
      ? "No games found. Try a different search term or import by BGG ID."
      : null;

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
          after={isSearching ? (
            <Loader2 size={16} className="animate-spin text-gray-400" />
          ) : null}
          {...{ incremental: true }}
        />
      </div>

      <GameSearchResults
        searchResults={searchResults}
        isSearching={isSearching}
        searchError={searchError}
        userLibrary={user.gameLibrary}
        onAddGame={onAddGame}
      />
    </div>
  );
}