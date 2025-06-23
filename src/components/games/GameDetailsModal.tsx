import { Star } from "lucide-react";

import { GameImage } from "@/components/GameImage";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@convex/_generated/api";
import { useQuery } from "convex/react";

interface GameDetailsModalProps {
  gameId: string | null;
  isOpen: boolean;
  onClose: () => void;
}

export const GameDetailsModal = ({
  gameId,
  isOpen,
  onClose,
}: GameDetailsModalProps) => {
  const gameDetails = useQuery(
    api.games.getGameDetails,
    gameId ? { gameId } : "skip"
  );

  const renderComplexity = (complexity: number) => {
    return (
      <div className="flex items-center gap-2">
        <span className="font-medium">{complexity.toFixed(1)}/5</span>
        <div className="flex">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star
              key={i}
              className={`w-4 h-4 ${
                i < Math.round(complexity)
                  ? "fill-yellow-400 text-yellow-400"
                  : "text-gray-300"
              }`}
            />
          ))}
        </div>
      </div>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        {!gameDetails ? (
          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <Skeleton className="w-32 h-32 rounded" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-8 w-3/4" />
                <Skeleton className="h-4 w-1/4" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-16" />
              ))}
            </div>
            <Skeleton className="h-32" />
          </div>
        ) : (
          <>
            <DialogHeader className="sr-only">
              <DialogTitle>{gameDetails.name}</DialogTitle>
            </DialogHeader>
            <div className="space-y-6">
              {/* Header with image and title */}
              <div className="flex items-start gap-4">
                <GameImage
                  src={gameDetails.image}
                  alt={gameDetails.name}
                  className="w-32 h-32 rounded-lg shadow-md"
                />
                <div className="flex-1">
                  <h2 className="text-2xl font-bold">{gameDetails.name}</h2>
                  {gameDetails.yearPublished && (
                    <p className="text-muted-foreground">
                      Published in {gameDetails.yearPublished}
                    </p>
                  )}
                  {gameDetails.designer && (
                    <p className="text-sm text-muted-foreground mt-1">
                      Designed by {gameDetails.designer}
                    </p>
                  )}
                </div>
              </div>

              {/* Game stats grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <h3 className="text-sm font-semibold text-muted-foreground">
                    Player Count
                  </h3>
                  <p className="font-medium">
                    {gameDetails.minPlayers === gameDetails.maxPlayers
                      ? `${gameDetails.minPlayers} players`
                      : `${gameDetails.minPlayers}-${gameDetails.maxPlayers} players`}
                  </p>
                </div>
                <div className="space-y-1">
                  <h3 className="text-sm font-semibold text-muted-foreground">
                    Playing Time
                  </h3>
                  <p className="font-medium">
                    {gameDetails.minPlayTime === gameDetails.maxPlayTime
                      ? `${gameDetails.minPlayTime} minutes`
                      : `${gameDetails.minPlayTime}-${gameDetails.maxPlayTime} minutes`}
                  </p>
                </div>
                <div className="space-y-1">
                  <h3 className="text-sm font-semibold text-muted-foreground">
                    Complexity
                  </h3>
                  {gameDetails.complexity ? (
                    renderComplexity(gameDetails.complexity)
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      Not available
                    </p>
                  )}
                </div>
                <div className="space-y-1">
                  <h3 className="text-sm font-semibold text-muted-foreground">
                    BGG Rating
                  </h3>
                  <div className="flex items-center gap-2">
                    {gameDetails.bggRating ? (
                      <>
                        <span className="font-medium">
                          {gameDetails.bggRating.toFixed(1)}/10
                        </span>
                        {gameDetails.bggRank && (
                          <Badge variant="secondary">
                            #{gameDetails.bggRank}
                          </Badge>
                        )}
                      </>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        Not available
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Description */}
              {gameDetails.description && (
                <div className="space-y-2">
                  <h3 className="font-semibold">Description</h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {gameDetails.description}
                  </p>
                </div>
              )}

              {/* Categories & Mechanics */}
              {(gameDetails.categories?.length > 0 ||
                gameDetails.mechanics?.length > 0) && (
                <div className="space-y-3">
                  {gameDetails.categories?.length > 0 && (
                    <div>
                      <h3 className="font-semibold mb-2">Categories</h3>
                      <div className="flex flex-wrap gap-2">
                        {gameDetails.categories.map(category => (
                          <Badge key={category} variant="outline">
                            {category}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  {gameDetails.mechanics?.length > 0 && (
                    <div>
                      <h3 className="font-semibold mb-2">Mechanics</h3>
                      <div className="flex flex-wrap gap-2">
                        {gameDetails.mechanics.map(mechanic => (
                          <Badge key={mechanic} variant="secondary">
                            {mechanic}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Age recommendation */}
              {gameDetails.minAge && (
                <div className="text-sm text-muted-foreground">
                  Recommended for ages {gameDetails.minAge}+
                </div>
              )}
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};
