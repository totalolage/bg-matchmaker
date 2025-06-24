import type { PostHogConfig, Properties } from "posthog-js";
import posthog from "posthog-js";

const POSTHOG_HOST = import.meta.env.VITE_POSTHOG_HOST;
if (!POSTHOG_HOST) throw new Error("missing VITE_POSTHOG_HOST envar");

const POSTHOG_KEY = import.meta.env.VITE_POSTHOG_KEY;
if (!POSTHOG_KEY) throw new Error("missing VITE_POSTHOG_KEY envar");

// PostHog configuration with privacy-first defaults
const POSTHOG_CONFIG: Partial<PostHogConfig> = {
  api_host: POSTHOG_HOST,

  // Core tracking settings
  autocapture: true,
  capture_pageview: true,
  capture_pageleave: true,
  capture_performance: true,

  // Session recording with privacy controls
  session_recording: {
    maskAllInputs: true,
    maskInputOptions: {
      password: true,
      email: true,
      tel: true,
    },
    maskTextSelector: "[data-sensitive]",
    blockClass: "ph-no-capture",
    blockSelector: "[data-no-capture]",
  },

  // Privacy settings
  persistence: "localStorage+cookie",
  cross_subdomain_cookie: false,
  secure_cookie: true,
  opt_out_capturing_by_default: false,

  // Performance settings
  capture_dead_clicks: true,

  // Error tracking
  capture_exceptions: true,

  // GDPR and privacy
  respect_dnt: true,

  // Disable features causing errors
  disable_external_dependency_loading: true,
  advanced_disable_feature_flags: true,
  advanced_disable_feature_flags_on_first_load: true,

  // Feature flags
  bootstrap: {
    featureFlags: {},
  },

  // Disable in development
  loaded: _posthog => {
    if (import.meta.env.DEV) {
      console.info("[PostHog] Initialized in development mode");
    }
  },
};

let posthogInitialized = false;

/**
 * Initialize PostHog analytics
 * Should be called once on app startup
 */
export function initPostHog(): void {
  if (posthogInitialized) return;

  try {
    posthog.init(POSTHOG_KEY, POSTHOG_CONFIG);
    posthogInitialized = true;

    // Set default user properties
    if (posthog.isFeatureEnabled("session-recording")) {
      console.info("PostHog session recording is enabled");
    }

    console.info("PostHog initialized successfully");
  } catch (error) {
    console.error("Failed to initialize PostHog:", error);
  }
}

/**
 * Check if PostHog is initialized and ready
 */
export function isPostHogReady(): boolean {
  return posthogInitialized && typeof posthog !== "undefined";
}

/**
 * Opt user out of all tracking
 */
export function optOutOfTracking(): void {
  if (isPostHogReady()) {
    posthog.opt_out_capturing();
    posthog.set_config({ disable_session_recording: true });
  }
}

/**
 * Opt user back into tracking
 */
export function optIntoTracking(): void {
  if (isPostHogReady()) {
    posthog.opt_in_capturing();
    posthog.set_config({ disable_session_recording: false });
  }
}

/**
 * Check if user has opted out of tracking
 */
export function hasOptedOut(): boolean {
  if (isPostHogReady()) {
    return posthog.has_opted_out_capturing();
  }
  return false;
}

/**
 * Identify a user with PostHog
 */
export function identifyUser(userId: string, properties?: Properties): void {
  if (isPostHogReady() && !hasOptedOut()) {
    posthog.identify(userId, properties);
  }
}

/**
 * Reset user identification (e.g., on logout)
 */
export function resetUser(): void {
  if (isPostHogReady()) {
    posthog.reset();
  }
}

/**
 * Capture a custom event
 */
export function captureEvent(eventName: string, properties?: Properties): void {
  if (isPostHogReady() && !hasOptedOut()) {
    posthog.capture(eventName, properties);
  }
}

/**
 * Capture an error event with context
 */
export function captureError(
  error: Error,
  context: string,
  metadata?: Properties,
): void {
  if (isPostHogReady() && !hasOptedOut()) {
    // Extract cause if present
    const errorCause = error.cause;

    posthog.captureException(error, {
      error_context: context,
      error_cause:
        errorCause instanceof Error ? errorCause.message
        : errorCause ? JSON.stringify(errorCause)
        : undefined,
      error_cause_message:
        errorCause instanceof Error ? errorCause.message : undefined,
      error_cause_stack:
        errorCause instanceof Error ? errorCause.stack : undefined,
      ...metadata,
    });
  }
}

/**
 * Capture PWA-specific errors
 */
export function capturePWAError(
  errorType:
    | "notification_permission"
    | "service_worker"
    | "offline"
    | "install",
  error: Error | string,
  metadata?: Properties,
): void {
  if (isPostHogReady() && !hasOptedOut()) {
    if (error instanceof Error) {
      // Use captureException for Error objects
      posthog.captureException(error, {
        error_type: errorType,
        browser: navigator.userAgent,
        platform: navigator.platform,
        ...metadata,
      });
    } else {
      // For string errors, use regular capture
      posthog.capture("pwa_error", {
        error_type: errorType,
        error_message: error,
        browser: navigator.userAgent,
        platform: navigator.platform,
        ...metadata,
        timestamp: new Date().toISOString(),
      });
    }
  }
}

// Export PostHog instance for advanced usage
export { posthog };
