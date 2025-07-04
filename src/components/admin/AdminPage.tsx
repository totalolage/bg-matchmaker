import { useConvexAction, useConvexMutation } from "@convex-dev/react-query";
import { convexQuery } from "@convex-dev/react-query";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  AlertCircle,
  Bell,
  CheckCircle,
  Clock,
  Database,
  Play,
  RefreshCw,
  Square,
  XCircle,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { useMutation as useConvexMutationDirect } from "convex/react";
import { api } from "@convex/_generated/api";
import { BGG_SEEDING } from "@convex/lib/constants";

import { PageContent, PageHeader, PageLayout } from "@/components/PageLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useAnalytics } from "@/hooks/useAnalytics";
import { usePushNotifications } from "@/hooks/usePushNotifications";

import { CSVUpload } from "./CSVUpload";

export function AdminPage() {
  const analytics = useAnalytics();

  // Query seeding status - automatically stays up to date
  const { data: status } = useQuery(
    convexQuery(api.admin.getSeedingAdminStatus, {}),
  );

  // State to force re-render every second for duration update
  const [, setTick] = useState(0);

  // Update every second to show live duration
  useEffect(() => {
    const interval = setInterval(() => {
      setTick(tick => tick + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Push notifications
  const { isSubscribed, permission } = usePushNotifications();
  const sendTestNotification = useConvexMutationDirect(
    api.notifications.sendTestNotification,
  );

  // Get Convex actions and mutations
  const startSeedingAction = useConvexAction(api.admin.startSeeding);
  const stopSeedingMutation = useConvexMutation(api.admin.stopSeeding);
  const resumeSeedingAction = useConvexAction(api.admin.resumeSeeding);

  // TanStack mutations
  const startSeeding = useMutation({
    mutationFn: () => startSeedingAction({}),
    onSuccess: () => {
      analytics.captureEvent("admin_seeding_started", {});
    },
    onError: error => {
      analytics.trackError(
        new Error("Failed to start seeding", { cause: error }),
        "admin_seeding_start",
        {},
      );
    },
  });

  const stopSeeding = useMutation({
    mutationFn: () => {
      console.log("[AdminPage] Calling stopSeedingMutation");
      return stopSeedingMutation({});
    },
    onSuccess: () => {
      console.log("[AdminPage] Stop mutation succeeded");
      analytics.captureEvent("admin_seeding_stopped", {});
    },
    onError: error => {
      console.error("[AdminPage] Stop mutation failed:", error);
      analytics.trackError(
        new Error("Failed to stop seeding", { cause: error }),
        "admin_seeding_stop",
        {},
      );
    },
  });

  const resumeSeeding = useMutation({
    mutationFn: () => {
      console.log("[AdminPage] Calling resumeSeedingAction");
      return resumeSeedingAction({});
    },
    onSuccess: () => {
      console.log("[AdminPage] Resume mutation succeeded");
      analytics.captureEvent("admin_seeding_resumed", {});
    },
    onError: error => {
      console.error("[AdminPage] Resume mutation failed:", error);
      analytics.trackError(
        new Error("Failed to resume seeding", { cause: error }),
        "admin_seeding_resume",
        {},
      );
    },
  });

  const handleStart = () => {
    startSeeding.mutate();
  };

  const handleStop = () => {
    console.log("[AdminPage] Stop button clicked");
    stopSeeding.mutate();
  };

  const handleResume = () => {
    console.log("[AdminPage] Resume button clicked");
    resumeSeeding.mutate();
  };

  const handleTestNotification = async () => {
    try {
      analytics.captureEvent("admin_test_notification_attempted", {});

      const result = await sendTestNotification();
      if (result.queued) {
        toast.success("Test notification sent successfully!");
        analytics.captureEvent("admin_test_notification_sent", {});
      } else {
        toast.error("Failed to send test notification");
        analytics.trackError(
          new Error("Test notification not queued"),
          "admin_test_notification",
          { queued: false },
        );
      }
    } catch (error) {
      console.error("Failed to send test notification:", error);
      toast.error("Failed to send test notification");
      analytics.trackError(
        new Error("Failed to send test notification", { cause: error }),
        "admin_test_notification",
        {},
      );
    }
  };

  const getStatusBadge = () => {
    if (!status) return null;

    const statusConfig = {
      not_started: {
        label: "Not Started",
        variant: "secondary" as const,
        icon: AlertCircle,
      },
      in_progress: {
        label: "In Progress",
        variant: "default" as const,
        icon: RefreshCw,
      },
      completed: {
        label: "Completed",
        variant: "success" as const,
        icon: CheckCircle,
      },
      stopping: {
        label: "Stopping...",
        variant: "warning" as const,
        icon: Square,
      },
      stopped: {
        label: "Stopped",
        variant: "secondary" as const,
        icon: Square,
      },
      failed: {
        label: "Failed",
        variant: "destructive" as const,
        icon: XCircle,
      },
    };

    const config =
      statusConfig[status.seedingStatus as keyof typeof statusConfig] ||
      statusConfig.not_started;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  const getProgressPercentage = () => {
    if (!status || status.seedingStatus === "not_started") return 0;

    if (!status.lastProcessedId) return 0;
    const percentageSkipped = status.totalSkipped / status.totalProcessed;
    const estimatedTotal = BGG_SEEDING.EST_GAME_COUNT * (1 + percentageSkipped);
    return Math.min((status.lastProcessedId / estimatedTotal) * 100, 100);
  };

  return (
    <PageLayout>
      <PageHeader>
        <h1 className="text-2xl font-bold text-gray-900 text-center">
          Admin Dashboard
        </h1>
      </PageHeader>

      <PageContent>
        <div className="space-y-6">
          <CSVUpload />

          {/* Push Notifications Test */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Push Notifications Test
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-sm text-muted-foreground">
                <p>
                  Test your push notification setup by sending a test
                  notification.
                </p>
                <p className="mt-2">
                  Status:{" "}
                  {isSubscribed ?
                    <span className="text-green-600 font-medium">
                      Subscribed
                    </span>
                  : <span className="text-amber-600 font-medium">
                      Not subscribed
                    </span>
                  }
                </p>
                <p>
                  Permission:{" "}
                  <span className="font-medium capitalize">{permission}</span>
                </p>
              </div>
              <Button
                onClick={() => void handleTestNotification()}
                disabled={!isSubscribed}
                variant="outline"
                className="flex items-center gap-2"
              >
                <Bell className="h-4 w-4" />
                Send Test Notification
              </Button>
              {!isSubscribed && (
                <p className="text-sm text-muted-foreground">
                  You need to enable notifications in your profile settings
                  first.
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  BGG Database Seeding
                </CardTitle>
                {getStatusBadge()}
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Progress Overview */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Progress</span>
                  <span>{getProgressPercentage().toFixed(1)}%</span>
                </div>
                <Progress value={getProgressPercentage()} className="h-2" />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>BGG ID: {status?.lastProcessedId || 0}</span>
                  <span>
                    Est.{" "}
                    {new Intl.NumberFormat().format(BGG_SEEDING.EST_GAME_COUNT)}{" "}
                    total games
                  </span>
                </div>
              </div>

              {/* Statistics */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">IDs Processed</p>
                  <p className="text-2xl font-semibold">
                    {status?.totalProcessed?.toLocaleString() || 0}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Games Added</p>
                  <p className="text-2xl font-semibold text-green-600">
                    {status?.totalSuccess?.toLocaleString() || 0}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">
                    Already Existed
                  </p>
                  <p className="text-2xl font-semibold text-blue-600">
                    {status?.totalSkipped?.toLocaleString() || 0}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Errors</p>
                  <p className="text-2xl font-semibold text-red-600">
                    {status?.totalErrors?.toLocaleString() || 0}
                  </p>
                </div>
              </div>

              {/* Timing Information */}
              <div className="space-y-2 text-sm">
                {status?.startedAt && (
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Started:</span>
                    <span>{new Date(status.startedAt).toLocaleString()}</span>
                  </div>
                )}
                {status?.lastUpdatedAt && (
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Last Updated:</span>
                    <span>
                      {new Intl.DateTimeFormat("en-US", {
                        dateStyle: "medium",
                        timeStyle: "medium",
                      }).format(new Date(status.lastUpdatedAt))}
                    </span>
                  </div>
                )}
                {status?.completedAt && (
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Completed:</span>
                    <span>
                      {new Intl.DateTimeFormat("en-US", {
                        dateStyle: "medium",
                        timeStyle: "medium",
                      }).format(new Date(status.completedAt))}
                    </span>
                  </div>
                )}
              </div>

              {/* Cron Status */}
              {status?.isCronActive && (
                <div className="rounded-lg bg-muted p-4 space-y-2">
                  <div className="flex items-center gap-2">
                    <RefreshCw className="h-4 w-4 text-muted-foreground animate-spin" />
                    <span className="text-sm font-medium">
                      Seeding is active and will auto-continue
                    </span>
                  </div>
                  {status.nextRunTime && (
                    <p className="text-sm text-muted-foreground">
                      If needed, next batch will start around:{" "}
                      {new Intl.DateTimeFormat("en-US", {
                        dateStyle: "medium",
                        timeStyle: "medium",
                      }).format(new Date(status.nextRunTime))}
                    </p>
                  )}
                </div>
              )}

              {/* Error Display */}
              {status?.error && (
                <div className="rounded-lg bg-destructive/10 p-4">
                  <p className="text-sm text-destructive">{status.error}</p>
                </div>
              )}

              {/* Control Buttons */}
              <div className="flex gap-2">
                {(!status || status.seedingStatus === "not_started") && (
                  <Button
                    onClick={handleStart}
                    disabled={startSeeding.isPending}
                    className="flex items-center gap-2"
                  >
                    <Play className="h-4 w-4" />
                    {startSeeding.isPending ? "Starting..." : "Start Seeding"}
                  </Button>
                )}

                {status?.seedingStatus === "in_progress" && (
                  <Button
                    onClick={handleStop}
                    disabled={stopSeeding.isPending}
                    variant="destructive"
                    className="flex items-center gap-2"
                  >
                    <Square className="h-4 w-4" />
                    {stopSeeding.isPending ? "Stopping..." : "Stop Seeding"}
                  </Button>
                )}

                {status?.seedingStatus === "stopping" && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Square className="h-4 w-4 animate-pulse" />
                    <span>Stopping gracefully...</span>
                  </div>
                )}

                {status?.seedingStatus === "stopped" && (
                  <Button
                    onClick={handleResume}
                    disabled={resumeSeeding.isPending}
                    className="flex items-center gap-2"
                  >
                    <Play className="h-4 w-4" />
                    {resumeSeeding.isPending ? "Resuming..." : "Resume Seeding"}
                  </Button>
                )}

                {status?.seedingStatus === "completed" && (
                  <Button
                    onClick={handleStart}
                    disabled={startSeeding.isPending}
                    className="flex items-center gap-2"
                  >
                    <RefreshCw className="h-4 w-4" />
                    {startSeeding.isPending ?
                      "Restarting..."
                    : "Restart Seeding"}
                  </Button>
                )}

                {status?.seedingStatus === "failed" && (
                  <>
                    <Button
                      onClick={handleResume}
                      disabled={resumeSeeding.isPending}
                      className="flex items-center gap-2"
                    >
                      <RefreshCw className="h-4 w-4" />
                      {resumeSeeding.isPending ?
                        "Retrying..."
                      : "Retry Seeding"}
                    </Button>
                    <Button
                      onClick={handleStop}
                      disabled={stopSeeding.isPending}
                      variant="destructive"
                      className="flex items-center gap-2"
                    >
                      <Square className="h-4 w-4" />
                      {stopSeeding.isPending ? "Stopping..." : "Stop"}
                    </Button>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </PageContent>
    </PageLayout>
  );
}
