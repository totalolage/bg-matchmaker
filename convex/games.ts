import { v } from "convex/values";

import { api, internal } from "./_generated/api";
import { Id } from "./_generated/dataModel";
import {
  action,
  internalAction,
  internalMutation,
  internalQuery,
  mutation,
  query,
} from "./_generated/server";
import { BGGDataSource } from "./lib/bgg_data_source";
import { BGG_SEEDING } from "./lib/constants";

type GameSearchResult = {
  bggId: string;
  name: string;
  image: string;
  minPlayers: number;
  maxPlayers: number;
  playingTime: number;
  complexity: number;
};

// Local-only search - no BGG API calls
export const searchGames = query({
  args: {
    query: v.string(),
  },
  handler: async (ctx, args): Promise<GameSearchResult[]> => {
    if (!args.query || args.query.trim().length < 2) {
      return [];
    }

    // Use Convex full-text search on our cached games
    const results = await ctx.db
      .query("gameData")
      .withSearchIndex("search_name", (q) => q.search("name", args.query))
      .take(20);

    return results.map((game) => ({
      bggId: game.bggId,
      name: game.name,
      image: game.image || "",
      minPlayers: game.minPlayers || 1,
      maxPlayers: game.maxPlayers || 1,
      playingTime: game.playingTime || 0,
      complexity: game.complexity || 0,
    }));
  },
});

export const getPopularGames = query({
  args: {},
  handler: async (ctx) => {
    // Return cached popular games
    const games = await ctx.db.query("gameData").take(20);

    if (games.length === 0) {
      // Return some default popular games if none in DB
      return [
        {
          bggId: "174430",
          name: "Gloomhaven",
          image:
            "https://cf.geekdo-images.com/sZYp_3BTDGjh2unaZfZmuA__original/img/FnNTJz-qqhHNKKEtqUkOJbpjqAY=/0x0/filters:format(jpeg)/pic2437871.jpg",
          minPlayers: 1,
          maxPlayers: 4,
          playingTime: 120,
          complexity: 3.9,
        },
        {
          bggId: "167791",
          name: "Terraforming Mars",
          image:
            "https://cf.geekdo-images.com/wg9oOLcsKvDesSUdZQ4rxw__original/img/BTkQqJqC_LjOkEAwrJJtOciocio=/0x0/filters:format(jpeg)/pic3536616.jpg",
          minPlayers: 1,
          maxPlayers: 5,
          playingTime: 120,
          complexity: 3.2,
        },
      ];
    }

    return games;
  },
});

export const addGameToDatabase = mutation({
  args: {
    bggId: v.string(),
    name: v.string(),
    image: v.optional(v.string()),
    minPlayers: v.optional(v.number()),
    maxPlayers: v.optional(v.number()),
    playingTime: v.optional(v.number()),
    complexity: v.optional(v.number()),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("gameData")
      .withIndex("by_bgg_id", (q) => q.eq("bggId", args.bggId))
      .unique();

    if (existing) {
      return existing._id;
    }

    return await ctx.db.insert("gameData", {
      ...args,
      lastUpdated: Date.now(),
    });
  },
});

// Internal query to search cached games
export const searchCachedGames = internalQuery({
  args: {
    query: v.string(),
  },
  handler: async (ctx, args): Promise<GameSearchResult[]> => {
    const games = await ctx.db.query("gameData").collect();

    return games
      .filter((game) =>
        game.name.toLowerCase().includes(args.query.toLowerCase()),
      )
      .map((game) => ({
        bggId: game.bggId,
        name: game.name,
        image: game.image || "",
        minPlayers: game.minPlayers || 1,
        maxPlayers: game.maxPlayers || 1,
        playingTime: game.playingTime || 0,
        complexity: game.complexity || 0,
      }));
  },
});

// Internal mutation to cache a game
export const cacheGame = internalMutation({
  args: {
    bggId: v.string(),
    name: v.string(),
    image: v.optional(v.string()),
    thumbnail: v.optional(v.string()),
    minPlayers: v.optional(v.number()),
    maxPlayers: v.optional(v.number()),
    playingTime: v.optional(v.number()),
    complexity: v.optional(v.number()),
    description: v.optional(v.string()),
    yearPublished: v.optional(v.number()),
    popularity: v.optional(v.number()),
    averageRating: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("gameData")
      .withIndex("by_bgg_id", (q) => q.eq("bggId", args.bggId))
      .unique();

    const gameData = {
      ...args,
      lastUpdated: Date.now(),
    };

    if (existing) {
      // Update existing game data
      await ctx.db.patch(existing._id, gameData);
      return existing._id;
    }

    return await ctx.db.insert("gameData", gameData);
  },
});

