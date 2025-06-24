import { toast } from "sonner";

import { useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import { Doc } from "@convex/_generated/dataModel";

import type {
  ExpertiseLevel,
  GameSearchResult,
} from "@/components/game-library/types";
import { useAnalytics } from "@/hooks/useAnalytics";

export function useGameLibrary(user: Doc<"users">) {
  const updateGameLibrary = useMutation(api.users.updateGameLibrary);
  const analytics = useAnalytics();

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

      // Track game added
      analytics.trackGameAdded(game.bggId, game.name, "manual_search");

      toast.success(`Added ${game.name} to your library`);
    } catch (error) {
      console.error("Failed to add game:", error);
      toast.error("Failed to add game");

      // Track error
      analytics.trackError(
        new Error("Failed to add game", { cause: error }),
        "game_library_add",
        { gameId: game.bggId, gameName: game.name },
      );

      throw error;
    }
  };

  const removeGame = async (gameId: string) => {
    try {
      const removedGame = user.gameLibrary.find(g => g.gameId === gameId);
      const updatedLibrary = user.gameLibrary.filter(g => g.gameId !== gameId);
      await updateGameLibrary({ gameLibrary: updatedLibrary });

      if (removedGame) {
        // Track game removed
        analytics.captureEvent("game_removed_from_library", {
          game_id: gameId,
          game_title: removedGame.gameName,
          expertise_level: removedGame.expertiseLevel,
        });

        toast.success(`Removed ${removedGame.gameName} from your library`);
      }
    } catch (error) {
      console.error("Failed to remove game:", error);
      toast.error("Failed to remove game");

      // Track error
      analytics.trackError(
        new Error("Failed to remove game", { cause: error }),
        "game_library_remove",
        { gameId },
      );

      throw error;
    }
  };

  const updateExpertise = async (gameId: string, newLevel: string) => {
    try {
      const game = user.gameLibrary.find(g => g.gameId === gameId);
      const oldLevel = game?.expertiseLevel;

      const updatedLibrary = user.gameLibrary.map(game =>
        game.gameId === gameId ?
          { ...game, expertiseLevel: newLevel as ExpertiseLevel }
        : game,
      );
      await updateGameLibrary({ gameLibrary: updatedLibrary });

      // Track expertise update
      if (game) {
        analytics.captureEvent("game_expertise_updated", {
          game_id: gameId,
          game_title: game.gameName,
          old_level: oldLevel,
          new_level: newLevel,
        });
      }
    } catch (error) {
      console.error("Failed to update expertise:", error);
      toast.error("Failed to update expertise level");

      // Track error
      analytics.trackError(
        new Error("Failed to update expertise", { cause: error }),
        "game_expertise_update",
        { gameId, newLevel },
      );

      throw error;
    }
  };

  return {
    addGame,
    removeGame,
    updateExpertise,
  };
}
