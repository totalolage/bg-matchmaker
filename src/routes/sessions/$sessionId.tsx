import { createFileRoute } from "@tanstack/react-router";
import { format } from "date-fns";
import { Calendar, MapPin, Users } from "lucide-react";

import { api } from "@convex/_generated/api";
import { Id } from "@convex/_generated/dataModel";
import { useQuery } from "convex/react";

import {
  PageContent,
  PageHeader,
  PageLayout,
} from "../../components/PageLayout";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Card } from "../../components/ui/card";

export const Route = createFileRoute("/sessions/$sessionId")({
  component: SessionDetail,
});

function SessionDetail() {
  const { sessionId } = Route.useParams();

  // Convert string to Id type
  const typedSessionId = sessionId as Id<"sessions">;

  // Get session details
  const session = useQuery(api.sessions.getSession, {
    sessionId: typedSessionId,
  });
  const currentUser = useQuery(api.users.getCurrentUser);

  if (!session || !currentUser) {
    return (
      <PageLayout>
        <PageContent>
          <div className="text-center py-8">Loading...</div>
        </PageContent>
      </PageLayout>
    );
  }

  const isHost = session.hostId === currentUser._id;
  const isPlayer = session.players.includes(currentUser._id);
  const isInterested = session.interestedPlayers.includes(currentUser._id);

  const statusColors = {
    proposed: "bg-blue-100 text-blue-800",
    established: "bg-green-100 text-green-800",
    confirmed: "bg-purple-100 text-purple-800",
    completed: "bg-gray-100 text-gray-800",
    cancelled: "bg-red-100 text-red-800",
  };

  return (
    <PageLayout>
      <PageHeader>
        <h1 className="text-2xl font-bold text-gray-900 text-center">
          Session Details
        </h1>
      </PageHeader>

      <PageContent>
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Game Info Card */}
          <Card className="p-6">
            <div className="flex items-start gap-4">
              {session.gameImage && (
                <img
                  src={session.gameImage}
                  alt={session.gameName}
                  className="w-24 h-24 object-cover rounded-lg"
                />
              )}
              <div className="flex-1">
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-2xl font-bold">{session.gameName}</h2>
                    <Badge className={statusColors[session.status]}>
                      {session.status.charAt(0).toUpperCase() +
                        session.status.slice(1)}
                    </Badge>
                  </div>
                  {isHost && <Badge variant="secondary">Host</Badge>}
                </div>
              </div>
            </div>
          </Card>

          {/* Session Details Card */}
          <Card className="p-6 space-y-4">
            <h3 className="text-lg font-semibold mb-4">Session Information</h3>

            {session.scheduledTime && (
              <div className="flex items-center gap-3">
                <Calendar className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">Date & Time</p>
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(session.scheduledTime), "PPP 'at' p")}
                  </p>
                </div>
              </div>
            )}

            {session.location && (
              <div className="flex items-center gap-3">
                <MapPin className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">Location</p>
                  <p className="text-sm text-muted-foreground">
                    {session.location}
                  </p>
                </div>
              </div>
            )}

            <div className="flex items-center gap-3">
              <Users className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="font-medium">Players</p>
                <p className="text-sm text-muted-foreground">
                  {session.players.length} / {session.minPlayers}-
                  {session.maxPlayers} players
                </p>
              </div>
            </div>

            {session.description && (
              <div className="pt-4 border-t">
                <p className="font-medium mb-2">Description</p>
                <p className="text-sm text-muted-foreground">
                  {session.description}
                </p>
              </div>
            )}
          </Card>

          {/* Players Card */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Players</h3>
            <div className="space-y-2">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">
                  Confirmed ({session.players.length})
                </p>
                <div className="flex gap-2 flex-wrap">
                  {session.players.map(playerId => (
                    <Badge key={playerId} variant="default">
                      {playerId === session.hostId ? "Host" : "Player"}
                    </Badge>
                  ))}
                </div>
              </div>

              {session.interestedPlayers.length > 0 && (
                <div className="pt-3">
                  <p className="text-sm font-medium text-muted-foreground mb-1">
                    Interested ({session.interestedPlayers.length})
                  </p>
                  <div className="flex gap-2 flex-wrap">
                    {session.interestedPlayers.map(playerId => (
                      <Badge key={playerId} variant="secondary">
                        Interested
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </Card>

          {/* Action Buttons */}
          <div className="flex gap-4">
            {!isHost && !isPlayer && !isInterested && (
              <Button className="flex-1">Express Interest</Button>
            )}
            {isInterested && (
              <Button className="flex-1" variant="secondary">
                Interest Expressed
              </Button>
            )}
            {isPlayer && !isHost && (
              <Button className="flex-1" variant="secondary">
                You're In!
              </Button>
            )}
            {isHost && (
              <Button className="flex-1" variant="outline">
                Edit Session
              </Button>
            )}
            <Button variant="outline" onClick={() => window.history.back()}>
              Back
            </Button>
          </div>
        </div>
      </PageContent>
    </PageLayout>
  );
}
