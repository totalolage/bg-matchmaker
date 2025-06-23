import { Link } from "@tanstack/react-router";
import { Calendar, MapPin, MoreVertical, Users } from "lucide-react";
import { toast } from "sonner";

import { useMutation, useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { Id } from "@convex/_generated/dataModel";

import { EmptyState } from "@/components/EmptyState";
import { GameImage } from "@/components/GameImage";
import { PageContent, PageHeader, PageLayout } from "@/components/PageLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { UserAvatar } from "@/components/UserAvatar";

type ProposalWithStats = {
  _id: Id<"sessions">;
  _creationTime?: number;
  gameId: string;
  gameName: string;
  gameImage?: string;
  hostId: Id<"users">;
  players: Id<"users">[];
  interestedPlayers: Id<"users">[];
  status: "proposed" | "established" | "confirmed" | "completed" | "cancelled";
  scheduledTime?: number;
  location?: string;
  minPlayers: number;
  maxPlayers: number;
  description?: string;
  stats: {
    interestedCount: number;
    declinedCount: number;
    acceptedCount: number;
    totalInteractions: number;
  };
  interestedUsers: Array<{
    _id: Id<"users">;
    name: string;
    profilePic?: string;
    interactionType: "interested" | "accepted" | "declined";
  }>;
};

export function UserProposalsPage() {
  const proposals = useQuery(api.sessions.getUserProposals);
  const cancelSession = useMutation(api.sessions.cancelSession);

  if (!proposals) {
    return (
      <PageLayout>
        <PageContent>
          <div className="text-center py-8">Loading...</div>
        </PageContent>
      </PageLayout>
    );
  }

  const getStatusColor = (status: ProposalWithStats["status"]) => {
    switch (status) {
      case "proposed":
        return "bg-yellow-100 text-yellow-800";
      case "established":
        return "bg-blue-100 text-blue-800";
      case "confirmed":
        return "bg-green-100 text-green-800";
      case "completed":
        return "bg-gray-100 text-gray-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
    }
  };

  return (
    <PageLayout>
      <PageHeader>
        <h1 className="text-2xl font-bold text-gray-900 text-center">
          My Session Proposals
        </h1>
      </PageHeader>

      <PageContent>
        {proposals.length === 0 ?
          <EmptyState
            emoji="📋"
            title="No proposals yet"
            subtitle="Create a session to start organizing game nights!"
          />
        : <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {proposals.map(proposal => (
              <Card
                key={proposal._id}
                className="hover:shadow-md transition-shadow"
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      <GameImage
                        src={proposal.gameImage}
                        alt={proposal.gameName}
                        size="sm"
                      />
                      <div className="flex-1">
                        <CardTitle className="text-lg line-clamp-1">
                          {proposal.gameName}
                        </CardTitle>
                        <Badge
                          className={`mt-1 ${getStatusColor(proposal.status)}`}
                        >
                          {proposal.status}
                        </Badge>
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                        >
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link
                            to="/sessions/$sessionId"
                            params={{ sessionId: proposal._id }}
                          >
                            View Details
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          disabled={proposal.status !== "proposed"}
                        >
                          Edit Session
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-red-600"
                          disabled={
                            proposal.status === "completed" ||
                            proposal.status === "cancelled"
                          }
                          onClick={() => {
                            if (
                              confirm(
                                "Are you sure you want to cancel this session?",
                              )
                            ) {
                              cancelSession({
                                sessionId: proposal._id,
                              })
                                .then(() => {
                                  toast.success(
                                    "Session cancelled successfully",
                                  );
                                })
                                .catch(error => {
                                  toast.error("Failed to cancel session");
                                  console.error(error);
                                });
                            }
                          }}
                        >
                          Cancel Session
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>

                <CardContent className="space-y-3">
                  {/* Session Info */}
                  <div className="space-y-2 text-sm">
                    {proposal.scheduledTime && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        <span>
                          {new Intl.DateTimeFormat("en-US", {
                            dateStyle: "medium",
                            timeStyle: "short",
                          }).format(new Date(proposal.scheduledTime))}
                        </span>
                      </div>
                    )}
                    {proposal.location && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <MapPin className="h-4 w-4" />
                        <span>{proposal.location}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Users className="h-4 w-4" />
                      <span>
                        {proposal.players.length}/{proposal.minPlayers}-
                        {proposal.maxPlayers} players
                      </span>
                    </div>
                  </div>

                  {/* Response Stats */}
                  <div className="grid grid-cols-3 gap-2 pt-2 border-t">
                    <div className="text-center">
                      <div className="text-lg font-semibold text-green-600">
                        {proposal.stats.interestedCount}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Interested
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-semibold text-blue-600">
                        {proposal.stats.acceptedCount}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Accepted
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-semibold text-gray-600">
                        {proposal.stats.declinedCount}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Declined
                      </div>
                    </div>
                  </div>

                  {/* Interested Users */}
                  {proposal.interestedUsers.length > 0 && (
                    <div className="pt-2 border-t">
                      <p className="text-xs font-medium text-muted-foreground mb-2">
                        Interested Players
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {proposal.interestedUsers.slice(0, 5).map(user => (
                          <UserAvatar
                            key={user._id}
                            user={{
                              name: user.name,
                              profilePic: user.profilePic,
                            }}
                            size="sm"
                          />
                        ))}
                        {proposal.interestedUsers.length > 5 && (
                          <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-medium">
                            +{proposal.interestedUsers.length - 5}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* View Button */}
                  <Link
                    to="/sessions/$sessionId"
                    params={{ sessionId: proposal._id }}
                    className="block"
                  >
                    <Button variant="outline" className="w-full">
                      View Session Details
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        }
      </PageContent>
    </PageLayout>
  );
}
