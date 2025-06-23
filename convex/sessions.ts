import { getAuthUserId } from "@convex-dev/auth/server";

import { v } from "convex/values";

import { api, internal } from "./_generated/api";
import { Id } from "./_generated/dataModel";
import { action, mutation, query } from "./_generated/server";
import { SessionProposalEngine } from "./lib/SessionProposalEngine";

export const getSession = query({
  args: {
    sessionId: v.id("sessions"),
  },
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.sessionId);
    if (!session) return null;

    return session;
  },
});

export const getSessionWithDetails = query({
  args: {
    sessionId: v.id("sessions"),
  },
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.sessionId);
    if (!session) return null;

    // Get host details
    const host = await ctx.db.get(session.hostId);
    if (!host) throw new Error("Host not found");

    // Get player details
    const players = await Promise.all(
      session.players.map(async playerId => {
        const player = await ctx.db.get(playerId);
        if (!player) return null;
        return {
          _id: player._id,
          name: player.name,
          displayName: player.displayName,
          profilePic: player.profilePic,
        };
      })
    );

    // Get interested player details
    const interestedPlayers = await Promise.all(
      session.interestedPlayers.map(async playerId => {
        const player = await ctx.db.get(playerId);
        if (!player) return null;
        return {
          _id: player._id,
          name: player.name,
          displayName: player.displayName,
          profilePic: player.profilePic,
        };
      })
    );

    // Get interactions for more detailed info
    const interactions = await ctx.db
      .query("sessionInteractions")
      .withIndex("by_session", q => q.eq("sessionId", session._id))
      .collect();

    // Group interactions by type
    const interactionsByType = {
      interested: [] as Array<{
        userId: Id<"users">;
        createdAt: number;
      }>,
      declined: [] as Array<{
        userId: Id<"users">;
        createdAt: number;
      }>,
      accepted: [] as Array<{
        userId: Id<"users">;
        createdAt: number;
      }>,
    };

    interactions.forEach(interaction => {
      if (interaction.interactionType in interactionsByType) {
        interactionsByType[interaction.interactionType].push({
          userId: interaction.userId,
          createdAt: interaction.createdAt,
        });
      }
    });

    return {
      ...session,
      host: {
        _id: host._id,
        name: host.name,
        displayName: host.displayName,
        profilePic: host.profilePic,
      },
      playersDetails: players.filter(Boolean) as Array<{
        _id: Id<"users">;
        name: string;
        displayName?: string;
        profilePic?: string;
      }>,
      interestedPlayersDetails: interestedPlayers.filter(Boolean) as Array<{
        _id: Id<"users">;
        name: string;
        displayName?: string;
        profilePic?: string;
      }>,
      interactions: interactionsByType,
    };
  },
});

