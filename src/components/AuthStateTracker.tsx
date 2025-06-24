import { useEffect, useRef } from "react";

import { useConvexAuth, useQuery } from "convex/react";
import { api } from "@convex/_generated/api";

import { useAnalytics } from "@/hooks/useAnalytics";

export function AuthStateTracker() {
  const { isAuthenticated, isLoading } = useConvexAuth();
  const user = useQuery(api.users.getCurrentUser);
  const analytics = useAnalytics();
  const hasTrackedAuth = useRef(false);

  useEffect(() => {
    // Only track once per session when auth state changes
    if (!isLoading && isAuthenticated && user && !hasTrackedAuth.current) {
      hasTrackedAuth.current = true;

      // Track successful authentication
      analytics.captureEvent("auth_signin_success", {
        provider: "discord",
        user_id: user._id,
        has_games: user.gameLibrary.length > 0,
      });
    }
  }, [isAuthenticated, isLoading, user, analytics]);

  return null;
}
