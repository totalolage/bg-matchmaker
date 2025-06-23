import { getAuthUserId } from "@convex-dev/auth/server";

import { v } from "convex/values";

import { mutation, query } from "./_generated/server";

export const submitFeedback = mutation({
  args: {
    sessionId: v.id("sessions"),
    enjoymentRating: v.number(),
    selfAttended: v.boolean(),
    presentPlayers: v.array(v.id("users")),
    comments: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // Check if feedback already exists
    const existingFeedback = await ctx.db
      .query("sessionFeedback")
      .withIndex("by_user", q => q.eq("userId", userId))
      .filter(q => q.eq(q.field("sessionId"), args.sessionId))
      .unique();

    if (existingFeedback) {
      // Update existing feedback
      await ctx.db.patch(existingFeedback._id, {
        enjoymentRating: args.enjoymentRating,
        selfAttended: args.selfAttended,
        presentPlayers: args.presentPlayers,
        comments: args.comments,
      });
      return existingFeedback._id;
    } else {
      // Create new feedback
      return await ctx.db.insert("sessionFeedback", {
        userId,
        sessionId: args.sessionId,
        enjoymentRating: args.enjoymentRating,
        selfAttended: args.selfAttended,
        presentPlayers: args.presentPlayers,
        comments: args.comments,
      });
    }
  },
});

export const getSessionFeedback = query({
  args: {
    sessionId: v.id("sessions"),
  },
  handler: async (ctx, args) =>
    await ctx.db
      .query("sessionFeedback")
      .withIndex("by_session", q => q.eq("sessionId", args.sessionId))
      .collect(),
});

export const getUserFeedback = query({
  args: {},
  handler: async ctx => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    return await ctx.db
      .query("sessionFeedback")
      .withIndex("by_user", q => q.eq("userId", userId))
      .collect();
  },
});
