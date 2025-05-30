import { useState } from "react";
import { useMutation, useAction } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Doc } from "../../convex/_generated/dataModel";
import { Plus, Search, X } from "lucide-react";

interface GameLibraryProps {
  user: Doc<"users">;
}

export function GameLibrary({ user }: GameLibraryProps) {
  const [isAddingGame, setIsAddingGame] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  
  const updateGameLibrary = useMutation(api.users.updateGameLibrary);
  const searchGames = useAction(api.games.searchGames);

  const expertiseLevels = [
    { value: "novice", label: "Novice", color: "bg-gray-100 text-gray-800" },
    { value: "beginner", label: "Beginner", color: "bg-blue-100 text-blue-800" },
    { value: "intermediate", label: "Intermediate", color: "bg-green-100 text-green-800" },
    { value: "advanced", label: "Advanced", color: "bg-yellow-100 text-yellow-800" },
    { value: "expert", label: "Expert", color: "bg-purple-100 text-purple-800" },
  ];

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    try {
      const results = await searchGames({ query: searchQuery });
      setSearchResults(results);
    } catch (error) {
      console.error("Search failed:", error);
    } finally {
      setIsSearching(false);
    }
  };

  const addGame = async (game: any, expertiseLevel: string) => {
    const newGame = {
      gameId: game.bggId,
      gameName: game.name,
      gameImage: game.image,
      expertiseLevel: expertiseLevel as any,
    };

    const updatedLibrary = [...user.gameLibrary, newGame];
    await updateGameLibrary({ gameLibrary: updatedLibrary });
    
    setIsAddingGame(false);
    setSearchQuery("");
    setSearchResults([]);
  };

  const removeGame = async (gameId: string) => {
    const updatedLibrary = user.gameLibrary.filter(g => g.gameId !== gameId);
    await updateGameLibrary({ gameLibrary: updatedLibrary });
  };

  const updateExpertise = async (gameId: string, newLevel: string) => {
    const updatedLibrary = user.gameLibrary.map(game =>
      game.gameId === gameId
        ? { ...game, expertiseLevel: newLevel as any }
        : game
    );
    await updateGameLibrary({ gameLibrary: updatedLibrary });
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Your Games</h2>
        <button
          onClick={() => setIsAddingGame(true)}
          className="flex items-center space-x-1 text-purple-600 hover:text-purple-700"
        >
          <Plus size={20} />
          <span>Add Game</span>
        </button>
      </div>

      {isAddingGame && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-medium text-gray-900">Add New Game</h3>
              <button
                onClick={() => setIsAddingGame(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="flex space-x-2 mb-3">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search for a game..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                onKeyPress={(e) => e.key === "Enter" && void handleSearch()}
              />
              <button
                onClick={() => void handleSearch()}
                disabled={isSearching}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
              >
                <Search size={16} />
              </button>
            </div>

            {searchResults.length > 0 && (
              <div className="space-y-2">
                {searchResults.map((game) => (
                  <div key={game.bggId} className="flex items-center space-x-3 p-2 bg-white rounded border">
                    {game.image && (
                      <img src={game.image} alt={game.name} className="w-12 h-12 rounded object-cover" />
                    )}
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">{game.name}</h4>
                      <p className="text-sm text-gray-500">
                        {game.minPlayers}-{game.maxPlayers} players • {game.playingTime}min
                      </p>
                    </div>
                    <select
                      onChange={(e) => void addGame(game, e.target.value)}
                      className="px-2 py-1 border border-gray-300 rounded text-sm"
                      defaultValue=""
                    >
                      <option value="" disabled>Select level</option>
                      {expertiseLevels.map(level => (
                        <option key={level.value} value={level.value}>
                          {level.label}
                        </option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
            )}
        </div>
      )}

      <div className="space-y-3">
        {user.gameLibrary.map((game) => {
          const expertiseLevel = expertiseLevels.find(l => l.value === game.expertiseLevel);
          return (
            <div
              key={game.gameId}
              className="flex items-center space-x-3 p-3 bg-white rounded-lg border border-gray-200 animate-in fade-in slide-in-from-bottom-5 duration-200"
            >
              {game.gameImage && (
                <img
                  src={game.gameImage}
                  alt={game.gameName}
                  className="w-16 h-16 rounded-lg object-cover"
                />
              )}
              <div className="flex-1">
                <h3 className="font-medium text-gray-900">{game.gameName}</h3>
                <select
                  value={game.expertiseLevel}
                  onChange={(e) => void updateExpertise(game.gameId, e.target.value)}
                  className={`mt-1 px-2 py-1 rounded-full text-xs font-medium border-0 ${expertiseLevel?.color}`}
                >
                  {expertiseLevels.map(level => (
                    <option key={level.value} value={level.value}>
                      {level.label}
                    </option>
                  ))}
                </select>
              </div>
              <button
                onClick={() => void removeGame(game.gameId)}
                className="text-red-400 hover:text-red-600"
              >
                <X size={16} />
              </button>
            </div>
          );
        })}
      </div>

      {user.gameLibrary.length === 0 && (
        <div className="text-center py-8">
          <div className="text-4xl mb-2">🎲</div>
          <p className="text-gray-500">No games in your library yet</p>
          <p className="text-sm text-gray-400">Add some games to get started!</p>
        </div>
      )}
    </div>
  );
}
