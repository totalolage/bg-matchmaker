import { Search } from "lucide-react";
import { useEffect, useState } from "react";

import type { GameSearchResult } from "@/components/game-library/types";
import { Input } from "@/components/ui/input";
import { Doc } from "@convex/_generated/dataModel";

import { VirtualizedGameSearchResults } from "./VirtualizedGameSearchResults";

interface AddGameDialogProps {
  user: Doc<"users">;
  onAddGame: (game: GameSearchResult, expertiseLevel: string) => void;
  onClose: () => void;
}

export function AddGameDialog({
  user,
  onAddGame,
  onClose: _onClose,
}: AddGameDialogProps) {
  const [searchQuery, setSearchQuery] = useState("");

  // Reset search when dialog opens
  useEffect(() => {
    setSearchQuery("");
  }, []);

  return (
    <div className="flex flex-col gap-4">
      <div>
        <Input
          type="search"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder="Search for a game..."
          onKeyDown={e => e.key === "Enter" && e.preventDefault()}
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
