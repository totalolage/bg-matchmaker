import { v } from "convex/values";

import { internalMutation, internalQuery } from "../_generated/server";

// Internal queries and mutations
export const getPendingNotifications = internalQuery({
  handler: async ctx => {
    const notifications = await ctx.db
      .query("notifications")
      .withIndex("by_status", q => q.eq("status", "pending"))
      .take(50); // Process up to 50 at a time

    return notifications;
  },
});

export const getUserSubscription = internalQuery({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => await ctx.db.get(args.userId),
});

export const updateNotificationStatus = internalMutation({
  args: {
    notificationId: v.id("notifications"),
    status: v.union(
      v.literal("pending"),
      v.literal("sent"),
      v.literal("failed"),
      v.literal("cancelled"),
    ),
    error: v.optional(v.string()),
    sentAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.notificationId, {
      status: args.status,
      error: args.error,
      sentAt: args.sentAt,
    });
  },
});

export const updateRetryCount = internalMutation({
  args: {
    notificationId: v.id("notifications"),
    retryCount: v.number(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.notificationId, {
      retryCount: args.retryCount,
    });
  },
});

export const removeUserSubscription = internalMutation({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.userId, {
      pushSubscription: undefined,
    });
  },
});