export const getDiscoverySessions = query({
  args: {},
  handler: async ctx => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const user = await ctx.db.get(userId);
    if (!user) return [];

    // Get sessions that are proposed or established
    const proposedSessions = await ctx.db
      .query("sessions")
      .withIndex("by_status", q => q.eq("status", "proposed"))
      .collect();

    const establishedSessions = await ctx.db
      .query("sessions")
      .withIndex("by_status", q => q.eq("status", "established"))
      .collect();

    const sessions = [...proposedSessions, ...establishedSessions];

    // Get user's interactions to filter out already interacted sessions
    const userInteractions = await ctx.db
      .query("sessionInteractions")
      .withIndex("by_user", q => q.eq("userId", userId))
      .collect();

    const interactedSessionIds = new Set(
      userInteractions.map(i => i.sessionId)
    );

    // Filter out sessions user has already interacted with or is already part of
    const availableSessions = sessions.filter(
      session =>
        !interactedSessionIds.has(session._id) &&
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

        const availableSlot = user.availability.find(slot => {
          if (slot.date !== sessionDateISO) return false;

          // Check if session time falls within any available (non-committed) interval
          return slot.intervals.some(
            interval =>
              sessionMinutes >= interval.start &&
              sessionMinutes < interval.end &&
              interval.type !== "committed" // Exclude committed slots
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
      .withIndex("by_user_session", q =>
        q.eq("userId", userId).eq("sessionId", args.sessionId)
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
          id => id !== userId
        ),
      });

      // Record this as an "accepted" interaction
      const existing = await ctx.db
        .query("sessionInteractions")
        .withIndex("by_user_session", q =>
          q.eq("userId", userId).eq("sessionId", args.sessionId)
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

      // Commit the availability slot if session has a scheduled time
      if (session.scheduledTime) {
        const sessionDate = new Date(session.scheduledTime);
        const dateStr = sessionDate.toISOString().split("T")[0] as string;
        const startMinutes =
          sessionDate.getHours() * 60 + sessionDate.getMinutes();

        // Assuming sessions are 3 hours by default
        // TODO: Add duration to session schema
        const durationMinutes = 180;
        const endMinutes = Math.min(startMinutes + durationMinutes, 1439); // Cap at end of day

        try {
          await ctx.runMutation(api.users.commitAvailabilitySlot, {
            sessionId: args.sessionId,
            date: dateStr,
            startTime: startMinutes,
            endTime: endMinutes,
          });
        } catch (error) {
          // Log error but don't fail the join operation
          console.error("Failed to commit availability slot:", error);
        }
      }
    }
  },
});

export const getUserSessions = query({
  args: {},
  handler: async ctx => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const sessions = await ctx.db.query("sessions").collect();

    return sessions.filter(
      session =>
        session.hostId === userId ||
        session.players.includes(userId) ||
        session.interestedPlayers.includes(userId)
    );
  },
});

export const updateSession = mutation({
  args: {
    sessionId: v.id("sessions"),
    scheduledTime: v.optional(v.number()),
    location: v.optional(v.string()),
    description: v.optional(v.string()),
    minPlayers: v.optional(v.number()),
    maxPlayers: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const session = await ctx.db.get(args.sessionId);
    if (!session) throw new Error("Session not found");

    // Only the host can update the session
    if (session.hostId !== userId) {
      throw new Error("Only the host can update the session");
    }

    // Cannot update completed or cancelled sessions
    if (session.status === "completed" || session.status === "cancelled") {
      throw new Error("Cannot update a completed or cancelled session");
    }

    // Prepare update object
    const updates: any = {};
    if (args.scheduledTime !== undefined) updates.scheduledTime = args.scheduledTime;
    if (args.location !== undefined) updates.location = args.location;
    if (args.description !== undefined) updates.description = args.description;
    if (args.minPlayers !== undefined) {
      // Validate minPlayers
      if (args.minPlayers < 2) {
        throw new Error("Minimum players must be at least 2");
      }
      if (args.minPlayers > session.maxPlayers) {
        throw new Error("Minimum players cannot exceed maximum players");
      }
      updates.minPlayers = args.minPlayers;
    }
    if (args.maxPlayers !== undefined) {
      // Validate maxPlayers
      if (args.maxPlayers < session.minPlayers) {
        throw new Error("Maximum players cannot be less than minimum players");
      }
      if (args.maxPlayers < session.players.length) {
        throw new Error("Maximum players cannot be less than current player count");
      }
      updates.maxPlayers = args.maxPlayers;
    }

    // Update the session
    await ctx.db.patch(args.sessionId, updates);

    // TODO: In the future, send notifications to interested/accepted players about the update
  },
});

