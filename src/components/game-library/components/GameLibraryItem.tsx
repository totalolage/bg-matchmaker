import { X } from "lucide-react";

import { GameImage } from "@/components/GameImage";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { EXPERTISE_LEVELS } from "../constants";
import type { GameLibraryItem as GameLibraryItemType } from "../types";

interface GameLibraryItemProps {
  game: GameLibraryItemType;
  onUpdateExpertise: (gameId: string, newLevel: string) => void;
  onRemove: (gameId: string) => void;
}

export function GameLibraryItem({
  game,
  onUpdateExpertise,
  onRemove,
}: GameLibraryItemProps) {
  const expertiseLevel = EXPERTISE_LEVELS.find(
    (l) => l.value === game.expertiseLevel,
  );

  return (
    <div className="flex items-center space-x-3 p-3 bg-white rounded-lg border border-gray-200 animate-in fade-in slide-in-from-bottom-5 duration-200">
      {game.gameImage && <GameImage src={game.gameImage} alt={game.gameName} size="md" />}
      <div className="flex-1">
        <h3 className="font-medium text-gray-900">{game.gameName}</h3>
        <Select
          value={game.expertiseLevel}
          onValueChange={(value) => void onUpdateExpertise(game.gameId, value)}
        >
          <SelectTrigger
            className={`mt-1 w-32 h-7 text-xs ${expertiseLevel?.color}`}
          >
            <SelectValue />
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
      <Button
        onClick={() => void onRemove(game.gameId)}
        variant="ghost"
        size="sm"
        className="text-red-400 hover:text-red-600 h-8 w-8 p-0"
      >
        <X size={16} />
      </Button>
    </div>
  );
}