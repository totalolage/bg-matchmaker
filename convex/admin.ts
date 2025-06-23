import { v } from "convex/values";

import { api, internal } from "./_generated/api";
import { action, internalMutation, mutation, query } from "./_generated/server";
import { requireAdminAction } from "./lib/adminAuth";
import { BGG_SEEDING } from "./lib/constants";
import { GameSeedJobMetadata } from "./games";

// Get admin seeding status with next run time
export const getSeedingAdminStatus = query({
  handler: async ctx => {
    // Get seeding job
    const job = await ctx.db
      .query("jobs")
      .withIndex("by_name", q => q.eq("name", "bgg_seed"))
      .unique();

    // Check if seeding is active (will self-schedule if in progress)
    const isSelfScheduling = job?.status === "in_progress";

    if (!job) {
      return {
        seedingStatus: "not_started",
        message: "Seeding has not been started yet",
        isCronActive: false,
        nextRunTime: null,
      };
    }

    // Extract metadata
    const metadata = job.metadata as GameSeedJobMetadata;

    return {
      seedingStatus: job.status,
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
      isCronActive: isSelfScheduling,
      nextRunTime: isSelfScheduling
        ? new Date(Date.now() + BGG_SEEDING.SCHEDULE_DELAY_MS).toISOString()
        : null,
    };
  },
});

// Start seeding
export const startSeeding = action({
  args: {},
  handler: async (
    ctx
  ): Promise<{
    processed: number;
    success: number;
    skipped: number;
    errors: number;
    lastProcessedId: number;
    status: string;
    scheduledNextRun: boolean;
  }> => {
    await requireAdminAction(ctx);

    // Get current progress
    const progress = await ctx.runQuery(internal.games.getSeedingProgress, {
      name: "bgg_seed",
    });

    // If already completed, reset to start fresh
    if (progress?.status === "completed") {
      await ctx.runMutation(internal.admin.resetSeedingProgress, {
        name: "bgg_seed",
      });
    }

    // Start seeding - it will self-schedule if needed
    const result = await ctx.runAction(api.games.seedDatabase, {
      actor: "user",
    });

    return result;
  },
});

// Stop seeding (keeps progress)
export const stopSeeding = mutation({
  args: {},
  handler: async ctx => {
    const job = await ctx.db
      .query("jobs")
      .withIndex("by_name", q => q.eq("name", "bgg_seed"))
      .unique();

    if (job && job.status === "in_progress") {
      // Cancel any scheduled function
      if (job.scheduledFunctionId) {
        try {
          await ctx.scheduler.cancel(job.scheduledFunctionId);
          console.log("[Stop] Successfully cancelled scheduled function");
        } catch (e) {
          console.log(
            "[Stop] Could not cancel scheduled function (may have already run):",
            e
          );
        }
      }

      // Transition to stopping state - the running function will transition to stopped
      await ctx.db.patch(job._id, {
        status: "stopping",
        lastUpdatedAt: Date.now(),
        scheduledFunctionId: undefined,
      });

      console.log("[Stop] Job status updated to stopping");
      return { status: "stopping" };
    }

    return { status: job?.status || "not_started" };
  },
});

// Resume seeding from where it left off
export const resumeSeeding = action({
  args: {},
  handler: async (
    ctx
  ): Promise<{
    processed: number;
    success: number;
    skipped: number;
    errors: number;
    lastProcessedId: number;
    status: string;
    scheduledNextRun: boolean;
  }> => {
    await requireAdminAction(ctx);

    // Get current progress to check if this is a retry
    const progress = await ctx.runQuery(internal.games.getSeedingProgress, {
      name: "bgg_seed",
    });

    const isRetry = progress?.status === "failed";

    // Update status to in_progress for stopped or failed states
    if (
      progress &&
      (progress.status === "stopped" || progress.status === "failed")
    ) {
      await ctx.runMutation(internal.admin.updateSeedingStatus, {
        name: "bgg_seed",
        status: "in_progress",
      });
    }

    // Resume seeding - it will self-schedule if needed
    const result = await ctx.runAction(api.games.seedDatabase, {
      actor: "user",
      isRetry, // Pass the retry flag
    });

    return result;
  },
});

// Internal mutation to reset seeding job
export const resetSeedingProgress = internalMutation({
  args: {
    name: v.string(),
  },
  handler: async (ctx, args) => {
    const job = await ctx.db
      .query("jobs")
      .withIndex("by_name", q => q.eq("name", args.name))
      .unique();

    if (job) {
      await ctx.db.delete(job._id);
    }
  },
});

// Internal mutation to update job status
export const updateSeedingStatus = internalMutation({
  args: {
    name: v.string(),
    status: v.union(
      v.literal("in_progress"),
      v.literal("stopping"),
      v.literal("stopped"),
      v.literal("completed"),
      v.literal("failed")
    ),
  },
  handler: async (ctx, args) => {
    const job = await ctx.db
      .query("jobs")
      .withIndex("by_name", q => q.eq("name", args.name))
      .unique();

    if (job) {
      await ctx.db.patch(job._id, {
        status: args.status,
        lastUpdatedAt: Date.now(),
      });
    }
  },
});

// Batch upsert games from CSV import
export const batchUpsertGames = mutation({
  args: {
    games: v.array(
      v.object({
        bggId: v.string(),
        name: v.string(),
        yearPublished: v.optional(v.number()),
        rank: v.optional(v.number()),
        bayesAverage: v.optional(v.number()),
        average: v.optional(v.number()),
        usersRated: v.optional(v.number()),
        isExpansion: v.boolean(),
        abstractsRank: v.optional(v.number()),
        cgsRank: v.optional(v.number()),
        childrensGamesRank: v.optional(v.number()),
        familyGamesRank: v.optional(v.number()),
        partyGamesRank: v.optional(v.number()),
        strategyGamesRank: v.optional(v.number()),
        thematicRank: v.optional(v.number()),
        wargamesRank: v.optional(v.number()),
      })
    ),
  },
  handler: async (ctx, args) => {
    const { games } = args;
    let upserted = 0;

    for (const game of games) {
      // Check if game already exists
      const existing = await ctx.db
        .query("gameData")
        .withIndex("by_bgg_id", q => q.eq("bggId", game.bggId))
        .first();

      const gameData = {
        bggId: game.bggId,
        name: game.name,
        searchText: game.name, // CSV imports don't have alternate names
        // Optional fields with defaults or from CSV
        description: "", // Empty for CSV imports
        minPlayers: 2, // Default values
        maxPlayers: 4,
        playingTime: 60,
        yearPublished: game.yearPublished,
        averageRating: game.average,
        complexity: undefined, // Not in CSV
        lastUpdated: Date.now(),
        popularity: game.usersRated, // Use number of ratings as popularity indicator
      };

      if (existing) {
        // Update existing game
        await ctx.db.patch(existing._id, gameData);
      } else {
        // Insert new game
        await ctx.db.insert("gameData", gameData);
      }

      upserted++;
    }

    return { upserted };
  },
});
