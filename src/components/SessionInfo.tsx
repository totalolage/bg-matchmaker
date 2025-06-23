import { Clock, MapPin, Users } from "lucide-react";
import { ComponentProps } from "react";

import { cn } from "@/lib/utils";
import { Doc } from "@convex/_generated/dataModel";

import { IconText } from "./IconText";

export const SessionInfo = ({
  session,
  className,
  size = "md",
  showPlayers = true,
}: {
  session: Doc<"sessions">;
  className?: string;
  size?: "sm" | "md" | "base";
  showPlayers?: boolean;
}) => {
  const iconSize =
    size === "sm" ? 14
    : size === "base" ? 18
    : 16;
  const textClass =
    size === "sm" ? "text-xs"
    : size === "base" ? "text-base"
    : "text-sm";

  const scheduledDate =
    session.scheduledTime ? new Date(session.scheduledTime) : null;

  return (
    <div className={cn("space-y-1", className)}>
      {showPlayers && (
        <IconText
          icon={<Users size={iconSize} />}
          text={`${session.players.length}/${session.maxPlayers} players`}
          className={textClass}
        />
      )}

      {scheduledDate && (
        <IconText
          icon={<Clock size={iconSize} />}
          text={new Intl.DateTimeFormat(undefined, {
            dateStyle: "medium",
            timeStyle: "short",
          }).format(scheduledDate)}
          className={textClass}
        />
      )}

      {session.location && (
        <IconText
          icon={<MapPin size={iconSize} />}
          text={session.location}
          className={textClass}
        />
      )}
    </div>
  );
};

export type SessionInfoProps = ComponentProps<typeof SessionInfo>;
