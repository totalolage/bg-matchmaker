import { createRoot } from "react-dom/client";

import { initPostHog } from "./lib/analytics/posthog";
import App from "./App";

import "./index.css";

// Initialize PostHog analytics
initPostHog();

// Disable pull-to-refresh in standalone PWA mode
if (window.matchMedia("(display-mode: standalone)").matches) {
  // Prevent the default pull-to-refresh behavior
  let lastTouchY = 0;
  let preventPullToRefresh = false;

  document.addEventListener(
    "touchstart",
    e => {
      if (e.touches.length !== 1) return;
      lastTouchY = e.touches[0]!.clientY;
      preventPullToRefresh = window.scrollY === 0;
    },
    { passive: false },
  );

  document.addEventListener(
    "touchmove",
    e => {
      const touchY = e.touches[0]!.clientY;
      const touchYDelta = touchY - lastTouchY;
      lastTouchY = touchY;

      if (preventPullToRefresh && touchYDelta > 0 && window.scrollY === 0) {
        e.preventDefault();
      }
    },
    { passive: false },
  );
}

createRoot(document.getElementById("root")!).render(<App />);
