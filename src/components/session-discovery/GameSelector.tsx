import { Search } from "lucide-react";
import { useState } from "react";

import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { Id } from "@convex/_generated/dataModel";

import { GameImage } from "@/components/GameImage";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useDebounce } from "@/hooks/useDebounce";

interface Game {
  _id: Id<"gameData">;
  boardGameAtlasId: string;
  name: string;
  imageUrl?: string;
  alternateNames?: string[];
  minPlayers: number;
  maxPlayers: number;
  playTime: number;
}

interface GameSelectorProps {
  selectedGame: Game | null;
  onGameSelect: (game: Game) => void;
  userGameLibrary: Array<{
    gameId: string;
    gameName: string;
    gameImage?: string;
    expertiseLevel:
      | "novice"
      | "beginner"
      | "intermediate"
      | "advanced"
      | "expert";
  }>;
}

export const GameSelector = ({
  selectedGame,
  onGameSelect,
  userGameLibrary,
}: GameSelectorProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  // Get games from user's library
  const userGameIds = userGameLibrary.map(g => g.gameId);

  // Fetch only the games in user's library
  const userLibraryGames = useQuery(api.games.getUserLibraryGames, {
    gameIds: userGameIds,
  });

  // Search for games when user types
  const searchResults = useQuery(
    api.games.searchGames,
    debouncedSearchTerm.length >= 2 ? { query: debouncedSearchTerm } : "skip",
  );

  // Filter search results to only show games in user's library and convert to Game format
  const userGameIdSet = new Set(userGameIds);
  const filteredResults =
    searchResults
      ?.filter(game => userGameIdSet.has(game.bggId))
      .map(result => {
        // Find the full game data from user library games
        const fullGame = userLibraryGames?.find(
          g => g.boardGameAtlasId === result.bggId,
        );
        if (fullGame) {
          return fullGame;
        }
        // Fallback if not found in library (shouldn't happen if user library is correct)
        return {
          _id: result.bggId as unknown as Id<"gameData">,
          boardGameAtlasId: result.bggId,
          name: result.name,
          imageUrl: result.image,
          alternateNames: [],
          minPlayers: result.minPlayers,
          maxPlayers: result.maxPlayers,
          playTime: result.playingTime,
        };
      }) || [];

  const handleGameClick = (game: Game) => {
    onGameSelect(game);
    setShowSearch(false);
    setSearchTerm("");
  };

  const getExpertiseLevel = (gameId: string) => {
    const userGame = userGameLibrary.find(g => g.gameId === gameId);
    return userGame?.expertiseLevel || "novice";
  };

  if (selectedGame && !showSearch) {
    return (
      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-start gap-4">
            <GameImage
              src={selectedGame.imageUrl}
              alt={selectedGame.name}
              className="w-20 h-20 rounded-lg object-cover"
            />
            <div className="flex-1">
              <h3 className="font-semibold text-lg">{selectedGame.name}</h3>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="secondary" className="text-xs">
                  {selectedGame.minPlayers === selectedGame.maxPlayers ?
                    `${selectedGame.minPlayers} players`
                  : `${selectedGame.minPlayers}-${selectedGame.maxPlayers} players`
                  }
                </Badge>
                <Badge variant="secondary" className="text-xs">
                  {selectedGame.playTime} min
                </Badge>
                <Badge className="text-xs">
                  {getExpertiseLevel(selectedGame.boardGameAtlasId)}
                </Badge>
              </div>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowSearch(true)}
          >
            Change Game
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search your games..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Show user's games when no search or filtered search results */}
      <div className="grid gap-2 max-h-96 overflow-y-auto">
        {!searchTerm && userGameLibrary.length === 0 && (
          <p className="text-center text-muted-foreground py-8">
            Add some games to your library first
          </p>
        )}

        {
          !searchTerm ?
            // Show all user's games when not searching
            userLibraryGames?.map(game => (
              <Card
                key={game._id}
                className="p-3 cursor-pointer hover:bg-accent transition-colors"
                onClick={() => handleGameClick(game)}
              >
                <div className="flex items-center gap-3">
                  <GameImage
                    src={game.imageUrl}
                    alt={game.name}
                    className="w-12 h-12 rounded object-cover"
                  />
                  <div className="flex-1">
                    <p className="font-medium">{game.name}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="secondary" className="text-xs">
                        {game.minPlayers === game.maxPlayers ?
                          `${game.minPlayers} players`
                        : `${game.minPlayers}-${game.maxPlayers} players`}
                      </Badge>
                      <Badge className="text-xs">
                        {getExpertiseLevel(game.boardGameAtlasId)}
                      </Badge>
                    </div>
                  </div>
                </div>
              </Card>
            ))
            // Show filtered search results
          : <>
              {filteredResults.length === 0 &&
                debouncedSearchTerm.length >= 2 && (
                  <p className="text-center text-muted-foreground py-8">
                    No games from your library match "{debouncedSearchTerm}"
                  </p>
                )}
              {filteredResults.map(game => (
                <Card
                  key={game._id}
                  className="p-3 cursor-pointer hover:bg-accent transition-colors"
                  onClick={() => handleGameClick(game)}
                >
                  <div className="flex items-center gap-3">
                    <GameImage
                      src={game.imageUrl}
                      alt={game.name}
                      className="w-12 h-12 rounded object-cover"
                    />
                    <div className="flex-1">
                      <p className="font-medium">{game.name}</p>
                      {game.alternateNames &&
                        game.alternateNames.length > 0 && (
                          <p className="text-xs text-muted-foreground">
                            Also known as: {game.alternateNames[0]}
                          </p>
                        )}
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="secondary" className="text-xs">
                          {game.minPlayers === game.maxPlayers ?
                            `${game.minPlayers} players`
                          : `${game.minPlayers}-${game.maxPlayers} players`}
                        </Badge>
                        <Badge variant="secondary" className="text-xs">
                          {game.playTime} min
                        </Badge>
                        <Badge className="text-xs">
                          {getExpertiseLevel(game.boardGameAtlasId)}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </>

        }
      </div>
    </div>
  );
};
