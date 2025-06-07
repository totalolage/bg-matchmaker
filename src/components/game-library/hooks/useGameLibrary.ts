import { useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import { Doc } from "@convex/_generated/dataModel";
import { toast } from "sonner";
import type { GameSearchResult, ExpertiseLevel } from "../types";

export function useGameLibrary(user: Doc<"users">) {
  const updateGameLibrary = useMutation(api.users.updateGameLibrary);

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
    } catch (error) {
      console.error("Failed to add game:", error);
      toast.error("Failed to add game");
      throw error;
    }
  };

  const removeGame = async (gameId: string) => {
    try {
      const updatedLibrary = user.gameLibrary.filter((g) => g.gameId !== gameId);
      await updateGameLibrary({ gameLibrary: updatedLibrary });
      
      const removedGame = user.gameLibrary.find((g) => g.gameId === gameId);
      if (removedGame) {
        toast.success(`Removed ${removedGame.gameName} from your library`);
      }
    } catch (error) {
      console.error("Failed to remove game:", error);
      toast.error("Failed to remove game");
      throw error;
    }
  };

  const updateExpertise = async (gameId: string, newLevel: string) => {
    try {
      const updatedLibrary = user.gameLibrary.map((game) =>
        game.gameId === gameId
          ? { ...game, expertiseLevel: newLevel as ExpertiseLevel }
          : game,
      );
      await updateGameLibrary({ gameLibrary: updatedLibrary });
    } catch (error) {
      console.error("Failed to update expertise:", error);
      toast.error("Failed to update expertise level");
      throw error;
    }
  };

  return {
    addGame,
    removeGame,
    updateExpertise,
  };
}