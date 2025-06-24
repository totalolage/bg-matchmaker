import { getAuthUserId } from "@convex-dev/auth/server";

import { v } from "convex/values";

import { internal } from "./_generated/api";
import { mutation, query } from "./_generated/server";

// Subscribe to push notifications
export const subscribe = mutation({
  args: {
    subscription: v.object({
      endpoint: v.string(),
      keys: v.object({
        p256dh: v.string(),
        auth: v.string(),
      }),
    }),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    // Update the user's push subscription
    await ctx.db.patch(userId, {
      pushSubscription: args.subscription,
    });

    return { success: true };
  },
});

// Unsubscribe from push notifications
export const unsubscribe = mutation({
  handler: async ctx => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    // Remove the push subscription
    await ctx.db.patch(userId, {
      pushSubscription: undefined,
    });

    return { success: true };
  },
});

// Get subscription status
export const getSubscriptionStatus = query({
  handler: async ctx => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return { subscribed: false };
    }

    const user = await ctx.db.get(userId);
    return {
      subscribed: !!user?.pushSubscription,
    };
  },
});

// Queue a notification for a user
export const queueNotification = mutation({
  args: {
    userId: v.id("users"),
    type: v.union(
      v.literal("session_reminder"),
      v.literal("session_update"),
      v.literal("new_proposal"),
      v.literal("player_joined"),
      v.literal("player_left"),
      v.literal("session_cancelled"),
      v.literal("session_confirmed"),
    ),
    title: v.string(),
    body: v.string(),
    data: v.optional(
      v.object({
        url: v.optional(v.string()),
        sessionId: v.optional(v.id("sessions")),
        tag: v.optional(v.string()),
        requireInteraction: v.optional(v.boolean()),
        actions: v.optional(
          v.array(
            v.object({
              action: v.string(),
              title: v.string(),
              icon: v.optional(v.string()),
            }),
          ),
        ),
      }),
    ),
  },
  handler: async (ctx, args) => {
    // Check if user has push subscription
    const user = await ctx.db.get(args.userId);
    if (!user?.pushSubscription) {
      console.log(`User ${args.userId} has no push subscription`);
      return { queued: false, reason: "No push subscription" };
    }

    // Queue the notification
    await ctx.db.insert("notifications", {
      userId: args.userId,
      type: args.type,
      title: args.title,
      body: args.body,
      data: args.data,
      status: "pending",
      createdAt: Date.now(),
      retryCount: 0,
    });

    // Schedule the notification worker
    await ctx.scheduler.runAfter(
      0,
      internal.notifications.worker.processNotifications,
    );

    return { queued: true };
  },
});

// Get pending notifications for a user
export const getPendingNotifications = query({
  args: {
    userId: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    const userId = args.userId || (await getAuthUserId(ctx));
    if (!userId) {
      return [];
    }

    const notifications = await ctx.db
      .query("notifications")
      .withIndex("by_user_status", q =>
        q.eq("userId", userId).eq("status", "pending"),
      )
      .collect();

    return notifications;
  },
});

// Send a test notification to the current user
export const sendTestNotification = mutation({
  handler: async ctx => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    // Check if user has admin role
    const user = await ctx.db.get(userId);
    if (!user || user.role !== "Admin") {
      throw new Error("Not authorized");
    }

    // Queue a test notification directly
    await ctx.db.insert("notifications", {
      userId,
      type: "session_update",
      title: "Test Notification",
      body: "This is a test notification from BG Matchmaker admin panel",
      data: {
        tag: "test-notification",
        requireInteraction: true,
      },
      status: "pending",
      createdAt: Date.now(),
      retryCount: 0,
    });

    // Schedule the notification worker
    await ctx.scheduler.runAfter(
      0,
      internal.notifications.worker.processNotifications,
    );

    return { queued: true };
  },
});
