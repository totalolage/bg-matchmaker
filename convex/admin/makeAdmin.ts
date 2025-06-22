import { v } from "convex/values";

import { mutation } from "../_generated/server";

// This mutation can be run from the Convex dashboard to make a user an admin
export const makeUserAdmin = mutation({
  args: {
    discordId: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_discord_id", (q) => q.eq("discordId", args.discordId))
      .unique();
    
    if (!user) {
      throw new Error(`User with Discord ID ${args.discordId} not found`);
    }
    
    await ctx.db.patch(user._id, {
      role: "Admin",
    });
    
    return {
      success: true,
      userId: user._id,
      name: user.name,
      previousRole: user.role || "User",
      newRole: "Admin",
    };
  },
});