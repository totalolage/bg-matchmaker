import { convexQuery, useConvexMutation } from "@convex-dev/react-query";
import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";

import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { PageContent, PageHeader, PageLayout } from "../components/PageLayout";
import { SessionDiscovery } from "../components/session-discovery";

export const Route = createFileRoute("/discover")({
  component: Discover,
});

function Discover() {
  const { data: sessions = [] } = useSuspenseQuery({
    ...convexQuery(api.sessions.getDiscoverySessions, {}),
  });
  const swipeSession = useConvexMutation(api.sessions.swipeSession);
  
  // Track sessions that have been interacted with optimistically
  const [interactedSessionIds, setInteractedSessionIds] = useState<Set<string>>(
    new Set()
  );
  
  // Filter out sessions that have been optimistically interacted with
  const visibleSessions = sessions.filter((session) => !interactedSessionIds.has(session._id));

  const handleDecline = (sessionId: string) => {
    // Optimistically update UI immediately
    setInteractedSessionIds((prev) => new Set(prev).add(sessionId));
    
    // Perform mutation in the background
    swipeSession({
      sessionId: sessionId as Id<"sessions">,
      action: "pass",
    }).catch((error) => {
      // On error, rollback the optimistic update
      console.error("Failed to decline session:", error);
      setInteractedSessionIds((prev) => {
        const next = new Set(prev);
        next.delete(sessionId);
        return next;
      });
    });
  };

  const handleInterest = (sessionId: string) => {
    // Optimistically update UI immediately
    setInteractedSessionIds((prev) => new Set(prev).add(sessionId));
    
    // Perform mutation in the background
    swipeSession({
      sessionId: sessionId as Id<"sessions">,
      action: "like",
    }).catch((error) => {
      // On error, rollback the optimistic update
      console.error("Failed to express interest in session:", error);
      setInteractedSessionIds((prev) => {
        const next = new Set(prev);
        next.delete(sessionId);
        return next;
      });
    });
  };

  return (
    <PageLayout>
      <PageHeader>
        <h1 className="text-2xl font-bold text-gray-900 text-center">
          Discover Sessions
        </h1>
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
