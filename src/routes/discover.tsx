import { createFileRoute } from "@tanstack/react-router";
import { convexQuery, useConvexMutation } from "@convex-dev/react-query";
import { useSuspenseQuery } from "@tanstack/react-query";
import { api } from "../../convex/_generated/api";
import { SwipeCard } from "../components/SwipeCard";
import { useState } from "react";
import { Button } from "../components/ui/button";
import { PageLayout, PageHeader, PageContent } from "../components/PageLayout";
import { EmptyState } from "../components/EmptyState";

export const Route = createFileRoute("/discover")({
  component: Discover,
});

function Discover() {
  const { data: sessions } = useSuspenseQuery({
    ...convexQuery(api.sessions.getDiscoverySessions, {}),
  });
  const swipeSession = useConvexMutation(api.sessions.swipeSession);
  const [currentIndex, setCurrentIndex] = useState(0);

  const handleSwipe = async (action: "like" | "pass") => {
    if (!sessions || currentIndex >= sessions.length) return;

    const session = sessions[currentIndex];
    if (!session) return;
    
    await swipeSession({
      sessionId: session._id,
      action,
    });

    setCurrentIndex(prev => prev + 1);
  };

  const currentSession = sessions[currentIndex];

  return (
    <PageLayout>
      <PageHeader>
        <h1 className="text-2xl font-bold text-gray-900 text-center">Discover Sessions</h1>
      </PageHeader>

      <PageContent className="flex flex-col overflow-hidden">
        <div className="flex-1 flex items-center justify-center">
          {currentSession ? (
            <div key={currentSession._id} className="w-full">
              <SwipeCard session={currentSession} onSwipe={(action) => void handleSwipe(action)} />
            </div>
          ) : (
            <EmptyState 
              emoji="🎉"
              title="All caught up!"
              subtitle={
                <>
                  No more sessions to discover right now.
                  <br />
                  <span className="text-sm text-gray-400">Check back later for new sessions!</span>
                </>
              }
            />
          )}
        </div>

        {currentSession && (
          <div className="flex justify-center space-x-4 mt-6">
            <Button
              onClick={() => void handleSwipe("pass")}
              variant="outline"
              size="icon"
              className="w-16 h-16 bg-red-100 hover:bg-red-200 rounded-full"
            >
              <span className="text-2xl">❌</span>
            </Button>
            <Button
              onClick={() => void handleSwipe("like")}
              variant="outline"
              size="icon"
              className="w-16 h-16 bg-green-100 hover:bg-green-200 rounded-full"
            >
              <span className="text-2xl">❤️</span>
            </Button>
          </div>
        )}
      </PageContent>
    </PageLayout>
  );
}