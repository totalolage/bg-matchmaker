import { PostHogProvider as PHProvider } from "posthog-js/react";
import { PropsWithChildren, useEffect } from "react";

import { initPostHog, posthog } from "@/lib/analytics/posthog";

export function PostHogProvider({ children }: PropsWithChildren) {
  useEffect(() => {
    initPostHog();

    // Track PWA status on app load
    const isStandalone = window.matchMedia(
      "(display-mode: standalone)",
    ).matches;
    const isPWA =
      isStandalone ||
      (window.navigator as unknown as { standalone?: boolean }).standalone ===
        true;

    if (isPWA) {
      posthog.capture("pwa_app_launched", {
        display_mode: isStandalone ? "standalone" : "browser",
        is_ios: /iPad|iPhone|iPod/.test(navigator.userAgent),
        is_android: /Android/.test(navigator.userAgent),
      });
    }
  }, []);

  return <PHProvider client={posthog}>{children}</PHProvider>;
}
