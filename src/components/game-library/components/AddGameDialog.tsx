import { Search, X } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Doc } from "@convex/_generated/dataModel";

import type { GameSearchResult } from "../types";

import { VirtualizedGameSearchResults } from "./VirtualizedGameSearchResults";

interface AddGameDialogProps {
  user: Doc<"users">;
  onAddGame: (game: GameSearchResult, expertiseLevel: string) => void;
  onClose: () => void;
}

export function AddGameDialog({
  user,
  onAddGame,
  onClose,
}: AddGameDialogProps) {
  const [searchQuery, setSearchQuery] = useState("");

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
          {...{ incremental: true }}
        />
      </div>

      <VirtualizedGameSearchResults
        searchQuery={searchQuery}
        userLibrary={user.gameLibrary}
        onAddGame={onAddGame}
      />
    </div>
  );
}
