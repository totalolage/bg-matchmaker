import Discord from "@auth/core/providers/discord";
import { convexAuth, getAuthUserId } from "@convex-dev/auth/server";

import { query } from "./_generated/server";
import { MutationCtx } from "./_generated/server";

export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [
    Discord({
      profile(profile) {
        return {
          id: profile.id,
          name: profile.username || profile.global_name,
          email: profile.email,
          image:
            profile.avatar ?
              `https://cdn.discordapp.com/avatars/${profile.id}/${profile.avatar}.png`
            : undefined,
          discordId: profile.id,
        };
      },
    }),
  ],
  callbacks: {
    async createOrUpdateUser(ctx: MutationCtx, args) {
      // Check if user exists
      const existingUser =
        args.existingUserId ? await ctx.db.get(args.existingUserId) : null;

      if (existingUser) {
        // Update existing user
        await ctx.db.patch(existingUser._id, {
          name:
            typeof args.profile.name === "string" ?
              args.profile.name
            : existingUser.name,
          email: args.profile.email,
          profilePic:
            typeof args.profile.image === "string" ?
              args.profile.image
            : existingUser.profilePic,
        });
        return existingUser._id;
      }

      if (typeof args.profile.name !== "string")
        throw new Error("User name must be a string");
      if (typeof args.profile.image !== "string")
        throw new Error("User profilePic must be a string");
      if (typeof args.profile.discordId !== "string")
        throw new Error("User discordId must be a string");

      // Create new user with required fields
      const userId = await ctx.db.insert("users", {
        name: args.profile.name,
        email: args.profile.email,
        emailVerificationTime:
          args.profile.emailVerified ? Date.now() : undefined,
        profilePic: args.profile.image,
        discordId: args.profile.discordId,
        gameLibrary: [],
        availability: [],
        isAnonymous: false,
        role: "User", // Default role for new users
      });
      return userId;
    },
    async afterUserCreatedOrUpdated(ctx: MutationCtx, args) {
      // Get the Discord account information to ensure discordId is set
      const accounts = await ctx.db
        .query("authAccounts")
        .withIndex("userIdAndProvider", q =>
          q.eq("userId", args.userId).eq("provider", "discord"),
        )
        .collect();

      if (accounts.length > 0 && args.profile.discordId) {
        const user = await ctx.db.get(args.userId);
        if (user && !user.discordId) {
          if (typeof args.profile.discordId !== "string")
            throw new Error("User discordId must be a string");

          await ctx.db.patch(args.userId, {
            discordId: args.profile.discordId,
          });
        }
      }
    },
  },
});

export const loggedInUser = query({
  handler: async ctx => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return null;
    }
    const user = await ctx.db.get(userId);
    if (!user) {
      return null;
    }
    return user;
  },
});
