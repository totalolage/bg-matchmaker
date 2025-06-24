"use node";

import webpush from "web-push";

import { internal } from "../_generated/api";
import { internalAction } from "../_generated/server";

// Process pending notifications
export const processNotifications = internalAction({
  handler: async ctx => {
    // Get pending notifications
    const notifications = await ctx.runQuery(
      internal.notifications.helpers.getPendingNotifications,
    );

    if (notifications.length === 0) {
      return { processed: 0 };
    }

    // Get VAPID details from environment
    const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;
    const vapidSubject = process.env.VAPID_SUBJECT;
    const vapidPublicKey = process.env.VITE_VAPID_PUBLIC_KEY;

    if (!vapidPrivateKey || !vapidSubject || !vapidPublicKey) {
      console.error("VAPID keys not configured");
      return { processed: 0, error: "VAPID keys not configured" };
    }

    // Set VAPID details
    webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);

    let processed = 0;
    let failed = 0;

    // Process each notification
    for (const notification of notifications) {
      try {
        // Get user's push subscription
        const user = await ctx.runQuery(
          internal.notifications.helpers.getUserSubscription,
          { userId: notification.userId },
        );

        if (!user?.pushSubscription) {
          // Cancel notification if user has no subscription
          await ctx.runMutation(
            internal.notifications.helpers.updateNotificationStatus,
            {
              notificationId: notification._id,
              status: "cancelled",
              error: "User has no push subscription",
            },
          );
          continue;
        }

        // Prepare notification payload
        const payload = JSON.stringify({
          title: notification.title,
          body: notification.body,
          icon: notification.icon || "/pwa-192x192.png",
          badge: notification.badge || "/pwa-144x144.png",
          data: notification.data || {},
        });

        // Send push notification
        try {
          await webpush.sendNotification(user.pushSubscription, payload);

          // Mark as sent
          await ctx.runMutation(
            internal.notifications.helpers.updateNotificationStatus,
            {
              notificationId: notification._id,
              status: "sent",
              sentAt: Date.now(),
            },
          );
          processed++;
        } catch (error) {
          console.error("Failed to send push notification:", error);

          // Handle subscription gone (410) or invalid (400-499)
          const webPushError = error as {
            statusCode?: number;
            message?: string;
          };
          if (
            webPushError.statusCode &&
            webPushError.statusCode >= 400 &&
            webPushError.statusCode < 500
          ) {
            // Remove invalid subscription
            await ctx.runMutation(
              internal.notifications.helpers.removeUserSubscription,
              { userId: notification.userId },
            );

            // Cancel notification
            await ctx.runMutation(
              internal.notifications.helpers.updateNotificationStatus,
              {
                notificationId: notification._id,
                status: "cancelled",
                error: `Invalid subscription: ${webPushError.message || "Unknown error"}`,
              },
            );
          } else {
            // Retry later for other errors
            const retryCount = (notification.retryCount || 0) + 1;

            if (retryCount >= 3) {
              // Max retries reached
              await ctx.runMutation(
                internal.notifications.helpers.updateNotificationStatus,
                {
                  notificationId: notification._id,
                  status: "failed",
                  error: `Max retries reached: ${webPushError.message || "Unknown error"}`,
                },
              );
              failed++;
            } else {
              // Update retry count
              await ctx.runMutation(
                internal.notifications.helpers.updateRetryCount,
                {
                  notificationId: notification._id,
                  retryCount,
                },
              );

              // Schedule retry
              const retryDelay = Math.pow(2, retryCount) * 60 * 1000; // Exponential backoff
              await ctx.scheduler.runAfter(
                retryDelay,
                internal.notifications.worker.processNotifications,
              );
            }
          }
        }
      } catch (error) {
        console.error("Error processing notification:", error);
        failed++;
      }
    }

    return { processed, failed };
  },
});
