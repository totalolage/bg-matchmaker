import { convexQuery } from "@convex-dev/react-query";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";

import { api } from "@convex/_generated/api";

import { AdminPage } from "@/components/admin/AdminPage";

function AdminRoute() {
  const { data: user } = useQuery(convexQuery(api.auth.loggedInUser, {}));

  // Show loading state while checking user
  if (user === undefined) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  // Not logged in
  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Access Denied</h1>
          <p className="text-muted-foreground">
            Please log in to access this page.
          </p>
        </div>
      </div>
    );
  }

  // Not an admin (default to User if role is not set)
  if (!user.role || user.role !== "Admin") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Access Denied</h1>
          <p className="text-muted-foreground">
            You need admin privileges to access this page.
          </p>
        </div>
      </div>
    );
  }

  return <AdminPage />;
}

export const Route = createFileRoute("/admin")({
  component: AdminRoute,
});
