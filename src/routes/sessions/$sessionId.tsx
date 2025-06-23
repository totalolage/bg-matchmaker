import { createFileRoute } from "@tanstack/react-router";
import { Calendar, MapPin, Users, UserPlus, UserMinus } from "lucide-react";
import { toast } from "sonner";

import { api } from "@convex/_generated/api";
import { Id } from "@convex/_generated/dataModel";
import { useQuery, useMutation } from "convex/react";

import { GameImage } from "../../components/GameImage";
import {
  PageContent,
  PageHeader,
  PageLayout,
} from "../../components/PageLayout";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Separator } from "../../components/ui/separator";
import { UserAvatar } from "../../components/UserAvatar";

export const Route = createFileRoute("/sessions/$sessionId")({
  component: SessionDetail,
});

function SessionDetail() {
  const { sessionId } = Route.useParams();

  // Convert string to Id type
  const typedSessionId = sessionId as Id<"sessions">;

  // Get session details with user information
  const session = useQuery(api.sessions.getSessionWithDetails, {
    sessionId: typedSessionId,
  });
  const currentUser = useQuery(api.users.getCurrentUser);

  // Mutations
  const expressInterest = useMutation(api.sessions.expressInterest);
  const declineSession = useMutation(api.sessions.declineSession);
  const joinSession = useMutation(api.sessions.joinSession);
  const cancelSession = useMutation(api.sessions.cancelSession);

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

  // Check if user has any interaction with this session
  const userInteraction = session.interactions.interested.find(
    i => i.userId === currentUser._id
  )
    ? "interested"
    : session.interactions.declined.find(i => i.userId === currentUser._id)
    ? "declined"
    : session.interactions.accepted.find(i => i.userId === currentUser._id)
    ? "accepted"
    : null;

  const statusColors = {
    proposed: "bg-blue-100 text-blue-800",
    established: "bg-green-100 text-green-800",
    confirmed: "bg-purple-100 text-purple-800",
    completed: "bg-gray-100 text-gray-800",
    cancelled: "bg-red-100 text-red-800",
  };

  const handleExpressInterest = async () => {
    try {
      await expressInterest({ sessionId: typedSessionId });
      toast.success("Interest expressed!");
    } catch (error) {
      toast.error("Failed to express interest");
      console.error(error);
    }
  };

  const handleDeclineSession = async () => {
    try {
      await declineSession({ sessionId: typedSessionId });
      toast.success("Session declined");
    } catch (error) {
      toast.error("Failed to decline session");
      console.error(error);
    }
  };

  const handleJoinSession = async () => {
    try {
      await joinSession({ sessionId: typedSessionId });
      toast.success("Joined session successfully!");
    } catch (error) {
      toast.error("Failed to join session");
      console.error(error);
    }
  };

  const handleCancelSession = async () => {
    if (!confirm("Are you sure you want to cancel this session?")) return;
    
    try {
      await cancelSession({ sessionId: typedSessionId });
      toast.success("Session cancelled");
    } catch (error) {
      toast.error("Failed to cancel session");
      console.error(error);
    }
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
          <Card className="overflow-hidden">
            <CardHeader className="pb-4">
              <div className="flex items-start gap-4">
                <GameImage
                  src={session.gameImage}
                  alt={session.gameName}
                  size="lg"
                />
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <CardTitle className="text-2xl mb-2">
                        {session.gameName}
                      </CardTitle>
                      <div className="flex gap-2">
                        <Badge className={statusColors[session.status]}>
                          {session.status.charAt(0).toUpperCase() +
                            session.status.slice(1)}
                        </Badge>
                        {isHost && <Badge variant="secondary">You're the Host</Badge>}
                        {isPlayer && !isHost && <Badge variant="secondary">You're Playing</Badge>}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardHeader>
          </Card>

          {/* Host Information */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Host</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                <UserAvatar
                  user={{
                    name: session.host.displayName || session.host.name,
                    profilePic: session.host.profilePic,
                  }}
                  size="lg"
                />
                <div>
                  <p className="font-semibold">
                    {session.host.displayName || session.host.name}
                  </p>
                  <p className="text-sm text-muted-foreground">Session Host</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Session Details Card */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Session Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {session.scheduledTime && (
                <div className="flex items-center gap-3">
                  <Calendar className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                  <div>
                    <p className="font-medium">Date & Time</p>
                    <p className="text-sm text-muted-foreground">
                      {new Intl.DateTimeFormat("en-US", {
                        dateStyle: "full",
                        timeStyle: "short",
                      }).format(new Date(session.scheduledTime))}
                    </p>
                  </div>
                </div>
              )}

              {session.location && (
                <div className="flex items-center gap-3">
                  <MapPin className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                  <div>
                    <p className="font-medium">Location</p>
                    <p className="text-sm text-muted-foreground">
                      {session.location}
                    </p>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-3">
                <Users className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                <div>
                  <p className="font-medium">Players</p>
                  <p className="text-sm text-muted-foreground">
                    {session.players.length} / {session.minPlayers}-
                    {session.maxPlayers} players
                  </p>
                </div>
              </div>

              {session.description && (
                <>
                  <Separator />
                  <div>
                    <p className="font-medium mb-2">Description</p>
                    <p className="text-sm text-muted-foreground">
                      {session.description}
                    </p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Players Card */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Players & Interest</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Confirmed Players */}
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-3">
                  Confirmed Players ({session.playersDetails.length})
                </p>
                <div className="grid gap-2">
                  {session.playersDetails.map(player => (
                    <div
                      key={player._id}
                      className="flex items-center gap-3 p-2 rounded-lg bg-muted/50"
                    >
                      <UserAvatar
                        user={{
                          name: player.displayName || player.name,
                          profilePic: player.profilePic,
                        }}
                        size="sm"
                      />
                      <div className="flex-1">
                        <p className="font-medium text-sm">
                          {player.displayName || player.name}
                        </p>
                        {player._id === session.hostId && (
                          <p className="text-xs text-muted-foreground">Host</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Interested Players */}
              {session.interestedPlayersDetails.length > 0 && (
                <>
                  <Separator />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-3">
                      Interested Players ({session.interestedPlayersDetails.length})
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {session.interestedPlayersDetails.map(player => (
                        <div
                          key={player._id}
                          className="flex items-center gap-2 p-2 rounded-lg bg-muted/30"
                        >
                          <UserAvatar
                            user={{
                              name: player.displayName || player.name,
                              profilePic: player.profilePic,
                            }}
                            size="sm"
                          />
                          <span className="text-sm">
                            {player.displayName || player.name}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {/* Interaction Stats */}
              <Separator />
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-2xl font-semibold text-green-600">
                    {session.interactions.interested.length}
                  </p>
                  <p className="text-xs text-muted-foreground">Interested</p>
                </div>
                <div>
                  <p className="text-2xl font-semibold text-blue-600">
                    {session.interactions.accepted.length}
                  </p>
                  <p className="text-xs text-muted-foreground">Accepted</p>
                </div>
                <div>
                  <p className="text-2xl font-semibold text-gray-600">
                    {session.interactions.declined.length}
                  </p>
                  <p className="text-xs text-muted-foreground">Declined</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex gap-4">
            {!isHost && !isPlayer && !userInteraction && (
              <>
                <Button
                  className="flex-1"
                  onClick={handleExpressInterest}
                  disabled={session.status === "cancelled" || session.status === "completed"}
                >
                  <UserPlus className="mr-2 h-4 w-4" />
                  Express Interest
                </Button>
                <Button
                  className="flex-1"
                  variant="outline"
                  onClick={handleDeclineSession}
                  disabled={session.status === "cancelled" || session.status === "completed"}
                >
                  <UserMinus className="mr-2 h-4 w-4" />
                  Not Interested
                </Button>
              </>
            )}
            
            {userInteraction === "interested" && !isPlayer && (
              <>
                <Button
                  className="flex-1"
                  variant="default"
                  onClick={handleJoinSession}
                  disabled={
                    session.players.length >= session.maxPlayers ||
                    session.status === "cancelled" ||
                    session.status === "completed"
                  }
                >
                  Join Session
                </Button>
                <Button
                  className="flex-1"
                  variant="secondary"
                  disabled
                >
                  Interest Expressed ✓
                </Button>
              </>
            )}
            
            {userInteraction === "declined" && (
              <Button className="flex-1" variant="secondary" disabled>
                Not Interested
              </Button>
            )}
            
            {isPlayer && !isHost && (
              <Button className="flex-1" variant="secondary" disabled>
                You're In! 🎉
              </Button>
            )}
            
            {isHost && (
              <>
                <Button className="flex-1" variant="outline">
                  Edit Session
                </Button>
                {session.status !== "completed" && session.status !== "cancelled" && (
                  <Button
                    variant="destructive"
                    onClick={handleCancelSession}
                  >
                    Cancel Session
                  </Button>
                )}
              </>
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