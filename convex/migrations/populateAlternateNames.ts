import { v } from "convex/values";

import { internal } from "../_generated/api";
import { Id } from "../_generated/dataModel";
import {
  internalAction,
  internalMutation,
  internalQuery,
} from "../_generated/server";
import { BGGDataSource } from "../lib/bgg_data_source";

// Batch size for processing games
const BATCH_SIZE = 20;

// Internal mutation to update games with alternate names
export const updateGamesWithAlternateNames = internalMutation({
  args: {
    updates: v.array(
      v.object({
        id: v.id("gameData"),
        alternateNames: v.optional(v.array(v.string())),
        searchText: v.string(),
      })
    ),
  },
  handler: async (ctx, args) => {
    let updated = 0;

    for (const update of args.updates) {
      await ctx.db.patch(update.id, {
        alternateNames: update.alternateNames,
        searchText: update.searchText,
      });
      updated++;
    }

    return { updated };
  },
});

// Internal action to populate alternate names for existing games
export const populateAlternateNames = internalAction({
  args: {
    cursor: v.optional(v.string()),
    batchSize: v.optional(v.number()),
  },
  handler: async (
    ctx,
    args
  ): Promise<{
    processed: number;
    updated: number;
    errors: number;
    hasMore: boolean;
    nextCursor?: string;
  }> => {
    const batchSize = args.batchSize ?? BATCH_SIZE;

    // Get games that need updating (no alternateNames field)
    const games: Array<{
      _id: Id<"gameData">;
      bggId: string;
      name: string;
    }> = await ctx.runQuery(
      internal.migrations.populateAlternateNames.getGamesNeedingUpdate,
      {
        cursor: args.cursor,
        limit: batchSize,
      }
    );

    if (games.length === 0) {
      console.log("[Migration] No more games to update");
      return {
        processed: 0,
        updated: 0,
        errors: 0,
        hasMore: false,
      };
    }

    console.log(`[Migration] Processing ${games.length} games...`);

    const updates: Array<{
      id: Id<"gameData">;
      alternateNames: string[] | undefined;
      searchText: string;
    }> = [];
    const errors: Array<{
      gameId: Id<"gameData">;
      error: string;
    }> = [];

    // Fetch alternate names from BGG for each game
    for (const game of games) {
      try {
        console.log(
          `[Migration] Fetching data for ${game.name} (BGG ID: ${game.bggId})`
        );

        // Fetch full details from BGG including alternate names
        const details = await BGGDataSource.getGameDetails(ctx, game.bggId);

        // Generate searchText
        const searchText =
          details.alternateNames && details.alternateNames.length > 0
            ? `${game.name} ${details.alternateNames.join(" ")}`
            : game.name;

        updates.push({
          id: game._id,
          alternateNames: details.alternateNames,
          searchText,
        });

        console.log(
          `[Migration] Found ${details.alternateNames?.length || 0} alternate names for ${game.name}`
        );
      } catch (error) {
        console.error(
          `[Migration] Failed to fetch details for ${game.name}:`,
          error
        );
        errors.push({ gameId: game._id, error: String(error) });

        // Still update searchText even if BGG fetch fails
        updates.push({
          id: game._id,
          alternateNames: undefined,
          searchText: game.name,
        });
      }
    }

    // Update games in database
    const result: { updated: number } = await ctx.runMutation(
      internal.migrations.populateAlternateNames.updateGamesWithAlternateNames,
      { updates }
    );

    const lastGame = games[games.length - 1];

    return {
      processed: games.length,
      updated: result.updated,
      errors: errors.length,
      hasMore: games.length === batchSize,
      nextCursor: lastGame?.bggId,
    };
  },
});

// Query to get games needing update
export const getGamesNeedingUpdate = internalQuery({
  args: {
    cursor: v.optional(v.string()),
    limit: v.number(),
  },
  handler: async (ctx, args) => {
    let query = ctx.db.query("gameData");

    // If cursor provided, start after that BGG ID
    if (args.cursor) {
      query = query.filter(q => q.gt(q.field("bggId"), args.cursor as string));
    }

    // Get games that don't have searchText field
    const games = await query
      .filter(q => q.eq(q.field("searchText"), undefined))
      .order("asc")
      .take(args.limit);

    return games;
  },
});

// Public action to run the migration
export const runMigration = internalAction({
  args: {},
  handler: async (
    ctx
  ): Promise<{
    totalProcessed: number;
    totalUpdated: number;
    totalErrors: number;
  }> => {
    console.log("[Migration] Starting alternate names population...");

    let totalProcessed = 0;
    let totalUpdated = 0;
    let totalErrors = 0;
    let cursor: string | undefined = undefined;
    let hasMore = true;

    while (hasMore) {
      const result: {
        processed: number;
        updated: number;
        errors: number;
        hasMore: boolean;
        nextCursor?: string;
      } = await ctx.runAction(
        internal.migrations.populateAlternateNames.populateAlternateNames,
        { cursor }
      );

      totalProcessed += result.processed;
      totalUpdated += result.updated;
      totalErrors += result.errors;
      hasMore = result.hasMore;
      cursor = result.nextCursor;

      console.log(
        `[Migration] Progress: Processed ${totalProcessed}, Updated ${totalUpdated}, Errors ${totalErrors}`
      );

      // Add a small delay to avoid rate limiting
      if (hasMore) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    console.log("[Migration] Complete!");
    console.log(
      `[Migration] Final stats: Processed ${totalProcessed}, Updated ${totalUpdated}, Errors ${totalErrors}`
    );

    return {
      totalProcessed,
      totalUpdated,
      totalErrors,
    };
  },
});
