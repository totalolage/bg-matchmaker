import type { Properties } from "posthog-js";
import { usePostHog } from "posthog-js/react";

import {
  captureError,
  captureEvent,
  capturePWAError,
  hasOptedOut,
  identifyUser,
  optIntoTracking,
  optOutOfTracking,
  resetUser,
} from "@/lib/analytics/posthog";

interface SessionSwipeData {
  sessionId: string;
  direction: "left" | "right";
  gameTitle: string;
  gameBggId?: number;
  hostId?: string;
}

interface SessionInteractionData {
  sessionId: string;
  action: "accepted" | "declined" | "info_viewed";
  gameTitle?: string;
  metadata?: Properties;
}

interface GameSearchData {
  query: string;
  resultsCount: number;
  searchDuration?: number;
}

interface NotificationData {
  action:
    | "permission_requested"
    | "permission_granted"
    | "permission_denied"
    | "subscription_created"
    | "subscription_failed"
    | "subscription_removed";
  error?: string;
}

/**
 * Custom hook for analytics tracking
 */
export function useAnalytics() {
  const posthog = usePostHog();

  // Session discovery events
  const trackSessionSwipe = (data: SessionSwipeData) => {
    captureEvent("session_swipe", {
      session_id: data.sessionId,
      swipe_direction: data.direction,
      game_title: data.gameTitle,
      game_bgg_id: data.gameBggId,
      host_id: data.hostId,
      action_result: data.direction === "right" ? "interested" : "declined",
    });
  };

  const trackSessionInteraction = (data: SessionInteractionData) => {
    captureEvent("session_interaction", {
      session_id: data.sessionId,
      interaction_type: data.action,
      game_title: data.gameTitle,
      ...data.metadata,
    });
  };

  // Game search events
  const trackGameSearch = (data: GameSearchData) => {
    captureEvent("game_search", {
      search_query: data.query,
      results_count: data.resultsCount,
      search_duration_ms: data.searchDuration,
    });
  };

  const trackGameAdded = (
    gameId: string,
    gameTitle: string,
    source: string,
  ) => {
    captureEvent("game_added_to_library", {
      game_id: gameId,
      game_title: gameTitle,
      add_source: source,
    });
  };

  // Session creation events
  const trackSessionCreated = (
    sessionId: string,
    gameTitle: string,
    playerCount: number,
  ) => {
    captureEvent("session_created", {
      session_id: sessionId,
      game_title: gameTitle,
      max_players: playerCount,
    });
  };

  const trackSessionEdited = (sessionId: string, changes: string[]) => {
    captureEvent("session_edited", {
      session_id: sessionId,
      changed_fields: changes,
    });
  };

  // Notification events
  const trackNotificationEvent = (data: NotificationData) => {
    captureEvent("notification_event", {
      action: data.action,
      error_message: data.error,
      browser: navigator.userAgent,
    });

    // Also capture as PWA error if there's an error
    if (
      data.error &&
      (data.action === "permission_denied" ||
        data.action === "subscription_failed")
    ) {
      capturePWAError("notification_permission", data.error, {
        action: data.action,
      });
    }
  };

  // Profile events
  const trackProfileUpdate = (updatedFields: string[]) => {
    captureEvent("profile_updated", {
      updated_fields: updatedFields,
    });
  };

  // Error tracking
  const trackError = (error: Error, context: string, metadata?: Properties) => {
    captureError(error, context, metadata);
  };

  const trackPWAError = (
    errorType:
      | "notification_permission"
      | "service_worker"
      | "offline"
      | "install",
    error: Error | string,
    metadata?: Properties,
  ) => {
    capturePWAError(errorType, error, metadata);
  };

  // User identification
  const identify = (userId: string, properties?: Properties) => {
    identifyUser(userId, properties);
  };

  const reset = () => {
    resetUser();
  };

  // Privacy controls
  const optOut = () => {
    optOutOfTracking();
  };

  const optIn = () => {
    optIntoTracking();
  };

  const isOptedOut = () => hasOptedOut();

  return {
    // Session events
    trackSessionSwipe,
    trackSessionInteraction,
    trackSessionCreated,
    trackSessionEdited,

    // Game events
    trackGameSearch,
    trackGameAdded,

    // Notification events
    trackNotificationEvent,

    // Profile events
    trackProfileUpdate,

    // Error tracking
    trackError,
    trackPWAError,

    // User management
    identifyUser: identify,
    reset,

    // Privacy
    optOut,
    optIn,
    isOptedOut,

    // Direct PostHog access for custom events
    captureEvent: posthog.capture.bind(posthog),
    setUserProperties: (properties: Properties) =>
      posthog.people.set(properties),
    trackPageView: (url?: string) => posthog.capture("$pageview", { url }),
  };
}
