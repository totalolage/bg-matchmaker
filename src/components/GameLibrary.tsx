import { useState, ComponentProps } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { Doc } from "@convex/_generated/dataModel";
import { Plus, Search, X, Loader2, AlertCircle } from "lucide-react";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { toast } from "sonner";
import { useDebouncedValue } from "@tanstack/react-pacer";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { EmptyState } from "./EmptyState";
import { SectionHeader } from "./SectionHeader";
import { GameImage } from "./GameImage";

// Type definitions
type GameSearchResult = {
  bggId: string;
  name: string;
  image: string;
  minPlayers: number;
  maxPlayers: number;
  playingTime: number;
  complexity: number;
};

type ExpertiseLevel =
  | "novice"
  | "beginner"
  | "intermediate"
  | "advanced"
  | "expert";

export const GameLibrary = ({ user }: { user: Doc<"users"> }) => {
  const [isAddingGame, setIsAddingGame] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery] = useDebouncedValue(searchQuery, { wait: 500 });

  const updateGameLibrary = useMutation(api.users.updateGameLibrary);

  // Use query for search - automatically updates when debouncedSearchQuery changes
  const searchResults =
    useQuery(
      api.games.searchGames,
      debouncedSearchQuery.trim().length >= 2
        ? { query: debouncedSearchQuery.trim() }
        : "skip",
    ) || [];

  const expertiseLevels = [
    { value: "novice", label: "Novice", color: "bg-gray-100 text-gray-800" },
    {
      value: "beginner",
      label: "Beginner",
      color: "bg-blue-100 text-blue-800",
    },
    {
      value: "intermediate",
      label: "Intermediate",
      color: "bg-green-100 text-green-800",
    },
    {
      value: "advanced",
      label: "Advanced",
      color: "bg-yellow-100 text-yellow-800",
    },
    {
      value: "expert",
      label: "Expert",
      color: "bg-purple-100 text-purple-800",
    },
  ];

  // Derive loading state from query length difference
  const isSearching =
    searchQuery.trim().length >= 2 && searchQuery !== debouncedSearchQuery;

  const searchError =
    searchQuery.trim().length >= 2 && !isSearching && searchResults.length === 0
      ? "No games found. Try a different search term or import by BGG ID."
      : null;

  const addGame = async (game: GameSearchResult, expertiseLevel: string) => {
    try {
      const newGame = {
        gameId: game.bggId,
        gameName: game.name,
        gameImage: game.image,
        expertiseLevel: expertiseLevel as ExpertiseLevel,
      };

      const updatedLibrary = [...user.gameLibrary, newGame];
      await updateGameLibrary({ gameLibrary: updatedLibrary });

      toast.success(`Added ${game.name} to your library`);
      setIsAddingGame(false);
      setSearchQuery("");
    } catch (error) {
      console.error("Failed to add game:", error);
      toast.error("Failed to add game");
    }
  };

  const removeGame = async (gameId: string) => {
    const updatedLibrary = user.gameLibrary.filter((g) => g.gameId !== gameId);
    await updateGameLibrary({ gameLibrary: updatedLibrary });
  };

  const updateExpertise = async (gameId: string, newLevel: string) => {
    const updatedLibrary = user.gameLibrary.map((game) =>
      game.gameId === gameId
        ? { ...game, expertiseLevel: newLevel as ExpertiseLevel }
        : game,
    );
    await updateGameLibrary({ gameLibrary: updatedLibrary });
  };

  return (
    <div>
      <SectionHeader
        title="Your Games"
        action={
          <Button
            onClick={() => setIsAddingGame(true)}
            variant="ghost"
            className="text-purple-600 hover:text-purple-700"
          >
            <Plus size={20} className="mr-1" />
            Add Game
          </Button>
        }
      />

      {isAddingGame && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-medium text-gray-900">Add New Game</h3>
            <Button
              onClick={() => setIsAddingGame(false)}
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

          {searchError && (
            <div className="flex items-center gap-2 p-3 bg-red-50 text-red-700 rounded-md text-sm">
              <AlertCircle size={16} />
              {searchError}
            </div>
          )}

          {isSearching && searchResults.length === 0 && (
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
          )}

          {searchResults.length > 0 && (
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
                    onValueChange={(value) => void addGame(game, value)}
                    disabled={user.gameLibrary.some(
                      (g) => g.gameId === game.bggId,
                    )}
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue
                        placeholder={
                          user.gameLibrary.some((g) => g.gameId === game.bggId)
                            ? "Already added"
                            : "Select level"
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {expertiseLevels.map((level) => (
                        <SelectItem key={level.value} value={level.value}>
                          {level.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="space-y-3">
        {user.gameLibrary.map((game) => {
          const expertiseLevel = expertiseLevels.find(
            (l) => l.value === game.expertiseLevel,
          );
          return (
            <div
              key={game.gameId}
              className="flex items-center space-x-3 p-3 bg-white rounded-lg border border-gray-200 animate-in fade-in slide-in-from-bottom-5 duration-200"
            >
              <GameImage src={game.gameImage} alt={game.gameName} size="md" />
              <div className="flex-1">
                <h3 className="font-medium text-gray-900">{game.gameName}</h3>
                <Select
                  value={game.expertiseLevel}
                  onValueChange={(value) =>
                    void updateExpertise(game.gameId, value)
                  }
                >
                  <SelectTrigger
                    className={`mt-1 w-32 h-7 text-xs ${expertiseLevel?.color}`}
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {expertiseLevels.map((level) => (
                      <SelectItem key={level.value} value={level.value}>
                        {level.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button
                onClick={() => void removeGame(game.gameId)}
                variant="ghost"
                size="sm"
                className="text-red-400 hover:text-red-600 h-8 w-8 p-0"
              >
                <X size={16} />
              </Button>
            </div>
          );
        })}
      </div>

      {user.gameLibrary.length === 0 && (
        <EmptyState
          emoji="🎲"
          title="No games in your library yet"
          subtitle="Add some games to get started!"
        />
      )}
    </div>
  );
};

export type GameLibraryProps = ComponentProps<typeof GameLibrary>;
