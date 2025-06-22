import { convexQuery } from "@convex-dev/react-query";
import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";

import { api } from "../../convex/_generated/api";
import { EmptyState } from "../components/EmptyState";
import { PageContent,PageHeader, PageLayout } from "../components/PageLayout";
import { ProfileDropdown } from "../components/ProfileDropdown";
import { SectionHeader } from "../components/SectionHeader";
import { SessionCard } from "../components/SessionCard";

export const Route = createFileRoute("/")({
  component: Home,
});

function Home() {
  const { data: sessions } = useSuspenseQuery({
    ...convexQuery(api.sessions.getUserSessions, {}),
  });

  return (
    <PageLayout>
      <PageHeader>
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">🎲 DeskoSpojka</h1>
          <ProfileDropdown />
        </div>
      </PageHeader>

      <PageContent>
        <div className="mb-6">
          <SectionHeader title="Your Sessions" />
          {sessions && sessions.length > 0 ? (
            <div className="space-y-3">
              {sessions.map((session) => (
                <div key={session._id} className="animate-in fade-in slide-in-from-bottom-5 duration-200">
                  <SessionCard session={session} />
                </div>
              ))}
            </div>
          ) : (
            <EmptyState 
              emoji="🎯"
              title="No sessions yet"
              subtitle="Start discovering games to join!"
            />
          )}
        </div>
      </PageContent>
    </PageLayout>
  );
}
