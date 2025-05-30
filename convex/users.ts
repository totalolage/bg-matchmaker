import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

export const getCurrentUser = query({
  args: {},
  handler: async (ctx) => {
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
      .withIndex("by_discord_id", (q) => q.eq("discordId", args.discordId))
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
      });
    }
  },
});

export const updateGameLibrary = mutation({
  args: {
    gameLibrary: v.array(v.object({
      gameId: v.string(),
      gameName: v.string(),
      gameImage: v.optional(v.string()),
      expertiseLevel: v.union(
        v.literal("novice"),
        v.literal("beginner"),
        v.literal("intermediate"),
        v.literal("advanced"),
        v.literal("expert")
      )
    })),
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
    availability: v.array(v.object({
      dayOfWeek: v.number(),
      startTime: v.string(),
      endTime: v.string(),
    })),
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
    
    // Validate display name
    const trimmed = args.displayName.trim();
    if (trimmed.length < 1) {
      throw new Error("Display name cannot be empty");
    }
    
    await ctx.db.patch(userId, {
      displayName: trimmed,
    });
  },
});
