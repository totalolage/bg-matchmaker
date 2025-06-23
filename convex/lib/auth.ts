import { getAuthUserId } from "@convex-dev/auth/server";

import { ConvexError } from "convex/values";

import { MutationCtx, QueryCtx } from "../_generated/server";

export async function requireAuth(ctx: QueryCtx | MutationCtx) {
  const userId = await getAuthUserId(ctx);
  if (!userId) {
    throw new ConvexError("Not authenticated");
  }
  return userId;
}

export async function requireAdmin(ctx: QueryCtx | MutationCtx) {
  const userId = await requireAuth(ctx);

  const user = await ctx.db.get(userId);
  if (!user) {
    throw new ConvexError("User not found");
  }

  if (user.role !== "Admin") {
    throw new ConvexError("Admin access required");
  }

  return userId;
}

export async function isAdmin(ctx: QueryCtx | MutationCtx) {
  const userId = await getAuthUserId(ctx);
  if (!userId) {
    return false;
  }

  const user = await ctx.db.get(userId);
  if (!user) {
    return false;
  }

  return user.role === "Admin";
}
