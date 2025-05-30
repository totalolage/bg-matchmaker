import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

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

    // Get user's swipes to filter out already swiped sessions
    const userSwipes = await ctx.db
      .query("userSwipes")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    const swipedSessionIds = new Set(userSwipes.map(s => s.sessionId));

    // Filter out sessions user has already swiped on or is already part of
    const availableSessions = sessions.filter(session => 
      !swipedSessionIds.has(session._id) &&
      session.hostId !== userId &&
      !session.players.includes(userId) &&
      !session.interestedPlayers.includes(userId)
    );

    // Calculate match scores based on user's game library and availability
    const scoredSessions = availableSessions.map(session => {
      let score = 0;
      
      // Game match score
      const userGame = user.gameLibrary.find(g => g.gameId === session.gameId);
      if (userGame) {
        score += 50; // Base score for having the game
        
        // Expertise level bonus
        const expertiseLevels = ["novice", "beginner", "intermediate", "advanced", "expert"];
        const expertiseIndex = expertiseLevels.indexOf(userGame.expertiseLevel);
        score += expertiseIndex * 10;
      }

      // Time availability score (simplified for now)
      if (session.scheduledTime) {
        const sessionDate = new Date(session.scheduledTime);
        const sessionDateISO = sessionDate.toISOString().split('T')[0];
        const timeStr = sessionDate.toTimeString().slice(0, 5);
        
        const availableSlot = user.availability.find(slot => 
          slot.date === sessionDateISO &&
          slot.startTime <= timeStr &&
          slot.endTime >= timeStr
        );
        
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

    // Record the swipe
    await ctx.db.insert("userSwipes", {
      userId,
      sessionId: args.sessionId,
      action: args.action,
    });

    // If it's a like, add to interested players
    if (args.action === "like") {
      const session = await ctx.db.get(args.sessionId);
      if (session && !session.interestedPlayers.includes(userId)) {
        await ctx.db.patch(args.sessionId, {
          interestedPlayers: [...session.interestedPlayers, userId],
        });

        // Check if we have enough players to establish the session
        const totalInterested = session.interestedPlayers.length + 1; // +1 for current user
        if (totalInterested >= session.minPlayers && session.status === "proposed") {
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
        interestedPlayers: session.interestedPlayers.filter(id => id !== userId),
      });
    }
  },
});

export const getUserSessions = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const sessions = await ctx.db
      .query("sessions")
      .collect();

    return sessions.filter(session => 
      session.hostId === userId || 
      session.players.includes(userId) ||
      session.interestedPlayers.includes(userId)
    );
  },
});
