import { createFileRoute } from "@tanstack/react-router";
import { convexQuery } from "@convex-dev/react-query";
import { useSuspenseQuery } from "@tanstack/react-query";
import { api } from "../../convex/_generated/api";
import { Navigation } from "../components/Navigation";
import { SessionCard } from "../components/SessionCard";
import { motion } from "framer-motion";
import { useCurrentUser } from "../hooks/useCurrentUser";

export const Route = createFileRoute("/")({
  component: Home,
});

function Home() {
  const user = useCurrentUser();
  const { data: sessions } = useSuspenseQuery(convexQuery(api.sessions.getUserSessions, {}));

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50">
      <div className="max-w-md mx-auto bg-white min-h-screen shadow-xl">
        <header className="bg-white border-b border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">🎲 GameMatch</h1>
            <div className="flex items-center space-x-2">
              <img
                src={user.profilePic || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.name}`}
                alt={user.name}
                className="w-8 h-8 rounded-full"
              />
              <span className="text-sm font-medium text-gray-700">{user.name}</span>
            </div>
          </div>
        </header>

        <main className="p-4 pb-20">
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Your Sessions</h2>
            {sessions && sessions.length > 0 ? (
              <div className="space-y-3">
                {sessions.map((session, index) => (
                  <motion.div
                    key={session._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <SessionCard session={session} />
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="text-4xl mb-2">🎯</div>
                <p className="text-gray-500">No sessions yet</p>
                <p className="text-sm text-gray-400">Start discovering games to join!</p>
              </div>
            )}
          </div>
        </main>

        <Navigation />
      </div>
    </div>
  );
}
