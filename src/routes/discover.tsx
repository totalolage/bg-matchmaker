import { createFileRoute } from "@tanstack/react-router";
import { convexQuery, useConvexMutation } from "@convex-dev/react-query";
import { useSuspenseQuery } from "@tanstack/react-query";
import { api } from "../../convex/_generated/api";
import { SwipeCard } from "../components/SwipeCard";
import { useState } from "react";

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
    await swipeSession({
      sessionId: session._id,
      action,
    });

    setCurrentIndex(prev => prev + 1);
  };

  const currentSession = sessions[currentIndex];

  return (
    <div className="h-full bg-white flex flex-col">
        <header className="bg-white border-b border-gray-200 p-4">
          <h1 className="text-2xl font-bold text-gray-900 text-center">Discover Sessions</h1>
        </header>

        <main className="p-4 flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 flex items-center justify-center">
            {currentSession ? (
              <div key={currentSession._id} className="w-full">
                <SwipeCard session={currentSession} onSwipe={(action) => void handleSwipe(action)} />
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="text-6xl mb-4">🎉</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  All caught up!
                </h3>
                <p className="text-gray-500">
                  No more sessions to discover right now.
                </p>
                <p className="text-sm text-gray-400 mt-2">
                  Check back later for new sessions!
                </p>
              </div>
            )}
          </div>

          {currentSession && (
            <div className="flex justify-center space-x-4 mt-6">
              <button
                onClick={() => void handleSwipe("pass")}
                className="w-16 h-16 bg-red-100 hover:bg-red-200 rounded-full flex items-center justify-center transition-colors"
              >
                <span className="text-2xl">❌</span>
              </button>
              <button
                onClick={() => void handleSwipe("like")}
                className="w-16 h-16 bg-green-100 hover:bg-green-200 rounded-full flex items-center justify-center transition-colors"
              >
                <span className="text-2xl">❤️</span>
              </button>
            </div>
          )}
        </main>
      </div>
  );
}
