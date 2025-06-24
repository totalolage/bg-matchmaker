import { Bell } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { usePushNotifications } from "@/hooks/usePushNotifications";

export function NotificationSettings() {
  const {
    isSupported,
    permission,
    isSubscribed,
    isLoading,
    subscribe,
    unsubscribe,
  } = usePushNotifications();

  if (!isSupported) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Push Notifications
          </CardTitle>
          <CardDescription>
            Push notifications are not supported in this browser. Try using a
            modern browser like Chrome, Firefox, or Safari.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Push Notifications
        </CardTitle>
        <CardDescription>
          Get notified about new game proposals, session updates, and reminders
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <Label htmlFor="notifications" className="flex items-center gap-2">
            <span>Enable push notifications</span>
            {isSubscribed && permission === "granted" && (
              <span className="text-xs text-green-600">(Active)</span>
            )}
          </Label>
          {isLoading ?
            <Skeleton className="h-6 w-11" />
          : <Switch
              id="notifications"
              checked={isSubscribed}
              onCheckedChange={checked => {
                if (checked) void subscribe();
                else void unsubscribe();
              }}
              disabled={isLoading}
            />
          }
        </div>

        {permission === "denied" && (
          <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
            <p className="font-medium">Notifications are blocked</p>
            <p className="mt-1 text-xs">
              You've blocked notifications for this site. To enable them, click
              the lock icon in your browser's address bar and allow
              notifications.
            </p>
          </div>
        )}

        {permission === "granted" && isSubscribed && (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              You'll receive notifications for:
            </p>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-primary" />
                New game session proposals
              </li>
              <li className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-primary" />
                Session confirmations and updates
              </li>
              <li className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-primary" />
                Reminders before sessions start
              </li>
              <li className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-primary" />
                When players join or leave your sessions
              </li>
            </ul>
          </div>
        )}

        {!isSubscribed && permission === "default" && (
          <div className="rounded-lg bg-muted p-3 text-sm">
            <p>
              Enable push notifications to stay updated about your game
              sessions. You can disable them anytime.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
