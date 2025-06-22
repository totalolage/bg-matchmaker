import { Plus } from "lucide-react";
import { ComponentProps,useState } from "react";

import { EmptyState } from "@/components/EmptyState";
import { SectionHeader } from "@/components/SectionHeader";
import { Button } from "@/components/ui/button";
import { Doc } from "@convex/_generated/dataModel";

import { AddGameDialog } from "./components/AddGameDialog";
import { GameLibraryItem } from "./components/GameLibraryItem";
import { useGameLibrary } from "./hooks/useGameLibrary";

export const GameLibrary = ({ user }: { user: Doc<"users"> }) => {
  const [isAddingGame, setIsAddingGame] = useState(false);
  const { addGame, removeGame, updateExpertise } = useGameLibrary(user);

  const handleAddGame = async (game: any, expertiseLevel: string) => {
    await addGame(game, expertiseLevel);
    setIsAddingGame(false);
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
        <AddGameDialog
          user={user}
          onAddGame={handleAddGame}
          onClose={() => setIsAddingGame(false)}
        />
      )}

      <div className="space-y-3">
        {user.gameLibrary.map((game) => (
          <GameLibraryItem
            key={game.gameId}
            game={game}
            onUpdateExpertise={(gameId, level) => void updateExpertise(gameId, level)}
            onRemove={(gameId) => void removeGame(gameId)}
          />
        ))}
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