import { v } from "convex/values";

import { internal } from "../_generated/api";
import { internalMutation } from "../_generated/server";

// Migration to populate searchText for existing games
// This is needed for games that were imported before the searchText field was added
export const populateSearchText = internalMutation({
  args: {
    batchSize: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const batchSize = args.batchSize ?? 100;

    // Get games without searchText
    const games = await ctx.db
      .query("gameData")
      .filter(q => q.eq(q.field("searchText"), undefined))
      .take(batchSize);

    if (games.length === 0) {
      console.log("[Migration] No games need searchText update");
      return { updated: 0, remaining: 0 };
    }

    console.log(`[Migration] Updating searchText for ${games.length} games`);

    let updated = 0;
    for (const game of games) {
      // Generate searchText from name and alternateNames if available
      const searchText =
        game.alternateNames && game.alternateNames.length > 0 ?
          `${game.name} ${game.alternateNames.join(" ")}`
        : game.name;

      await ctx.db.patch(game._id, { searchText });
      updated++;
    }

    // Check how many more need updating
    const remaining = await ctx.db
      .query("gameData")
      .filter(q => q.eq(q.field("searchText"), undefined))
      .collect();

    console.log(
      `[Migration] Updated ${updated} games, ${remaining.length} remaining`,
    );

    return {
      updated,
      remaining: remaining.length,
      needsMoreRuns: remaining.length > 0,
    };
  },
});

// Helper mutation to run the migration until complete
export const runFullMigration = internalMutation({
  args: {},
  handler: async ctx => {
    console.log("[Migration] Starting searchText population...");

    let totalUpdated = 0;
    let needsMore = true;
    let runs = 0;

    while (needsMore && runs < 100) {
      // Safety limit of 100 runs
      const result = await ctx.runMutation(
        internal.migrations.populateSearchText.populateSearchText,
        {
          batchSize: 100,
        },
      );

      totalUpdated += result.updated;
      needsMore = result.needsMoreRuns ?? false;
      runs++;

      if (needsMore) {
        console.log(
          `[Migration] Run ${runs}: Updated ${result.updated}, continuing...`,
        );
      }
    }

    console.log(
      `[Migration] Complete! Total updated: ${totalUpdated} in ${runs} runs`,
    );

    return { totalUpdated, runs };
  },
});
