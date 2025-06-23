import { getAuthUserId } from "@convex-dev/auth/server";

import { ConvexError } from "convex/values";

import { api } from "../_generated/api";
import { ActionCtx } from "../_generated/server";

export async function requireAdminAction(ctx: ActionCtx) {
  const userId = await getAuthUserId(ctx);
  if (!userId) {
    throw new ConvexError("Not authenticated");
  }

  // Query the user to check their role
  const user = await ctx.runQuery(api.auth.loggedInUser);
  if (!user) {
    throw new ConvexError("User not found");
  }

  if (!user.role || user.role !== "Admin") {
    throw new ConvexError("Admin access required");
  }

  return userId;
}
