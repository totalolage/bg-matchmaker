import { getAuthUserId } from "@convex-dev/auth/server";

import { v } from "convex/values";

import { Id } from "./_generated/dataModel";
import { internalQuery, mutation, query } from "./_generated/server";

export const recordInteraction = mutation({
  args: {
    sessionId: v.id("sessions"),
    interactionType: v.union(
      v.literal("interested"),
      v.literal("declined"),
      v.literal("accepted")
    ),
    metadata: v.optional(
      v.object({
        swipeDirection: v.optional(v.string()),
        deviceType: v.optional(v.string()),
      })
    ),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // Check for existing interaction
    const existing = await ctx.db
      .query("sessionInteractions")
      .withIndex("by_user_session", q =>
        q.eq("userId", userId).eq("sessionId", args.sessionId)
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
    interactionType: v.optional(
      v.union(
        v.literal("interested"),
        v.literal("declined"),
        v.literal("accepted")
      )
    ),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const query = ctx.db
      .query("sessionInteractions")
      .withIndex("by_user", q => q.eq("userId", userId));

    const interactions = await query.collect();

    // Filter by interaction type if specified
    if (args.interactionType) {
      return interactions.filter(
        i => i.interactionType === args.interactionType
      );
    }

    return interactions;
  },
});

export const getInteractionsByUser = internalQuery({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("sessionInteractions")
      .withIndex("by_user", q => q.eq("userId", args.userId))
      .collect();
  },
});

export const getUserSessionHistory = query({
  args: {
    filters: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // Get all user interactions
    let interactions = await ctx.db
      .query("sessionInteractions")
      .withIndex("by_user", q => q.eq("userId", userId))
      .order("desc")
      .collect();

    // Filter by interaction types if not "all"
    if (!args.filters.includes("all") && args.filters.length > 0) {
      interactions = interactions.filter(i =>
        args.filters.includes(i.interactionType)
      );
    }

    // Fetch session details for each interaction
    const sessionHistoryPromises = interactions.map(async interaction => {
      const session = await ctx.db.get(interaction.sessionId);
      if (!session) return null;

      // Get host information
      const host = await ctx.db.get(session.hostId);

      // Count interested players
      const interestedCount = await ctx.db
        .query("sessionInteractions")
        .withIndex("by_session", q => q.eq("sessionId", session._id))
        .filter(q => q.eq(q.field("interactionType"), "interested"))
        .collect()
        .then(interactions => interactions.length);

      return {
        interaction,
        session: {
          ...session,
          hostName: host?.displayName || host?.name || "Unknown",
          hostAvatar: host?.profilePic,
          interestedCount,
        },
      };
    });

    const sessionHistory = await Promise.all(sessionHistoryPromises);

    // Filter out null values (deleted sessions)
    return sessionHistory.filter(item => item !== null);
  },
});

export const getSessionInteractions = query({
  args: {
    sessionId: v.id("sessions"),
    interactionType: v.optional(
      v.union(
        v.literal("interested"),
        v.literal("declined"),
        v.literal("accepted")
      )
    ),
  },
  handler: async (ctx, args) => {
    const query = ctx.db
      .query("sessionInteractions")
      .withIndex("by_session", q => q.eq("sessionId", args.sessionId));

    const interactions = await query.collect();

    // Filter by interaction type if specified
    if (args.interactionType) {
      return interactions.filter(
        i => i.interactionType === args.interactionType
      );
    }

    return interactions;
  },
});

export const getUninteractedSessions = query({
  handler: async ctx => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const userId = identity.subject as Id<"users">;

    // Get all user interactions
    const userInteractions = await ctx.db
      .query("sessionInteractions")
      .withIndex("by_user", q => q.eq("userId", userId))
      .collect();

    const interactedSessionIds = new Set(
      userInteractions.map(i => i.sessionId)
    );

    // Get all active sessions (not completed or cancelled)
    const activeSessions = await ctx.db
      .query("sessions")
      .withIndex("by_status")
      .filter(q =>
        q.and(
          q.neq(q.field("status"), "completed"),
          q.neq(q.field("status"), "cancelled")
        )
      )
      .collect();

    // Filter out sessions the user has already interacted with
    return activeSessions.filter(
      session => !interactedSessionIds.has(session._id)
    );
  },
});

export const hasUserInteracted = query({
  args: {
    sessionId: v.id("sessions"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    const interaction = await ctx.db
      .query("sessionInteractions")
      .withIndex("by_user_session", q =>
        q.eq("userId", userId).eq("sessionId", args.sessionId)
      )
      .unique();

    return interaction;
  },
});

// Migration function to convert existing userSwipes to sessionInteractions
export const getUserSessionHistoryPaginated = query({
  args: {
    filters: v.array(v.string()),
    paginationOpts: v.object({
      numItems: v.number(),
      cursor: v.union(v.string(), v.null()),
      id: v.optional(v.number()),
    }),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // Build query - always order by createdAt descending (newest first)
    const query = ctx.db
      .query("sessionInteractions")
      .withIndex("by_user", q => q.eq("userId", userId))
      .order("desc");

    // Get paginated interactions
    const { page, isDone, continueCursor } = await query.paginate(
      args.paginationOpts
    );

    // Filter by interaction types if not "all"
    let filteredInteractions = page;
    if (!args.filters.includes("all") && args.filters.length > 0) {
      filteredInteractions = page.filter(i =>
        args.filters.includes(i.interactionType)
      );
    }

    // Fetch session details for each interaction
    const sessionHistoryPromises = filteredInteractions.map(
      async interaction => {
        const session = await ctx.db.get(interaction.sessionId);
        if (!session) return null;

        // Get host information
        const host = await ctx.db.get(session.hostId);

        // Count interested players
        const interestedCount = await ctx.db
          .query("sessionInteractions")
          .withIndex("by_session", q => q.eq("sessionId", session._id))
          .filter(q => q.eq(q.field("interactionType"), "interested"))
          .collect()
          .then(interactions => interactions.length);

        return {
          interaction,
          session: {
            ...session,
            hostName: host?.displayName || host?.name || "Unknown",
            hostAvatar: host?.profilePic,
            interestedCount,
          },
        };
      }
    );

    const sessionHistory = await Promise.all(sessionHistoryPromises);

    // Filter out null values (deleted sessions)
    const items = sessionHistory.filter(item => item !== null);

    return {
      page: items,
      isDone,
      continueCursor,
    };
  },
});

export const migrateUserSwipes = mutation({
  handler: async ctx => {
    const swipes = await ctx.db.query("userSwipes").collect();
    let migrated = 0;

    for (const swipe of swipes) {
      // Check if interaction already exists
      const existing = await ctx.db
        .query("sessionInteractions")
        .withIndex("by_user_session", q =>
          q.eq("userId", swipe.userId).eq("sessionId", swipe.sessionId)
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
