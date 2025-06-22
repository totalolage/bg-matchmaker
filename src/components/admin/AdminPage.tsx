import { useConvexAction,useConvexMutation } from "@convex-dev/react-query";
import { convexQuery } from "@convex-dev/react-query";
import { useMutation,useQuery } from "@tanstack/react-query";
import {
  AlertCircle,
  CheckCircle,
  Clock,
  Database,
  Play,
  RefreshCw,
  Square,
  XCircle,
} from "lucide-react";
import { useEffect,useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { api } from "@convex/_generated/api";
import { BGG_SEEDING } from "@convex/lib/constants";

import { PageContent,PageHeader, PageLayout } from "../PageLayout";

export function AdminPage() {
  // Query seeding status - automatically stays up to date
  const { data: status } = useQuery(
    convexQuery(api.admin.getSeedingAdminStatus, {}),
  );

  // State to force re-render every second for duration update
  const [, setTick] = useState(0);

  // Update every second to show live duration
  useEffect(() => {
    const interval = setInterval(() => {
      setTick((tick) => tick + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Get Convex actions and mutations
  const startSeedingAction = useConvexAction(api.admin.startSeeding);
  const stopSeedingMutation = useConvexMutation(api.admin.stopSeeding);
  const resumeSeedingAction = useConvexAction(api.admin.resumeSeeding);

  // TanStack mutations
  const startSeeding = useMutation({
    mutationFn: () => startSeedingAction({}),
  });

  const stopSeeding = useMutation({
    mutationFn: () => {
      console.log("[AdminPage] Calling stopSeedingMutation");
      return stopSeedingMutation({});
    },
    onSuccess: () => {
      console.log("[AdminPage] Stop mutation succeeded");
    },
    onError: (error) => {
      console.error("[AdminPage] Stop mutation failed:", error);
    },
  });

  const resumeSeeding = useMutation({
    mutationFn: () => {
      console.log("[AdminPage] Calling resumeSeedingAction");
      return resumeSeedingAction({});
    },
    onSuccess: () => {
      console.log("[AdminPage] Resume mutation succeeded");
    },
    onError: (error) => {
      console.error("[AdminPage] Resume mutation failed:", error);
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
                <p className="text-sm text-muted-foreground">Already Existed</p>
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
                  <span>{new Date(status.lastUpdatedAt).toLocaleString()}</span>
                </div>
              )}
              {status?.completedAt && (
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Completed:</span>
                  <span>{new Date(status.completedAt).toLocaleString()}</span>
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
                    {new Date(status.nextRunTime).toLocaleString()}
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
                  {startSeeding.isPending ? "Restarting..." : "Restart Seeding"}
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
                    {resumeSeeding.isPending ? "Retrying..." : "Retry Seeding"}
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
      </PageContent>
    </PageLayout>
  );
}
