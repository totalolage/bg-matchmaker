import { Doc } from "../../convex/_generated/dataModel";
import { Clock, Users, MapPin } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";

interface SessionCardProps {
  session: Doc<"sessions">;
}

export function SessionCard({ session }: SessionCardProps) {
  const getStatusVariant = (status: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (status) {
      case "proposed":
      case "established":
        return "secondary";
      case "confirmed":
        return "default";
      case "cancelled":
        return "destructive";
      case "completed":
      default:
        return "outline";
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start space-x-3">
          {session.gameImage && (
            <img
              src={session.gameImage}
              alt={session.gameName}
              className="w-16 h-16 rounded-lg object-cover"
            />
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg truncate">
                {session.gameName}
              </CardTitle>
              <Badge variant={getStatusVariant(session.status)}>
                {session.status}
              </Badge>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2 text-sm">
          <div className="flex items-center text-muted-foreground">
            <Users size={14} className="mr-2" />
            <span>
              {session.players.length}/{session.maxPlayers} players
            </span>
          </div>
          
          {session.scheduledTime && (
            <div className="flex items-center text-muted-foreground">
              <Clock size={14} className="mr-2" />
              <span>
                {new Date(session.scheduledTime).toLocaleDateString()} at{" "}
                {new Date(session.scheduledTime).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </div>
          )}
          
          {session.location && (
            <div className="flex items-center text-muted-foreground">
              <MapPin size={14} className="mr-2" />
              <span>{session.location}</span>
            </div>
          )}
        </div>
        
        {session.description && (
          <CardDescription className="mt-3 line-clamp-2">
            {session.description}
          </CardDescription>
        )}
      </CardContent>
    </Card>
  );
}
