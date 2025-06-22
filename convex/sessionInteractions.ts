import { v } from "convex/values";

import { Id } from "./_generated/dataModel";
import { mutation, query } from "./_generated/server";

export const recordInteraction = mutation({
  args: {
    sessionId: v.id("sessions"),
    interactionType: v.union(
      v.literal("interested"),
      v.literal("declined"),
      v.literal("accepted"),
    ),
    metadata: v.optional(
      v.object({
        swipeDirection: v.optional(v.string()),
        deviceType: v.optional(v.string()),
      }),
    ),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const userId = identity.subject as Id<"users">;

    // Check for existing interaction
    const existing = await ctx.db
      .query("sessionInteractions")
      .withIndex("by_user_session", (q) =>
        q.eq("userId", userId).eq("sessionId", args.sessionId),
      )
      .unique();

    if (existing) {
      // Update existing interaction
      await ctx.db.patch(existing._id, {
        interactionType: args.interactionType,
        metadata: args.metadata,
      });
      return existing._id;
    } else {
      // Create new interaction
      const interactionId = await ctx.db.insert("sessionInteractions", {
        userId,
        sessionId: args.sessionId,
        interactionType: args.interactionType,
        createdAt: Date.now(),
        metadata: args.metadata,
      });
      return interactionId;
    }
  },
});

export const getUserInteractions = query({
  args: {
    userId: v.optional(v.id("users")),
    interactionType: v.optional(
      v.union(
        v.literal("interested"),
        v.literal("declined"),
        v.literal("accepted"),
      ),
    ),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    const userId =
      args.userId || (identity?.subject as Id<"users"> | undefined);

    if (!userId) return [];

    const query = ctx.db
      .query("sessionInteractions")
      .withIndex("by_user", (q) => q.eq("userId", userId));

    const interactions = await query.collect();

    // Filter by interaction type if specified
    if (args.interactionType) {
      return interactions.filter(
        (i) => i.interactionType === args.interactionType,
      );
    }

    return interactions;
  },
});

export const getSessionInteractions = query({
  args: {
    sessionId: v.id("sessions"),
    interactionType: v.optional(
      v.union(
        v.literal("interested"),
        v.literal("declined"),
        v.literal("accepted"),
      ),
    ),
  },
  handler: async (ctx, args) => {
    const query = ctx.db
      .query("sessionInteractions")
      .withIndex("by_session", (q) => q.eq("sessionId", args.sessionId));

    const interactions = await query.collect();

    // Filter by interaction type if specified
    if (args.interactionType) {
      return interactions.filter(
        (i) => i.interactionType === args.interactionType,
      );
    }

    return interactions;
  },
});

export const getUninteractedSessions = query({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const userId = identity.subject as Id<"users">;

    // Get all user interactions
    const userInteractions = await ctx.db
      .query("sessionInteractions")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    const interactedSessionIds = new Set(
      userInteractions.map((i) => i.sessionId),
    );

    // Get all active sessions (not completed or cancelled)
    const activeSessions = await ctx.db
      .query("sessions")
      .withIndex("by_status")
      .filter((q) =>
        q.and(
          q.neq(q.field("status"), "completed"),
          q.neq(q.field("status"), "cancelled"),
        ),
      )
      .collect();

    // Filter out sessions the user has already interacted with
    return activeSessions.filter(
      (session) => !interactedSessionIds.has(session._id),
    );
  },
});

export const hasUserInteracted = query({
  args: {
    sessionId: v.id("sessions"),
    userId: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    const userId =
      args.userId || (identity?.subject as Id<"users"> | undefined);

    if (!userId) return null;

    const interaction = await ctx.db
      .query("sessionInteractions")
      .withIndex("by_user_session", (q) =>
        q.eq("userId", userId).eq("sessionId", args.sessionId),
      )
      .unique();

    return interaction;
  },
});

// Migration function to convert existing userSwipes to sessionInteractions
export const migrateUserSwipes = mutation({
  handler: async (ctx) => {
    const swipes = await ctx.db.query("userSwipes").collect();
    let migrated = 0;

    for (const swipe of swipes) {
      // Check if interaction already exists
      const existing = await ctx.db
        .query("sessionInteractions")
        .withIndex("by_user_session", (q) =>
          q.eq("userId", swipe.userId).eq("sessionId", swipe.sessionId),
        )
        .unique();

      if (!existing) {
        await ctx.db.insert("sessionInteractions", {
          userId: swipe.userId,
          sessionId: swipe.sessionId,
          interactionType: swipe.action === "like" ? "interested" : "declined",
          createdAt: Date.now(),
          metadata: {
            swipeDirection: swipe.action === "like" ? "right" : "left",
          },
        });
        migrated++;
      }
    }

    return { migrated, total: swipes.length };
  },
});
