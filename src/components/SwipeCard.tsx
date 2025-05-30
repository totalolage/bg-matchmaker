import { Doc } from "../../convex/_generated/dataModel";
import { Clock, Users, MapPin, Star } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";

interface SwipeCardProps {
  session: Doc<"sessions"> & { matchScore?: number };
  onSwipe: (action: "like" | "pass") => void;
}

export function SwipeCard({ session, onSwipe }: SwipeCardProps) {
  return (
    <Card className="max-w-sm mx-auto overflow-hidden hover:scale-[1.02] transition-transform duration-300">
      {session.gameImage && (
        <div className="relative">
          <img
            src={session.gameImage}
            alt={session.gameName}
            className="w-full h-48 object-cover"
          />
          {session.matchScore && session.matchScore > 50 && (
            <Badge className="absolute top-3 right-3 bg-yellow-400 text-yellow-900 hover:bg-yellow-500">
              <Star size={12} className="mr-1" />
              Great Match!
            </Badge>
          )}
        </div>
      )}
      
      <CardHeader>
        <div className="flex items-start justify-between">
          <CardTitle className="text-2xl">
            {session.gameName}
          </CardTitle>
          <Badge variant={session.status === "proposed" ? "secondary" : "default"}>
            {session.status === "proposed" ? "Looking for players" : "Established"}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-3">
          <div className="flex items-center text-muted-foreground">
            <Users size={18} className="mr-3 text-purple-500" />
            <span>
              {session.players.length + session.interestedPlayers.length}/{session.maxPlayers} players
              {session.minPlayers > session.players.length + session.interestedPlayers.length && (
                <span className="text-sm text-muted-foreground/70 ml-1">
                  (need {session.minPlayers - session.players.length - session.interestedPlayers.length} more)
                </span>
              )}
            </span>
          </div>
          
          {session.scheduledTime && (
            <div className="flex items-center text-muted-foreground">
              <Clock size={18} className="mr-3 text-purple-500" />
              <div>
                <div>{new Date(session.scheduledTime).toLocaleDateString()}</div>
                <div className="text-sm text-muted-foreground/70">
                  {new Date(session.scheduledTime).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </div>
              </div>
            </div>
          )}
          
          {session.location && (
            <div className="flex items-center text-muted-foreground">
              <MapPin size={18} className="mr-3 text-purple-500" />
              <span>{session.location}</span>
            </div>
          )}
        </div>
        
        {session.description && (
          <CardDescription className="mt-4 p-3 bg-muted rounded-lg">
            {session.description}
          </CardDescription>
        )}
      </CardContent>
    </Card>
  );
}
