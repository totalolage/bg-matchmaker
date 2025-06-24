import { useLocation } from "@tanstack/react-router";
import { useEffect } from "react";

import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";

import { posthog } from "@/lib/analytics/posthog";

/**
 * Component that tracks user and page context for analytics
 */
export function AnalyticsContext() {
  const location = useLocation();
  const currentUser = useQuery(api.users.getCurrentUser);

  // Track user identification
  useEffect(() => {
    if (currentUser) {
      // Identify user with PostHog
      posthog.identify(currentUser._id, {
        name: currentUser.name,
        displayName: currentUser.displayName,
        email: currentUser.email,
        hasGameLibrary: currentUser.gameLibrary.length > 0,
        gameCount: currentUser.gameLibrary.length,
        hasAvailability: (currentUser.availability?.length ?? 0) > 0,
        discordId: currentUser.discordId,
        createdAt: currentUser._creationTime,
      });

      // Set user properties that persist across sessions
      posthog.setPersonProperties({
        lastSeen: new Date().toISOString(),
        profileCompleted:
          currentUser.gameLibrary.length > 0 &&
          (currentUser.availability?.length ?? 0) > 0,
      });
    } else {
      // User logged out - reset PostHog
      posthog.reset();
    }
  }, [currentUser]);

  // Track page views with context
  useEffect(() => {
    // Set global properties for all events
    posthog.register({
      currentPath: location.pathname,
      currentRoute: location.pathname,
      referrer: document.referrer,
      screenWidth: window.innerWidth,
      screenHeight: window.innerHeight,
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString(),
    });

    // Track page view
    posthog.capture("$pageview", {
      $current_url: window.location.href,
      path: location.pathname,
      search: location.search,
      hash: location.hash,
    });
  }, [location]);

  return null;
}
