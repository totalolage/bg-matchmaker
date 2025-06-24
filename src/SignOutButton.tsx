"use client";
import { useAuthActions } from "@convex-dev/auth/react";

import { useConvexAuth } from "convex/react";

import { Button } from "./components/ui/button";
import { useAnalytics } from "./hooks/useAnalytics";

export function SignOutButton() {
  const { isAuthenticated } = useConvexAuth();
  const { signOut } = useAuthActions();
  const analytics = useAnalytics();

  const handleSignOut = async () => {
    try {
      // Track sign out
      analytics.captureEvent("auth_signout", {
        method: "manual",
      });

      await signOut();
    } catch (error) {
      // Track sign out error
      analytics.trackError(
        new Error("Failed to sign out", { cause: error }),
        "auth_signout",
        {},
      );
    }
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <Button variant="outline" onClick={() => void handleSignOut()}>
      Sign out
    </Button>
  );
}
