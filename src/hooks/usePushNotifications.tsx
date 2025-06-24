import { useState } from "react";
import { toast } from "sonner";

import { useMutation, useQuery } from "convex/react";
import { api } from "@convex/_generated/api";

// Convert base64 to Uint8Array for subscription
function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function usePushNotifications() {
  const isSupported =
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window;
  const [permission, setPermission] = useState<NotificationPermission>(
    isSupported ? Notification.permission : "default",
  );
  const [isLoading, setIsLoading] = useState(false);

  const subscriptionStatus = useQuery(api.notifications.getSubscriptionStatus);
  const subscribe = useMutation(api.notifications.subscribe);
  const unsubscribe = useMutation(api.notifications.unsubscribe);

  // Subscribe to push notifications
  const subscribeToPush = async () => {
    if (!isSupported) {
      toast.error("Push notifications are not supported in this browser");
      return;
    }

    setIsLoading(true);

    try {
      // Request notification permission
      const permission = await Notification.requestPermission();
      setPermission(permission);

      if (permission !== "granted") {
        toast.error("Please enable notifications in your browser settings");
        return;
      }

      // Get service worker registration
      const registration = await navigator.serviceWorker.ready;

      // Get VAPID public key
      const vapidPublicKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;
      if (!vapidPublicKey) {
        throw new Error("VAPID public key not configured");
      }

      // Subscribe to push notifications
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
      });

      // Convert subscription to JSON
      const subscriptionJson = subscription.toJSON();
      if (
        !subscriptionJson.endpoint ||
        !subscriptionJson.keys ||
        !subscriptionJson.keys.p256dh ||
        !subscriptionJson.keys.auth
      ) {
        throw new Error("Invalid subscription");
      }

      // Save subscription to backend
      await subscribe({
        subscription: {
          endpoint: subscriptionJson.endpoint,
          keys: {
            p256dh: subscriptionJson.keys.p256dh,
            auth: subscriptionJson.keys.auth,
          },
        },
      });

      toast.success("You'll receive notifications for game sessions");
    } catch (error) {
      console.error("Error subscribing to push notifications:", error);
      toast.error("Failed to enable notifications. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };
  // Unsubscribe from push notifications
  const unsubscribeFromPush = async () => {
    setIsLoading(true);

    try {
      // Get service worker registration
      const registration = await navigator.serviceWorker.ready;

      // Get current subscription
      const subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        // Unsubscribe from browser
        await subscription.unsubscribe();
      }

      // Remove subscription from backend
      await unsubscribe();

      toast.success("You won't receive notifications anymore");
    } catch (error) {
      console.error("Error unsubscribing from push notifications:", error);
      toast.error("Failed to disable notifications. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isSupported,
    permission,
    isSubscribed: subscriptionStatus?.subscribed ?? false,
    isLoading,
    subscribe: subscribeToPush,
    unsubscribe: unsubscribeFromPush,
  };
}
