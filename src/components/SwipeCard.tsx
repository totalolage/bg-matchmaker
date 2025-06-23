import { Star, Users } from "lucide-react";
import { ComponentProps } from "react";

import { Doc } from "../../convex/_generated/dataModel";

import { Badge } from "./ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { GameImage } from "./GameImage";
import { SessionInfo } from "./SessionInfo";

export const SessionCard = ({
  session,
}: {
  session: Doc<"sessions"> & { matchScore?: number };
}) => (
  <Card className="h-full overflow-hidden flex flex-col">
    {session.gameImage && (
      <div className="relative flex-shrink-0">
        <GameImage
          src={session.gameImage}
          alt={session.gameName}
          size="full"
          className="w-full h-64 object-cover"
        />
        {session.matchScore && session.matchScore > 50 && (
          <Badge className="absolute top-3 right-3 bg-yellow-400 text-yellow-900 hover:bg-yellow-500">
            <Star size={12} className="mr-1" />
            Great Match!
          </Badge>
        )}
      </div>
    )}

    <CardHeader className="flex-shrink-0">
      <div className="flex items-start justify-between">
        <CardTitle className="text-2xl">{session.gameName}</CardTitle>
        <Badge
          variant={session.status === "proposed" ? "secondary" : "default"}
        >
          {session.status === "proposed" ?
            "Looking for players"
          : "Established"}
        </Badge>
      </div>
    </CardHeader>

    <CardContent className="flex-1 overflow-y-auto pb-16">
      <div className="space-y-3">
        <div className="flex items-center text-muted-foreground">
          <Users size={18} className="mr-3 text-purple-500" />
          <span>
            {session.players.length + session.interestedPlayers.length}/
            {session.maxPlayers} players
            {session.minPlayers >
              session.players.length + session.interestedPlayers.length && (
              <span className="text-sm text-muted-foreground/70 ml-1">
                (need{" "}
                {session.minPlayers -
                  session.players.length -
                  session.interestedPlayers.length}{" "}
                more)
              </span>
            )}
          </span>
        </div>

        <SessionInfo session={session} size="base" showPlayers={false} />
      </div>

      {session.description && (
        <CardDescription className="mt-4 p-4 bg-muted rounded-lg text-base">
          {session.description}
        </CardDescription>
      )}
    </CardContent>
  </Card>
);

export type SwipeCardProps = ComponentProps<typeof SessionCard>;