export const cancelSession = mutation({
  args: {
    sessionId: v.id("sessions"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const session = await ctx.db.get(args.sessionId);
    if (!session) throw new Error("Session not found");

    // Only the host can cancel the session
    if (session.hostId !== userId) {
      throw new Error("Only the host can cancel the session");
    }

    // Cannot cancel completed or already cancelled sessions
    if (session.status === "completed" || session.status === "cancelled") {
      throw new Error("Cannot cancel a completed or already cancelled session");
    }

    // Update session status
    await ctx.db.patch(args.sessionId, {
      status: "cancelled",
    });

    // Restore availability for all players who had committed slots
    for (const playerId of session.players) {
      try {
        await ctx.runMutation(api.users.restoreAvailabilitySlot, {
          sessionId: args.sessionId,
        });
      } catch (error) {
        console.error(
          `Failed to restore availability for user ${playerId}:`,
          error
        );
      }
    }

    // TODO: In the future, send notifications to interested/accepted players
  },
});

export const getUserProposals = query({
  args: {},
  handler: async ctx => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    // Get all sessions where user is the host
    const proposals = await ctx.db
      .query("sessions")
      .filter(q => q.eq(q.field("hostId"), userId))
      .collect();

    // Get interaction counts for each proposal
    const proposalsWithStats = await Promise.all(
      proposals.map(async proposal => {
        // Get all interactions for this session
        const interactions = await ctx.db
          .query("sessionInteractions")
          .withIndex("by_session", q => q.eq("sessionId", proposal._id))
          .collect();

        // Count by type
        const interestedCount = interactions.filter(
          i => i.interactionType === "interested"
        ).length;
        const declinedCount = interactions.filter(
          i => i.interactionType === "declined"
        ).length;
        const acceptedCount = interactions.filter(
          i => i.interactionType === "accepted"
        ).length;

        // Get user details for interested/accepted users
        const interestedUsers = await Promise.all(
          interactions
            .filter(
              i =>
                i.interactionType === "interested" ||
                i.interactionType === "accepted"
            )
            .map(async i => {
              const user = await ctx.db.get(i.userId);
              return user
                ? {
                    _id: user._id,
                    name: user.name,
                    profilePic: user.profilePic,
                    interactionType: i.interactionType,
                  }
                : null;
            })
        );

        return {
          ...proposal,
          stats: {
            interestedCount,
            declinedCount,
            acceptedCount,
            totalInteractions: interactions.length,
          },
          interestedUsers: interestedUsers.filter(u => u !== null),
        };
      })
    );

    // Sort by creation date (newest first)
    return proposalsWithStats.sort(
      (a, b) => (b._creationTime || 0) - (a._creationTime || 0)
    );
  },
});

export const getSessionHistory = query({
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

    // Get user's interactions
    let interactions = await ctx.db
      .query("sessionInteractions")
      .withIndex("by_user", q => q.eq("userId", userId))
      .collect();

    // Filter by interaction type if specified
    if (args.interactionType) {
      interactions = interactions.filter(
        i => i.interactionType === args.interactionType
      );
    }

    // Get the sessions for these interactions
    const sessions = await Promise.all(
      interactions.map(async interaction => {
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
      })
    );

    // Filter out null values and sort by interaction date
    return sessions
      .filter(s => s !== null)
      .sort((a, b) => b.interaction.createdAt - a.interaction.createdAt);
  },
});

export const expressInterest = mutation({
  args: {
    sessionId: v.id("sessions"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const session = await ctx.db.get(args.sessionId);
    if (!session) throw new Error("Session not found");

    // Check if user is already a player or has already expressed interest
    if (session.players.includes(userId)) {
      throw new Error("You are already a player in this session");
    }

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
        interactionType: "interested",
      });
    } else {
      // Create new interaction
      await ctx.db.insert("sessionInteractions", {
        userId,
        sessionId: args.sessionId,
        interactionType: "interested",
        createdAt: Date.now(),
      });
    }

    // Add to interested players if not already there
    if (!session.interestedPlayers.includes(userId)) {
      await ctx.db.patch(args.sessionId, {
        interestedPlayers: [...session.interestedPlayers, userId],
      });

      // Check if we have enough players to establish the session
      const totalInterested = session.interestedPlayers.length + 1; // +1 for current user
      if (
        totalInterested >= session.minPlayers - session.players.length &&
        session.status === "proposed"
      ) {
        await ctx.db.patch(args.sessionId, {
          status: "established",
        });
      }
    }
  },
});

export const declineSession = mutation({
  args: {
    sessionId: v.id("sessions"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const session = await ctx.db.get(args.sessionId);
    if (!session) throw new Error("Session not found");

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
        interactionType: "declined",
      });
    } else {
      // Create new interaction
      await ctx.db.insert("sessionInteractions", {
        userId,
        sessionId: args.sessionId,
        interactionType: "declined",
        createdAt: Date.now(),
      });
    }

    // Remove from interested players if present
    if (session.interestedPlayers.includes(userId)) {
      await ctx.db.patch(args.sessionId, {
        interestedPlayers: session.interestedPlayers.filter(
          id => id !== userId
        ),
      });
    }
  },
});

