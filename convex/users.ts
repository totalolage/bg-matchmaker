import { getAuthUserId } from "@convex-dev/auth/server";

import { v } from "convex/values";

import { mutation, query } from "./_generated/server";

export const getCurrentUser = query({
  args: {},
  handler: async ctx => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    return await ctx.db.get(userId);
  },
});

export const createOrUpdateProfile = mutation({
  args: {
    name: v.string(),
    profilePic: v.optional(v.string()),
    discordId: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_discord_id", q => q.eq("discordId", args.discordId))
      .unique();

    if (existingUser) {
      await ctx.db.patch(existingUser._id, {
        name: args.name,
        profilePic: args.profilePic,
      });
      return existingUser._id;
    } else {
      return await ctx.db.insert("users", {
        name: args.name,
        profilePic: args.profilePic,
        discordId: args.discordId,
        gameLibrary: [],
        availability: [],
        role: "User", // Default role for new users
      });
    }
  },
});

export const updateGameLibrary = mutation({
  args: {
    gameLibrary: v.array(
      v.object({
        gameId: v.string(),
        gameName: v.string(),
        gameImage: v.optional(v.string()),
        expertiseLevel: v.union(
          v.literal("novice"),
          v.literal("beginner"),
          v.literal("intermediate"),
          v.literal("advanced"),
          v.literal("expert")
        ),
      })
    ),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const user = await ctx.db.get(userId);
    if (!user) throw new Error("User not found");

    await ctx.db.patch(userId, {
      gameLibrary: args.gameLibrary,
    });
  },
});

export const updateAvailability = mutation({
  args: {
    availability: v.array(
      v.object({
        date: v.string(),
        intervals: v.array(
          v.object({
            start: v.number(),
            end: v.number(),
            type: v.optional(
              v.union(v.literal("available"), v.literal("committed"))
            ),
            sessionId: v.optional(v.id("sessions")),
          })
        ),
      })
    ),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const user = await ctx.db.get(userId);
    if (!user) throw new Error("User not found");

    await ctx.db.patch(userId, {
      availability: args.availability,
    });
  },
});

export const commitAvailabilitySlot = mutation({
  args: {
    sessionId: v.id("sessions"),
    date: v.string(),
    startTime: v.number(),
    endTime: v.number(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const user = await ctx.db.get(userId);
    if (!user) throw new Error("User not found");

    // Find the availability record for the given date
    const availabilityIndex = user.availability.findIndex(
      a => a.date === args.date
    );

    if (availabilityIndex === -1) {
      throw new Error("No availability found for the specified date");
    }

    const dayAvailability = user.availability[availabilityIndex];
    if (!dayAvailability) {
      throw new Error("Availability data not found");
    }
    const newIntervals: typeof dayAvailability.intervals = [];

    // Process each existing interval
    for (const interval of dayAvailability.intervals) {
      // Skip if already committed
      if (interval.type === "committed") {
        newIntervals.push(interval);
        continue;
      }

      // Check for overlap
      if (interval.end <= args.startTime || interval.start >= args.endTime) {
        // No overlap, keep the interval
        newIntervals.push(interval);
      } else {
        // Handle overlap - split the interval if needed

        // Add the part before the committed slot
        if (interval.start < args.startTime) {
          newIntervals.push({
            start: interval.start,
            end: args.startTime,
            type: "available" as const,
          });
        }

        // Add the committed slot (only once)
        const committedSlotExists = newIntervals.some(
          i =>
            i.type === "committed" &&
            i.sessionId === args.sessionId &&
            i.start === args.startTime &&
            i.end === args.endTime
        );

        if (!committedSlotExists) {
          newIntervals.push({
            start: args.startTime,
            end: args.endTime,
            type: "committed" as const,
            sessionId: args.sessionId,
          });
        }

        // Add the part after the committed slot
        if (interval.end > args.endTime) {
          newIntervals.push({
            start: args.endTime,
            end: interval.end,
            type: "available" as const,
          });
        }
      }
    }

    // Update the availability array
    const updatedAvailability = [...user.availability];
    updatedAvailability[availabilityIndex] = {
      date: args.date,
      intervals: newIntervals.sort((a, b) => a.start - b.start),
    };

    await ctx.db.patch(userId, {
      availability: updatedAvailability,
    });
  },
});

export const restoreAvailabilitySlot = mutation({
  args: {
    sessionId: v.id("sessions"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const user = await ctx.db.get(userId);
    if (!user) throw new Error("User not found");

    // Remove all committed slots for this session
    const updatedAvailability = user.availability.map(dayAvail => {
      const newIntervals: typeof dayAvail.intervals = [];
      let needsMerge = false;

      for (const interval of dayAvail.intervals) {
        if (
          interval.type === "committed" &&
          interval.sessionId === args.sessionId
        ) {
          // Convert back to available
          newIntervals.push({
            start: interval.start,
            end: interval.end,
            type: "available" as const,
          });
          needsMerge = true;
        } else {
          newIntervals.push(interval);
        }
      }

      // Merge adjacent available intervals if we made changes
      if (needsMerge) {
        const mergedIntervals: typeof dayAvail.intervals = [];
        const sortedIntervals = newIntervals.sort((a, b) => a.start - b.start);

        for (let i = 0; i < sortedIntervals.length; i++) {
          const current = sortedIntervals[i];
          const next = sortedIntervals[i + 1];

          if (!current) continue;

          if (
            current.type === "available" &&
            next &&
            next.type === "available" &&
            current.end >= next.start
          ) {
            // Merge intervals
            mergedIntervals.push({
              start: current.start,
              end: Math.max(current.end, next.end),
              type: "available" as const,
            });
            i++; // Skip next interval since we merged it
          } else {
            mergedIntervals.push(current);
          }
        }

        return {
          date: dayAvail.date,
          intervals: mergedIntervals,
        };
      }

      return dayAvail;
    });

    await ctx.db.patch(userId, {
      availability: updatedAvailability,
    });
  },
});

export const updatePushSubscription = mutation({
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
    if (!userId) throw new Error("Not authenticated");

    await ctx.db.patch(userId, {
      pushSubscription: args.subscription,
    });
  },
});

export const updateDisplayName = mutation({
  args: {
    displayName: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // Trim the display name
    const trimmed = args.displayName.trim();

    // If empty, set displayName to undefined (will use username)
    await ctx.db.patch(userId, {
      displayName: trimmed.length > 0 ? trimmed : undefined,
    });
  },
});

export const getUser = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.userId);
  },
});

export const getActiveUsers = query({
  args: {},
  handler: async ctx => {
    // Get all users - in a real app, you might filter by last active date
    const allUsers = await ctx.db.query("users").collect();

    // Filter to only users with game library and availability set
    return allUsers.filter(
      user => user.gameLibrary.length > 0 && user.availability.length > 0
    );
  },
});