// Internal mutation to cache multiple games at once
export const cacheGames = internalMutation({
  args: {
    games: v.array(
      v.object({
        bggId: v.string(),
        name: v.string(),
        image: v.optional(v.string()),
        thumbnail: v.optional(v.string()),
        minPlayers: v.optional(v.number()),
        maxPlayers: v.optional(v.number()),
        playingTime: v.optional(v.number()),
        complexity: v.optional(v.number()),
        description: v.optional(v.string()),
        yearPublished: v.optional(v.number()),
        popularity: v.optional(v.number()),
        averageRating: v.optional(v.number()),
      }),
    ),
  },
  handler: async (ctx, args) => {
    const results: Array<{
      bggId: string;
      id?: Id<"gameData">;
      isNew: boolean;
      error?: string;
    }> = [];
    const now = Date.now();

    // Process each game individually to handle errors gracefully
    for (const game of args.games) {
      try {
        const existing = await ctx.db
          .query("gameData")
          .withIndex("by_bgg_id", (q) => q.eq("bggId", game.bggId))
          .unique();

        const gameData = {
          ...game,
          lastUpdated: now,
        };

        if (existing) {
          // Update existing game data
          await ctx.db.patch(existing._id, gameData);
          results.push({ bggId: game.bggId, id: existing._id, isNew: false });
        } else {
          // Insert new game
          const id = await ctx.db.insert("gameData", gameData);
          results.push({ bggId: game.bggId, id, isNew: true });
        }
      } catch (error) {
        // Log the error but continue processing other games
        console.error(
          `[cacheGames] Failed to cache game ${game.bggId}:`,
          error,
        );
        results.push({
          bggId: game.bggId,
          isNew: false,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    return results;
  },
});

// Import a specific game by BGG ID
export const importGameByBggId = action({
  args: {
    bggId: v.string(),
  },
  handler: async (ctx, args) => {
    try {
      const details = await BGGDataSource.getGameDetails(ctx, args.bggId);

      await ctx.runMutation(internal.games.cacheGame, {
        bggId: details.id,
        name: details.name,
        image: details.image,
        minPlayers: details.minPlayers,
        maxPlayers: details.maxPlayers,
        playingTime: details.playingTime,
        complexity: details.averageWeight,
        description: details.description,
        yearPublished: details.yearPublished,
      });

      return {
        success: true,
        game: {
          bggId: details.id,
          name: details.name,
          image: details.image || "",
          minPlayers: details.minPlayers,
          maxPlayers: details.maxPlayers,
          playingTime: details.playingTime,
          complexity: details.averageWeight || 0,
        },
      };
    } catch (error) {
      console.error(`Failed to import game ${args.bggId}:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  },
});

// Stale-while-revalidate: Get game and update if stale
export const getGameWithRefresh = query({
  args: {
    bggId: v.string(),
  },
  handler: async (ctx, args) => {
    const game = await ctx.db
      .query("gameData")
      .withIndex("by_bgg_id", (q) => q.eq("bggId", args.bggId))
      .unique();

    if (!game) {
      return null;
    }

    // Check if data is stale (older than 7 days)
    const isStale = Date.now() - game.lastUpdated > 7 * 24 * 60 * 60 * 1000;

    // Return the game immediately
    const result = {
      ...game,
      isStale,
    };

    // If stale, we could trigger background refresh here
    // For now, just return with isStale flag so client knows

    return result;
  },
});

// Internal action to refresh game data in background
export const refreshGameInBackground = internalAction({
  args: {
    bggId: v.string(),
  },
  handler: async (ctx, args) => {
    try {
      const details = await BGGDataSource.getGameDetails(ctx, args.bggId);

      await ctx.runMutation(internal.games.cacheGame, {
        bggId: details.id,
        name: details.name,
        image: details.image,
        minPlayers: details.minPlayers,
        maxPlayers: details.maxPlayers,
        playingTime: details.playingTime,
        complexity: details.averageWeight,
        description: details.description,
        yearPublished: details.yearPublished,
      });

      console.log(`Successfully refreshed game ${args.bggId}`);
    } catch (error) {
      console.error(`Failed to refresh game ${args.bggId}:`, error);
    }
  },
});

// Clear all games from the database
export const clearAllGames = mutation({
  args: {},
  handler: async (ctx) => {
    const games = await ctx.db.query("gameData").collect();
    for (const game of games) {
      await ctx.db.delete(game._id);
    }
    return { deleted: games.length };
  },
});

// Internal mutations for job progress
export const getSeedingProgress = internalQuery({
  args: {
    name: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("jobs")
      .withIndex("by_name", (q) => q.eq("name", args.name))
      .unique();
  },
});

export const upsertSeedingProgress = internalMutation({
  args: {
    name: v.string(),
    lastProcessedId: v.number(),
    totalProcessed: v.number(),
    totalSuccess: v.number(),
    totalSkipped: v.number(),
    totalErrors: v.number(),
    status: v.union(
      v.literal("in_progress"),
      v.literal("stopping"),
      v.literal("stopped"),
      v.literal("completed"),
      v.literal("failed"),
    ),
    error: v.optional(v.string()),
    scheduledFunctionId: v.optional(v.id("_scheduled_functions")),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("jobs")
      .withIndex("by_name", (q) => q.eq("name", args.name))
      .unique();

    const now = Date.now();

    const jobData = {
      name: args.name,
      type: "seeding",
      status: args.status,
      progress: {
        current: args.lastProcessedId,
      },
      metadata: {
        totalProcessed: args.totalProcessed,
        totalSuccess: args.totalSuccess,
        totalSkipped: args.totalSkipped,
        totalErrors: args.totalErrors,
      },
      error: args.error,
      scheduledFunctionId: args.scheduledFunctionId,
      lastUpdatedAt: now,
    };

    if (existing) {
      await ctx.db.patch(existing._id, {
        ...jobData,
        completedAt: args.status === "completed" ? now : existing.completedAt,
      });
    } else {
      await ctx.db.insert("jobs", {
        ...jobData,
        startedAt: now,
        completedAt: args.status === "completed" ? now : undefined,
      });
    }
  },
});

// Seed database by iterating through BGG IDs
export const seedDatabase = action({
  args: {
    actor: v.union(v.literal("user"), v.literal("scheduler")),
    isRetry: v.optional(v.boolean()),
  },
  handler: async (
    ctx,
    args,
  ): Promise<{
    processed: number;
    success: number;
    skipped: number;
    errors: number;
    lastProcessedId: number;
    status: string;
    scheduledNextRun: boolean;
  }> => {
    const seedName = BGG_SEEDING.SEED_NAME;
    const startTime = Date.now();

    console.log(
      "[Seed] seedDatabase called, actor:",
      args.actor,
      "isRetry:",
      args.isRetry,
    );

    // Use configured max duration or default
    const maxDuration = BGG_SEEDING.MAX_DURATION_MS;

    // Check if there's an existing seeding job
    const existingJob = await ctx.runQuery(internal.games.getSeedingProgress, {
      name: seedName,
    });

    console.log("[Seed] Current job status:", existingJob?.status);

    // Check if job is stopping or stopped (scheduled runs should not proceed)
    if (
      existingJob?.status === "stopping" ||
      (existingJob?.status === "stopped" && args.actor === "scheduler")
    ) {
      console.log("[Seed] Job is", existingJob.status, "- not proceeding");

      // If stopping and this is a scheduled run, transition to stopped
      if (existingJob.status === "stopping" && args.actor === "scheduler") {
        await ctx.runMutation(internal.games.upsertSeedingProgress, {
          name: seedName,
          lastProcessedId: existingJob.progress.current,
          totalProcessed:
            (existingJob.metadata as GameSeedJobMetadata)?.totalProcessed || 0,
          totalSuccess:
            (existingJob.metadata as GameSeedJobMetadata)?.totalSuccess || 0,
          totalSkipped:
            (existingJob.metadata as GameSeedJobMetadata)?.totalSkipped || 0,
          totalErrors:
            (existingJob.metadata as GameSeedJobMetadata)?.totalErrors || 0,
          status: "stopped",
        });
      }

      return {
        processed: 0,
        success: 0,
        skipped: 0,
        errors: 0,
        lastProcessedId: existingJob?.progress.current || 0,
        status:
          existingJob.status === "stopping" ? "stopped" : existingJob.status,
        scheduledNextRun: false,
      };
    }

    // Extract metadata if it exists
    const existingMetadata = existingJob?.metadata as
      | {
          totalProcessed: number;
          totalSuccess: number;
          totalSkipped: number;
          totalErrors: number;
        }
      | undefined;

    // Check if seeding failed (but allow retry if explicitly requested)
    if (existingJob?.status === "failed" && !args.isRetry) {
      console.log(`[Seed] Seeding is ${existingJob.status}, not continuing`);
      return {
        processed: existingMetadata?.totalProcessed || 0,
        success: existingMetadata?.totalSuccess || 0,
        skipped: existingMetadata?.totalSkipped || 0,
        errors: existingMetadata?.totalErrors || 0,
        lastProcessedId: existingJob.progress.current,
        status: existingJob.status,
        scheduledNextRun: false,
      };
    }

    // If this is a retry, log it
    if (args.isRetry && existingJob?.status === "failed") {
      console.log(
        `[Seed] Retrying failed seeding from ID ${existingJob.progress.current + 1}`,
      );
    }

    // Process configuration
    let startId = 1;
    const batchSize = BGG_SEEDING.API_BATCH_SIZE; // Always use API batch size

    // Resume from tracking table if available
    if (existingJob) {
      if (existingJob.status === "completed") {
        console.log(
          `[Seed] Seeding already completed. Last processed ID: ${existingJob.progress.current}`,
        );
        return {
          processed: existingMetadata?.totalProcessed || 0,
          success: existingMetadata?.totalSuccess || 0,
          skipped: existingMetadata?.totalSkipped || 0,
          errors: existingMetadata?.totalErrors || 0,
          lastProcessedId: existingJob.progress.current,
          status: "already_completed",
          scheduledNextRun: false,
        };
      }

      startId = existingJob.progress.current + 1;
      console.log(
        `[Seed] Resuming from tracking table. Starting from ID ${startId} ` +
          `(previous run: ${existingMetadata?.totalProcessed || 0} processed, ${existingMetadata?.totalSuccess || 0} success)`,
      );
    } else {
      // Fallback to checking highest ID if no tracking exists
      const highestId = await ctx.runQuery(internal.games.getHighestBggId);
      if (highestId !== null) {
        startId = highestId + 1;
        console.log(
          `[Seed] Auto-resuming from ID ${startId} (highest existing ID: ${highestId})`,
        );
      }
    }

    console.log(`[Seed] Starting database seed from ID ${startId}...`);
    console.log(`[Seed] Batch size: ${batchSize}`);

    // Initialize or carry over totals from previous run
    let totalProcessed = existingMetadata?.totalProcessed || 0;
    let totalSuccess = existingMetadata?.totalSuccess || 0;
    let totalSkipped = existingMetadata?.totalSkipped || 0;
    let totalErrors = existingMetadata?.totalErrors || 0;
    let consecutiveNotFound = 0;
    let lastProcessedId = startId - 1;
    let shouldScheduleNextRun = false;

    // Save initial progress
    await ctx.runMutation(internal.games.upsertSeedingProgress, {
      name: seedName,
      lastProcessedId,
      totalProcessed,
      totalSuccess,
      totalSkipped,
      totalErrors,
      status: "in_progress",
    });

    try {
      for (let batchStart = startId; ; batchStart += batchSize) {
        // Check if we're approaching the time limit
        const elapsedTime = Date.now() - startTime;
        if (elapsedTime >= maxDuration) {
          console.log(
            `[Seed] Approaching time limit (${elapsedTime}ms elapsed). ` +
              `Scheduling next run to continue from ID ${lastProcessedId + 1}`,
          );
          shouldScheduleNextRun = true;
          break;
        }

        const batchEnd = batchStart + batchSize - 1;
        const batchIds = Array.from(
          { length: batchSize },
          (_, i) => i + batchStart,
        ).map((id) => id.toString());

        console.log(
          `[Seed] Processing batch ${batchStart}-${batchEnd} (${batchIds.length} IDs)...`,
        );

        // Check which games already exist if skipExisting is true
        const existingIds = new Set<string>(
          await ctx.runQuery(internal.games.checkGamesExist, {
            bggIds: batchIds,
          }),
        );
        if (existingIds.size > 0) {
          console.log(
            `[Seed] Skipping ${existingIds.size} existing games in batch`,
          );
        }

        // Filter out existing IDs
        const idsToFetch = batchIds.filter((id) => !existingIds.has(id));
        totalSkipped += existingIds.size;

        if (idsToFetch.length === 0) {
          console.log(`[Seed] All games in batch already exist, skipping...`);
          continue;
        }

        // Check if we were stopped before fetching
        const beforeFetchJob = await ctx.runQuery(
          internal.games.getSeedingProgress,
          {
            name: seedName,
          },
        );
        if (
          beforeFetchJob?.status === "stopping" ||
          beforeFetchJob?.status === "stopped"
        ) {
          console.log(
            "[Seed] Job is",
            beforeFetchJob.status,
            ", exiting batch processing",
          );
          lastProcessedId = batchStart - 1; // Don't count this batch as processed
          shouldScheduleNextRun = false;
          break;
        }

        // Fetch game details for the batch
        try {
          const batchStartTime = Date.now();
          const gameDetails = await BGGDataSource.getMultipleGameDetails(
            ctx,
            idsToFetch,
          );
          const batchDuration = Date.now() - batchStartTime;

          console.log(
            `[Seed] Fetched ${gameDetails.length} games in ${batchDuration}ms`,
          );

          // Reset consecutive not found counter if we found any games
          if (gameDetails.length > 0) {
            consecutiveNotFound = 0;
          } else {
            consecutiveNotFound += idsToFetch.length;
          }

          // Cache the games in a single batch
          if (gameDetails.length > 0) {
            try {
              const gamesToCache = gameDetails.map((details) => ({
                bggId: details.id,
                name: details.name,
                image: details.image,
                minPlayers: details.minPlayers,
                maxPlayers: details.maxPlayers,
                playingTime: details.playingTime,
                complexity: details.averageWeight,
                description: details.description,
                yearPublished: details.yearPublished,
              }));

              const results = await ctx.runMutation(internal.games.cacheGames, {
                games: gamesToCache,
              });

              // Count successes and errors based on the results
              const successful = results.filter((r) => !r.error);
              const failed = results.filter((r) => r.error);

              totalSuccess += successful.length;
              totalErrors += failed.length;

              console.log(
                `[Seed] Cached ${successful.length} games (${successful.filter((r) => r.isNew).length} new, ${successful.filter((r) => !r.isNew).length} updated)`,
              );

              if (failed.length > 0) {
                console.log(
                  `[Seed] Failed to cache ${failed.length} games due to validation/mutation errors`,
                );
              }
            } catch (error) {
              console.error(
                `[Seed] Failed to cache batch of ${gameDetails.length} games:`,
                error,
              );
              totalErrors += gameDetails.length;
            }
          }

          totalProcessed += idsToFetch.length;
          lastProcessedId = batchEnd;

          // Check status again before updating progress
          const afterBatchJob = await ctx.runQuery(
            internal.games.getSeedingProgress,
            {
              name: seedName,
            },
          );
          if (
            afterBatchJob?.status === "stopping" ||
            afterBatchJob?.status === "stopped"
          ) {
            console.log(
              "[Seed] Job is",
              afterBatchJob.status,
              " after batch processing, not updating progress",
            );
            shouldScheduleNextRun = false;
            break;
          }

          // Update progress in database after API call completes
          await ctx.runMutation(internal.games.upsertSeedingProgress, {
            name: seedName,
            lastProcessedId,
            totalProcessed,
            totalSuccess,
            totalSkipped,
            totalErrors,
            status: "in_progress",
          });

          // Log progress every 10 batches
          if ((batchStart - startId) % (batchSize * 10) === 0) {
            console.log(
              `[Seed] Progress: Processed ${totalProcessed} IDs, ` +
                `Success: ${totalSuccess}, Skipped: ${totalSkipped}, Errors: ${totalErrors}`,
            );
          }

          // Check if we should stop due to too many consecutive not found
          if (consecutiveNotFound >= BGG_SEEDING.MAX_CONSECUTIVE_NOT_FOUND) {
            console.log(
              `[Seed] Stopping: ${consecutiveNotFound} consecutive IDs not found. ` +
                `Likely reached end of BGG database.`,
            );
            lastProcessedId = batchEnd;
            break;
          }
        } catch (error) {
          console.error(
            `[Seed] Failed to process batch ${batchStart}-${batchEnd}:`,
            error,
          );
          // Count all games in this batch as errors since we couldn't even fetch them
          totalErrors += idsToFetch.length;
          // Still mark them as processed to avoid getting stuck
          totalProcessed += idsToFetch.length;
          lastProcessedId = batchEnd;
        }
      }

      // Mark as completed if we've reached the end
      const isCompleted =
        consecutiveNotFound >= BGG_SEEDING.MAX_CONSECUTIVE_NOT_FOUND;

      // Re-check job status before scheduling to handle race conditions
      const currentJob = await ctx.runQuery(internal.games.getSeedingProgress, {
        name: seedName,
      });

      // Determine if we need to schedule another run
      let scheduledFunctionId: Id<"_scheduled_functions"> | undefined =
        undefined;
      if (
        !isCompleted &&
        shouldScheduleNextRun &&
        currentJob?.status !== "stopping" &&
        currentJob?.status !== "stopped"
      ) {
        // Cancel any existing scheduled function first
        if (existingJob?.scheduledFunctionId) {
          try {
            await ctx.scheduler.cancel(existingJob.scheduledFunctionId);
            console.log("[Seed] Cancelled previous scheduled function");
          } catch {
            // Ignore if already executed or doesn't exist
          }
        }

        // Schedule the next run
        scheduledFunctionId = await ctx.scheduler.runAfter(
          BGG_SEEDING.SCHEDULE_DELAY_MS,
          api.games.seedDatabase,
          {
            actor: "scheduler",
          },
        );

        console.log(
          `[Seed] Scheduled next run to start from ID ${lastProcessedId + 1} in ${BGG_SEEDING.SCHEDULE_DELAY_MS / 1000 / 60} minutes`,
        );
      } else if (
        currentJob?.status === "stopping" ||
        currentJob?.status === "stopped"
      ) {
        console.log(
          "[Seed] Job is",
          currentJob.status,
          ", not scheduling next run",
        );
      }

      // Update final status
      let finalStatus:
        | "in_progress"
        | "stopping"
        | "stopped"
        | "completed"
        | "failed";
      if (currentJob?.status === "stopping") {
        finalStatus = "stopped";
      } else if (isCompleted) {
        finalStatus = "completed";
      } else if (currentJob?.status === "stopped") {
        finalStatus = "stopped";
      } else {
        finalStatus = "in_progress";
      }

      if (currentJob?.status !== "stopped") {
        await ctx.runMutation(internal.games.upsertSeedingProgress, {
          name: seedName,
          lastProcessedId,
          totalProcessed,
          totalSuccess,
          totalSkipped,
          totalErrors,
          status: finalStatus,
          scheduledFunctionId,
        });
      }

      console.log(
        `[Seed] ${finalStatus === "completed" ? "Completed" : finalStatus === "stopped" ? "Stopped" : shouldScheduleNextRun ? "Paused for next run" : "In Progress"}! ` +
          `Total processed: ${totalProcessed}, Success: ${totalSuccess}, Skipped: ${totalSkipped}, Errors: ${totalErrors}`,
      );

      return {
        processed: totalProcessed,
        success: totalSuccess,
        skipped: totalSkipped,
        errors: totalErrors,
        lastProcessedId,
        status: finalStatus,
        scheduledNextRun:
          shouldScheduleNextRun && finalStatus === "in_progress",
      };
    } catch (error) {
      console.error("[Seed] Fatal error:", error);

      // Save error state
      await ctx.runMutation(internal.games.upsertSeedingProgress, {
        name: seedName,
        lastProcessedId,
        totalProcessed,
        totalSuccess,
        totalSkipped,
        totalErrors,
        status: "failed",
        error: error instanceof Error ? error.message : String(error),
      });

      // Return error state
      return {
        processed: totalProcessed,
        success: totalSuccess,
        skipped: totalSkipped,
        errors: totalErrors,
        lastProcessedId,
        status: "failed",
        scheduledNextRun: false,
      };
    }
  },
});

// Query to check seeding progress
export const getSeedingStatus = query({
  args: {},
  handler: async (ctx) => {
    const job = await ctx.db
      .query("jobs")
      .withIndex("by_name", (q) => q.eq("name", "bgg_seed"))
      .unique();

    if (!job) {
      return {
        status: "not_started",
        message: "Seeding has not been started yet",
      };
    }

    // Extract metadata
    const metadata = job.metadata as GameSeedJobMetadata;

    return {
      status: job.status,
      lastProcessedId: job.progress.current,
      totalProcessed: metadata.totalProcessed,
      totalSuccess: metadata.totalSuccess,
      totalSkipped: metadata.totalSkipped,
      totalErrors: metadata.totalErrors,
      startedAt: new Date(job.startedAt).toISOString(),
      lastUpdatedAt: new Date(job.lastUpdatedAt).toISOString(),
      completedAt: job.completedAt
        ? new Date(job.completedAt).toISOString()
        : null,
      error: job.error,
    };
  },
});

// Internal query to check if a game exists
export const checkGameExists = internalQuery({
  args: {
    bggId: v.string(),
  },
  handler: async (ctx, args) => {
    const game = await ctx.db
      .query("gameData")
      .withIndex("by_bgg_id", (q) => q.eq("bggId", args.bggId))
      .unique();
    return game !== null;
  },
});

// Internal query to check multiple games at once
export const checkGamesExist = internalQuery({
  args: {
    bggIds: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const existingIds: string[] = [];

    // Query each game individually using the index
    // This is more efficient than filtering the entire table
    for (const bggId of args.bggIds) {
      const game = await ctx.db
        .query("gameData")
        .withIndex("by_bgg_id", (q) => q.eq("bggId", bggId))
        .unique();

      if (game) {
        existingIds.push(game.bggId);
      }
    }

    return existingIds;
  },
});

// Internal query to get the highest BGG ID in the database
export const getHighestBggId = internalQuery({
  args: {},
  handler: async (ctx) => {
    // Query games ordered by bggId in descending order and take the first one
    const highestGame = await ctx.db.query("gameData").order("desc").first();

    if (!highestGame) {
      return null;
    }

    const id = parseInt(highestGame.bggId);
    return !isNaN(id) ? id : null;
  },
});

// Test action to verify rate limiting
export const testRateLimiting = action({
  args: {
    numberOfRequests: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const requests = args.numberOfRequests || 5;
    console.log(
      `[Rate Limit Test] Starting test with ${requests} rapid requests...`,
    );
    console.log(
      `[Rate Limit Test] Expected behavior: First request immediate, then 5s between each`,
    );

    const testGameIds = ["174430", "161936", "224517", "167791", "316554"]; // Popular games
    const results: Array<{
      request: number;
      gameId: string;
      gameName?: string;
      error?: string;
      duration: string;
      timestamp: string;
    }> = [];
    const overallStartTime = Date.now();

    for (let i = 0; i < Math.min(requests, testGameIds.length); i++) {
      const gameId = testGameIds[i];
      if (!gameId) continue;

      const requestStartTime = Date.now();
      console.log(`[Rate Limit Test] Request ${i + 1}/${requests} starting...`);

      try {
        const details = await BGGDataSource.getGameDetails(ctx, gameId);
        const duration = Date.now() - requestStartTime;

        results.push({
          request: i + 1,
          gameId: gameId,
          gameName: details.name,
          error: undefined,
          duration: `${duration}ms`,
          timestamp: new Date().toISOString(),
        });

        console.log(
          `[Rate Limit Test] Request ${i + 1} completed in ${duration}ms`,
        );
        console.log(`[Rate Limit Test] Retrieved: ${details.name}`);
      } catch (error) {
        const duration = Date.now() - requestStartTime;
        console.error(
          `[Rate Limit Test] Request ${i + 1} failed after ${duration}ms:`,
          error,
        );

        results.push({
          request: i + 1,
          gameId: gameId,
          gameName: undefined,
          error: error instanceof Error ? error.message : String(error),
          duration: `${duration}ms`,
          timestamp: new Date().toISOString(),
        });
      }
    }

    const totalDuration = Date.now() - overallStartTime;
    console.log(
      `[Rate Limit Test] Test completed in ${totalDuration}ms (${Math.round(totalDuration / 1000)}s)`,
    );
    console.log(
      `[Rate Limit Test] Average time per request: ${Math.round(totalDuration / requests)}ms`,
    );

    return {
      summary: {
        totalRequests: requests,
        totalDuration: `${totalDuration}ms`,
        averagePerRequest: `${Math.round(totalDuration / requests)}ms`,
        expectedMinimumDuration: `${(requests - 1) * 5000}ms`,
      },
      results,
    };
  },
});

export type GameSeedJobMetadata = {
  totalProcessed: number;
  totalSuccess: number;
  totalSkipped: number;
  totalErrors: number;
};
