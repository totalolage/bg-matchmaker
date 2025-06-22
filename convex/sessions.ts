import { getAuthUserId } from "@convex-dev/auth/server";

import { v } from "convex/values";

import { mutation, query } from "./_generated/server";

export const getDiscoverySessions = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const user = await ctx.db.get(userId);
    if (!user) return [];

    // Get sessions that are proposed or established
    const proposedSessions = await ctx.db
      .query("sessions")
      .withIndex("by_status", (q) => q.eq("status", "proposed"))
      .collect();

    const establishedSessions = await ctx.db
      .query("sessions")
      .withIndex("by_status", (q) => q.eq("status", "established"))
      .collect();

    const sessions = [...proposedSessions, ...establishedSessions];

    // Get user's interactions to filter out already interacted sessions
    const userInteractions = await ctx.db
      .query("sessionInteractions")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    const interactedSessionIds = new Set(
      userInteractions.map((i) => i.sessionId),
    );

    // Filter out sessions user has already interacted with or is already part of
    const availableSessions = sessions.filter(
      (session) =>
        !interactedSessionIds.has(session._id) &&
        session.hostId !== userId &&
        !session.players.includes(userId) &&
        !session.interestedPlayers.includes(userId),
    );

    // Calculate match scores based on user's game library and availability
    const scoredSessions = availableSessions.map((session) => {
      let score = 0;

      // Game match score
      const userGame = user.gameLibrary.find(
        (g) => g.gameId === session.gameId,
      );
      if (userGame) {
        score += 50; // Base score for having the game

        // Expertise level bonus
        const expertiseLevels = [
          "novice",
          "beginner",
          "intermediate",
          "advanced",
          "expert",
        ];
        const expertiseIndex = expertiseLevels.indexOf(userGame.expertiseLevel);
        score += expertiseIndex * 10;
      }

      // Time availability score (simplified for now)
      if (session.scheduledTime) {
        const sessionDate = new Date(session.scheduledTime);
        const sessionDateISO = sessionDate.toISOString().split("T")[0];

        // Convert session time to minutes since midnight
        const sessionMinutes =
          sessionDate.getHours() * 60 + sessionDate.getMinutes();

        const availableSlot = user.availability.find((slot) => {
          if (slot.date !== sessionDateISO) return false;

          // Check if session time falls within any interval
          return slot.intervals.some(
            (interval) =>
              sessionMinutes >= interval.start && sessionMinutes < interval.end,
          );
        });

        if (availableSlot) {
          score += 30;
        }
      }

      return { ...session, matchScore: score };
    });

    // Sort by match score descending
    return scoredSessions.sort((a, b) => b.matchScore - a.matchScore);
  },
});

export const createSession = mutation({
  args: {
    gameId: v.string(),
    gameName: v.string(),
    gameImage: v.optional(v.string()),
    minPlayers: v.number(),
    maxPlayers: v.number(),
    scheduledTime: v.optional(v.number()),
    description: v.optional(v.string()),
    location: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    return await ctx.db.insert("sessions", {
      gameId: args.gameId,
      gameName: args.gameName,
      gameImage: args.gameImage,
      hostId: userId,
      players: [userId],
      interestedPlayers: [],
      status: "proposed",
      scheduledTime: args.scheduledTime,
      minPlayers: args.minPlayers,
      maxPlayers: args.maxPlayers,
      description: args.description,
      location: args.location,
    });
  },
});

export const swipeSession = mutation({
  args: {
    sessionId: v.id("sessions"),
    action: v.union(v.literal("like"), v.literal("pass")),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // Record the swipe using both systems for backward compatibility
    await ctx.db.insert("userSwipes", {
      userId,
      sessionId: args.sessionId,
      action: args.action,
    });

    // Also record in the new sessionInteractions system
    const interactionType = args.action === "like" ? "interested" : "declined";

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
        interactionType,
        metadata: {
          swipeDirection: args.action === "like" ? "right" : "left",
        },
      });
    } else {
      // Create new interaction
      await ctx.db.insert("sessionInteractions", {
        userId,
        sessionId: args.sessionId,
        interactionType,
        createdAt: Date.now(),
        metadata: {
          swipeDirection: args.action === "like" ? "right" : "left",
        },
      });
    }

    // If it's a like, add to interested players
    if (args.action === "like") {
      const session = await ctx.db.get(args.sessionId);
      if (session && !session.interestedPlayers.includes(userId)) {
        await ctx.db.patch(args.sessionId, {
          interestedPlayers: [...session.interestedPlayers, userId],
        });

        // Check if we have enough players to establish the session
        const totalInterested = session.interestedPlayers.length + 1; // +1 for current user
        if (
          totalInterested >= session.minPlayers &&
          session.status === "proposed"
        ) {
          await ctx.db.patch(args.sessionId, {
            status: "established",
          });
        }
      }
    }
  },
});

export const joinSession = mutation({
  args: {
    sessionId: v.id("sessions"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const session = await ctx.db.get(args.sessionId);
    if (!session) throw new Error("Session not found");

    if (session.players.length >= session.maxPlayers) {
      throw new Error("Session is full");
    }

    if (!session.players.includes(userId)) {
      await ctx.db.patch(args.sessionId, {
        players: [...session.players, userId],
        interestedPlayers: session.interestedPlayers.filter(
          (id) => id !== userId,
        ),
      });

      // Record this as an "accepted" interaction
      const existing = await ctx.db
        .query("sessionInteractions")
        .withIndex("by_user_session", (q) =>
          q.eq("userId", userId).eq("sessionId", args.sessionId),
        )
        .unique();

      if (existing) {
        await ctx.db.patch(existing._id, {
          interactionType: "accepted",
        });
      } else {
        await ctx.db.insert("sessionInteractions", {
          userId,
          sessionId: args.sessionId,
          interactionType: "accepted",
          createdAt: Date.now(),
        });
      }

      // Check if session should be confirmed (all slots filled)
      if (
        session.players.length + 1 >= session.minPlayers &&
        session.status === "established"
      ) {
        await ctx.db.patch(args.sessionId, {
          status: "confirmed",
        });
      }
    }
  },
});

export const getUserSessions = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const sessions = await ctx.db.query("sessions").collect();

    return sessions.filter(
      (session) =>
        session.hostId === userId ||
        session.players.includes(userId) ||
        session.interestedPlayers.includes(userId),
    );
  },
});

export const getSessionHistory = query({
  args: {
    interactionType: v.optional(
      v.union(
        v.literal("interested"),
        v.literal("declined"),
        v.literal("accepted"),
      ),
    ),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    // Get user's interactions
    let interactions = await ctx.db
      .query("sessionInteractions")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    // Filter by interaction type if specified
    if (args.interactionType) {
      interactions = interactions.filter(
        (i) => i.interactionType === args.interactionType,
      );
    }

    // Get the sessions for these interactions
    const sessions = await Promise.all(
      interactions.map(async (interaction) => {
        const session = await ctx.db.get(interaction.sessionId);
        if (!session) return null;

        return {
          ...session,
          interaction: {
            type: interaction.interactionType,
            createdAt: interaction.createdAt,
            metadata: interaction.metadata,
          },
        };
      }),
    );

    // Filter out null values and sort by interaction date
    return sessions
      .filter((s) => s !== null)
      .sort((a, b) => b.interaction.createdAt - a.interaction.createdAt);
  },
});
