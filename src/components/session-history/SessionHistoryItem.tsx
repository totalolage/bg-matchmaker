import {
  Calendar,
  Check,
  Clock,
  GamepadIcon,
  Heart,
  MapPin,
  Users,
  X,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { UserAvatar } from "@/components/UserAvatar";
import { cn } from "@/lib/utils";
import { Doc } from "@convex/_generated/dataModel";

interface SessionHistoryItemProps {
  interaction: Doc<"sessionInteractions">;
  session: Doc<"sessions"> & {
    hostName: string;
    hostAvatar?: string;
    interestedCount: number;
  };
}

const interactionConfig = {
  interested: {
    label: "Interested",
    icon: Heart,
    color: "text-blue-600 bg-blue-50",
    borderColor: "border-blue-200",
  },
  declined: {
    label: "Declined",
    icon: X,
    color: "text-red-600 bg-red-50",
    borderColor: "border-red-200",
  },
  accepted: {
    label: "Accepted",
    icon: Check,
    color: "text-green-600 bg-green-50",
    borderColor: "border-green-200",
  },
};

// Extract the status type from the Convex-generated session type
type SessionStatus = Doc<"sessions">["status"];

const statusConfig: Record<SessionStatus, { label: string; color: string }> = {
  proposed: { label: "Proposed", color: "bg-yellow-100 text-yellow-800" },
  established: { label: "Established", color: "bg-blue-100 text-blue-800" },
  confirmed: { label: "Confirmed", color: "bg-green-100 text-green-800" },
  completed: { label: "Completed", color: "bg-gray-100 text-gray-800" },
  cancelled: { label: "Cancelled", color: "bg-red-100 text-red-800" },
};

export function SessionHistoryItem({
  interaction,
  session,
}: SessionHistoryItemProps) {
  const config = interactionConfig[interaction.interactionType];
  const Icon = config.icon;
  const statusInfo = statusConfig[session.status];

  return (
    <Card
      className={cn(
        "p-4 hover:shadow-md transition-shadow",
        config.borderColor
      )}
    >
      <div className="flex items-start gap-4">
        {/* Game Image */}
        {session.gameImage ? (
          <img
            src={session.gameImage}
            alt={session.gameName}
            className="w-16 h-16 rounded-lg object-cover"
          />
        ) : (
          <div className="w-16 h-16 rounded-lg bg-gray-200 flex items-center justify-center">
            <GamepadIcon size={24} className="text-gray-400" />
          </div>
        )}

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-2">
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 truncate">
                {session.gameName}
              </h3>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <UserAvatar
                  user={{
                    name: session.hostName,
                    profilePic: session.hostAvatar,
                  }}
                  size="sm"
                />
                <span>Hosted by {session.hostName}</span>
              </div>
            </div>

            {/* Interaction Badge */}
            <Badge
              variant="secondary"
              className={cn("flex items-center gap-1", config.color)}
            >
              <Icon size={14} />
              {config.label}
            </Badge>
          </div>

          {/* Session Details */}
          <div className="space-y-1 text-sm text-gray-600">
            {session.scheduledTime && (
              <div className="flex items-center gap-2">
                <Calendar size={14} />
                <span>
                  {new Intl.DateTimeFormat("en-US", {
                    dateStyle: "long",
                    timeStyle: "short",
                  }).format(new Date(session.scheduledTime))}
                </span>
              </div>
            )}

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1">
                <Users size={14} />
                <span>
                  {session.minPlayers}-{session.maxPlayers} players
                </span>
              </div>

              {session.interestedCount > 0 && (
                <div className="flex items-center gap-1">
                  <Heart size={14} className="text-pink-500" />
                  <span>{session.interestedCount} interested</span>
                </div>
              )}

              {session.location && (
                <div className="flex items-center gap-1">
                  <MapPin size={14} />
                  <span>{session.location}</span>
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between mt-3">
            <Badge
              variant="outline"
              className={cn("text-xs", statusInfo.color)}
            >
              {statusInfo.label}
            </Badge>

            <div className="flex items-center gap-1 text-xs text-gray-500">
              <Clock size={12} />
              <span>
                {new Intl.DateTimeFormat("en-US", {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                }).format(new Date(interaction.createdAt))}
              </span>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