export const generateSessionProposals = action({
  args: {
    userId: v.id("users"),
    limit: v.optional(v.number()),
  },
  handler: async (
    ctx,
    args
  ): Promise<{
    proposalsGenerated: number;
    proposals: Array<{
      gameId: string;
      gameName: string;
      overallScore: number;
      proposedParticipants: Array<Id<"users">>;
    }>;
  }> => {
    const { userId, limit = 10 } = args;

    // Fetch user data
    const user = await ctx.runQuery(api.users.getUser, { userId });
    if (!user) {
      throw new Error("User not found");
    }

    // Fetch user's past interactions
    const userInteractions = await ctx.runQuery(
      internal.sessionInteractions.getInteractionsByUser,
      {
        userId,
      }
    );

    // Fetch all active users (excluding the current user)
    const allUsers = await ctx.runQuery(api.users.getActiveUsers);
    const potentialMatches = allUsers.filter(u => u._id !== userId);

    // For each potential match, gather their interactions
    const matchesWithInteractions = await Promise.all(
      potentialMatches.map(async matchUser => ({
        user: matchUser,
        interactions: await ctx.runQuery(
          internal.sessionInteractions.getInteractionsByUser,
          {
            userId: matchUser._id,
          }
        ),
      }))
    );

    // Initialize the proposal engine
    const engine = new SessionProposalEngine(user, userInteractions);

    // Generate proposals
    const proposals = await engine.generateProposals(
      matchesWithInteractions,
      limit
    );

    // Save proposals to database
    for (const proposal of proposals) {
      await ctx.runMutation(api.sessions.saveSessionProposal, proposal);
    }

    return {
      proposalsGenerated: proposals.length,
      proposals: proposals.map(p => ({
        gameId: p.gameId,
        gameName: p.gameName,
        overallScore: p.overallScore,
        proposedParticipants: p.proposedParticipants,
      })),
    };
  },
});

export const saveSessionProposal = mutation({
  args: {
    proposedToUserId: v.id("users"),
    proposedByAlgorithm: v.boolean(),
    gameId: v.string(),
    gameName: v.string(),
    gameImage: v.optional(v.string()),
    proposedParticipants: v.array(v.id("users")),
    preferenceScore: v.number(),
    timeCompatibilityScore: v.number(),
    successRateScore: v.number(),
    overallScore: v.number(),
    proposedDateTime: v.number(),
    status: v.union(
      v.literal("pending"),
      v.literal("accepted"),
      v.literal("declined"),
      v.literal("expired")
    ),
    reason: v.string(),
    createdAt: v.number(),
    expiresAt: v.optional(v.number()),
    metadata: v.optional(
      v.object({
        commonGames: v.optional(v.array(v.string())),
        overlappingTimeSlots: v.optional(v.number()),
      })
    ),
  },
  handler: async (ctx, args) => {
    // Check for existing pending proposal to avoid duplicates
    const existingProposal = await ctx.db
      .query("sessionProposals")
      .withIndex("by_user_status", q =>
        q.eq("proposedToUserId", args.proposedToUserId).eq("status", "pending")
      )
      .filter(
        q =>
          q.eq(q.field("gameId"), args.gameId) &&
          q.eq(q.field("proposedParticipants"), args.proposedParticipants)
      )
      .first();

    if (existingProposal) {
      // Update existing proposal with new scores
      await ctx.db.patch(existingProposal._id, {
        preferenceScore: args.preferenceScore,
        timeCompatibilityScore: args.timeCompatibilityScore,
        successRateScore: args.successRateScore,
        overallScore: args.overallScore,
        proposedDateTime: args.proposedDateTime,
        reason: args.reason,
        expiresAt: args.expiresAt,
        metadata: args.metadata,
      });
      return existingProposal._id;
    }

    // Create new proposal
    return await ctx.db.insert("sessionProposals", args);
  },
});
