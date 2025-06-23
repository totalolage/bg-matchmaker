import { Plus } from "lucide-react";
import { useState } from "react";

import { EmptyState } from "@/components/EmptyState";
import { SectionHeader } from "@/components/SectionHeader";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Doc } from "@convex/_generated/dataModel";

import { AddGameDialog } from "./components/AddGameDialog";
import { GameLibraryItem } from "./components/GameLibraryItem";
import { useGameLibrary } from "./hooks/useGameLibrary";
import type { GameSearchResult } from "./types";

interface GameLibraryProps {
  user: Doc<"users">;
}

export const GameLibrary = ({ user }: GameLibraryProps) => {
  const [isAddingGame, setIsAddingGame] = useState(false);
  const { addGame, removeGame, updateExpertise } = useGameLibrary(user);

  const handleAddGame = async (
    game: GameSearchResult,
    expertiseLevel: string
  ) => {
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

      <Dialog open={isAddingGame} onOpenChange={setIsAddingGame}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle>Add New Game</DialogTitle>
          </DialogHeader>
          <AddGameDialog
            user={user}
            onAddGame={(game, expertiseLevel) =>
              void handleAddGame(game, expertiseLevel)
            }
            onClose={() => setIsAddingGame(false)}
          />
        </DialogContent>
      </Dialog>

      <div className="space-y-3">
        {user.gameLibrary.map(game => (
          <GameLibraryItem
            key={game.gameId}
            game={game}
            onUpdateExpertise={(gameId, level) =>
              void updateExpertise(gameId, level)
            }
            onRemove={gameId => void removeGame(gameId)}
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

export { type GameLibraryProps };
