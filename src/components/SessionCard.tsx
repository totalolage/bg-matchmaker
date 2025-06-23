import { Link } from "@tanstack/react-router";
import { ComponentProps } from "react";

import { Doc } from "@convex/_generated/dataModel";

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
  className,
  clickable = false,
}: {
  session: Doc<"sessions">;
  className?: string;
  clickable?: boolean;
}) => {
  const getStatusVariant = (
    status: string,
  ): "default" | "secondary" | "destructive" | "outline" => {
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

  const cardContent = (
    <Card
      className={`${className} ${clickable ? "cursor-pointer hover:shadow-md transition-shadow" : ""}`}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start space-x-3">
          <GameImage src={session.gameImage} alt={session.gameName} size="md" />
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
        <SessionInfo session={session} size="sm" />

        {session.description && (
          <CardDescription className="mt-3 line-clamp-2">
            {session.description}
          </CardDescription>
        )}
      </CardContent>
    </Card>
  );

  if (clickable) {
    return (
      <Link to="/sessions/$sessionId" params={{ sessionId: session._id }}>
        {cardContent}
      </Link>
    );
  }

  return cardContent;
};

export type SessionCardProps = ComponentProps<typeof SessionCard>;
