import { convexQuery, useConvexMutation } from "@convex-dev/react-query";
import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { useState } from "react";

import { api } from "@convex/_generated/api";
import { Id } from "@convex/_generated/dataModel";

import { PageContent, PageHeader, PageLayout } from "@/components/PageLayout";
import { SessionDiscovery } from "@/components/session-discovery";
import { Button } from "@/components/ui/button";
import { useAnalytics } from "@/hooks/useAnalytics";

export const Route = createFileRoute("/discover")({
  component: Discover,
});

function Discover() {
  const { data: sessions = [] } = useSuspenseQuery({
    ...convexQuery(api.sessions.getDiscoverySessions, {}),
  });
  const swipeSession = useConvexMutation(api.sessions.swipeSession);
  const analytics = useAnalytics();

  // Track sessions that have been interacted with optimistically
  const [interactedSessionIds, setInteractedSessionIds] = useState<Set<string>>(
    new Set(),
  );

  // Filter out sessions that have been optimistically interacted with
  const visibleSessions = sessions.filter(
    session => !interactedSessionIds.has(session._id),
  );

  const handleDecline = (sessionId: string) => {
    // Optimistically update UI immediately
    setInteractedSessionIds(prev => new Set(prev).add(sessionId));

    // Perform mutation in the background
    swipeSession({
      sessionId: sessionId as Id<"sessions">,
      action: "pass",
    }).catch(error => {
      // On error, rollback the optimistic update
      console.error("Failed to decline session:", error);

      // Track the error
      analytics.trackError(
        new Error("Failed to decline session", { cause: error }),
        "session_swipe_decline",
        { sessionId, action: "pass" },
      );

      setInteractedSessionIds(prev => {
        const next = new Set(prev);
        next.delete(sessionId);
        return next;
      });
    });
  };

  const handleInterest = (sessionId: string) => {
    // Optimistically update UI immediately
    setInteractedSessionIds(prev => new Set(prev).add(sessionId));

    // Perform mutation in the background
    swipeSession({
      sessionId: sessionId as Id<"sessions">,
      action: "like",
    }).catch(error => {
      // On error, rollback the optimistic update
      console.error("Failed to express interest in session:", error);

      // Track the error
      analytics.trackError(
        new Error("Failed to express interest", { cause: error }),
        "session_swipe_interest",
        { sessionId, action: "like" },
      );

      setInteractedSessionIds(prev => {
        const next = new Set(prev);
        next.delete(sessionId);
        return next;
      });
    });
  };

  return (
    <PageLayout>
      <PageHeader>
        <div className="flex items-center justify-between w-full">
          <h1 className="text-2xl font-bold text-gray-900">
            Discover Sessions
          </h1>
          <Link to="/sessions/create">
            <Button size="sm">
              <Plus className="h-4 w-4 mr-1" />
              Create Session
            </Button>
          </Link>
        </div>
      </PageHeader>

      <PageContent className="flex flex-col h-full p-0">
        <SessionDiscovery
          sessions={visibleSessions}
          onDecline={handleDecline}
          onInterest={handleInterest}
        />
      </PageContent>
    </PageLayout>
  );
}
