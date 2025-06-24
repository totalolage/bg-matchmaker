import { Download, X } from "lucide-react";
import React, { useEffect, useState } from "react";

import { Button } from "@/components/ui/button/Button";
import { Card } from "@/components/ui/card";
import { useAnalytics } from "@/hooks/useAnalytics";

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;
  prompt(): Promise<void>;
}

declare global {
  interface WindowEventMap {
    beforeinstallprompt: BeforeInstallPromptEvent;
  }
}

export const PWAInstallPrompt: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const isInstalled = window.matchMedia("(display-mode: standalone)").matches;
  const analytics = useAnalytics();

  useEffect(() => {
    const ac = new AbortController();
    window.addEventListener(
      "beforeinstallprompt",
      e => {
        e.preventDefault();
        setDeferredPrompt(e);
        setIsVisible(true);

        // Track PWA install prompt shown
        analytics.captureEvent("pwa_install_prompt_shown", {
          platforms: e.platforms,
          user_agent: navigator.userAgent,
        });
      },
      {
        signal: ac.signal,
      },
    );

    return () => {
      ac.abort();
    };
  }, [analytics]);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    try {
      // Track install button clicked
      analytics.captureEvent("pwa_install_clicked", {});

      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;

      // Track user choice
      analytics.captureEvent("pwa_install_choice", {
        outcome,
        is_installed: outcome === "accepted",
      });

      if (outcome === "accepted") {
        setIsVisible(false);

        // Track successful installation
        analytics.captureEvent("pwa_installed", {
          install_source: "prompt",
        });
      }
    } catch (error) {
      console.error("Error showing install prompt:", error);

      // Track PWA error
      analytics.trackPWAError(
        "install",
        error instanceof Error ? error : "Unknown error",
        {
          step: "prompt_interaction",
        },
      );
    }

    setDeferredPrompt(null);
  };

  const handleCloseClick = () => {
    setIsVisible(false);

    // Track install prompt dismissed
    analytics.captureEvent("pwa_install_dismissed", {
      action: "close_button",
    });
  };

  if (!isVisible || isInstalled) {
    return null;
  }

  return (
    <div className="fixed bottom-s-4 left-s-4 right-s-4 z-50 md:left-auto md:right-4 md:max-w-sm">
      <Card className="relative p-4 shadow-lg">
        <button
          onClick={handleCloseClick}
          className="absolute right-2 top-2 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="flex items-start gap-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
            <Download className="h-5 w-5 text-primary" />
          </div>

          <div className="flex-1 space-y-2">
            <h3 className="text-sm font-semibold">Install DeskoSpojka</h3>
            <p className="text-sm text-muted-foreground">
              Install our app for a better experience with offline access and
              faster loading times.
            </p>

            <div className="flex gap-2 pt-2">
              <Button
                onClick={() => void handleInstallClick()}
                size="sm"
                className="gap-2"
              >
                <Download className="h-4 w-4" />
                Install
              </Button>
              <Button
                onClick={() => {
                  handleCloseClick();
                  // Track "Not now" specifically
                  analytics.captureEvent("pwa_install_dismissed", {
                    action: "not_now_button",
                  });
                }}
                variant="ghost"
                size="sm"
              >
                Not now
              </Button>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};
