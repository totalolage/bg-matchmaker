import { internalMutation } from "../_generated/server";

export const addUserRoles = internalMutation({
  handler: async (ctx) => {
    const users = await ctx.db.query("users").collect();
    
    let updated = 0;
    for (const user of users) {
      if (!user.role) {
        await ctx.db.patch(user._id, {
          role: "User", // Default all existing users to "User" role
        });
        updated++;
      }
    }
    
    console.log(`Migration complete: Updated ${updated} users with default role`);
    return { updated };
  },
});