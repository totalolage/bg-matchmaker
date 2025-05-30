import { createFileRoute } from "@tanstack/react-router";
import { convexQuery } from "@convex-dev/react-query";
import { useSuspenseQuery } from "@tanstack/react-query";
import { api } from "../../convex/_generated/api";
import { SessionCard } from "../components/SessionCard";
import { ProfileDropdown } from "../components/ProfileDropdown";

export const Route = createFileRoute("/")({
  component: Home,
});

function Home() {
  const { data: sessions } = useSuspenseQuery({
    ...convexQuery(api.sessions.getUserSessions, {}),
  });

  return (
    <div className="h-full bg-white flex flex-col">
        <header className="bg-white border-b border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">🎲 GameMatch</h1>
            <ProfileDropdown />
          </div>
        </header>

        <main className="p-4 flex-1 overflow-y-auto">
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Your Sessions</h2>
            {sessions && sessions.length > 0 ? (
              <div className="space-y-3">
                {sessions.map((session) => (
                  <div key={session._id} className="animate-in fade-in slide-in-from-bottom-5 duration-200">
                    <SessionCard session={session} />
                  </div>
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
      </div>
  );
}
