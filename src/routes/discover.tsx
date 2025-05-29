import { createFileRoute } from "@tanstack/react-router";
import { convexQuery } from "@convex-dev/react-query";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Navigation } from "../components/Navigation";
import { SwipeCard } from "../components/SwipeCard";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export const Route = createFileRoute("/discover")({
  component: Discover,
});

function Discover() {
  const { data: sessions } = useSuspenseQuery(convexQuery(api.sessions.getDiscoverySessions, {}));
  const swipeSession = useMutation(api.sessions.swipeSession);
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
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50">
      <div className="max-w-md mx-auto bg-white min-h-screen shadow-xl">
        <header className="bg-white border-b border-gray-200 p-4">
          <h1 className="text-2xl font-bold text-gray-900 text-center">Discover Sessions</h1>
        </header>

        <main className="p-4 pb-20 flex-1 flex flex-col">
          <div className="flex-1 flex items-center justify-center">
            <AnimatePresence mode="wait">
              {currentSession ? (
                <motion.div
                  key={currentSession._id}
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.8, opacity: 0 }}
                  className="w-full"
                >
                  <SwipeCard session={currentSession} onSwipe={handleSwipe} />
                </motion.div>
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center py-8"
                >
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
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {currentSession && (
            <div className="flex justify-center space-x-4 mt-6">
              <button
                onClick={() => handleSwipe("pass")}
                className="w-16 h-16 bg-red-100 hover:bg-red-200 rounded-full flex items-center justify-center transition-colors"
              >
                <span className="text-2xl">❌</span>
              </button>
              <button
                onClick={() => handleSwipe("like")}
                className="w-16 h-16 bg-green-100 hover:bg-green-200 rounded-full flex items-center justify-center transition-colors"
              >
                <span className="text-2xl">❤️</span>
              </button>
            </div>
          )}
        </main>

        <Navigation />
      </div>
    </div>
  );
}
