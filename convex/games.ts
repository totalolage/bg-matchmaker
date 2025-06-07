import { v } from "convex/values";
import {
  mutation,
  query,
  action,
  internalQuery,
  internalMutation,
  internalAction,
} from "./_generated/server";
import { BGGDataSource } from "./lib/bgg_data_source";
import { internal } from "./_generated/api";

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
    minPlayers: v.optional(v.number()),
    maxPlayers: v.optional(v.number()),
    playingTime: v.optional(v.number()),
    complexity: v.optional(v.number()),
    description: v.optional(v.string()),
    yearPublished: v.optional(v.number()),
    popularity: v.optional(v.number()),
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

// Seed database with BGG's hot and top ranked games
export const seedDatabase = action({
  args: {
    hotGamesLimit: v.optional(v.number()),
    topGamesPages: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const hotGamesLimit = args.hotGamesLimit || 50;
    const topGamesPages = args.topGamesPages || 2; // Top 100 games (50 per page)

    console.log(
      `Starting to seed database with ${hotGamesLimit} hot games and top ${topGamesPages * 50} ranked games...`,
    );

    try {
      const allGameIds = new Set<string>();

      // Get hot games
      console.log("Fetching hot games from BGG...");
      const hotGameIds = await BGGDataSource.getHotGames(ctx, hotGamesLimit);
      hotGameIds.forEach((id) => allGameIds.add(id));

      // Get top ranked games
      console.log("Fetching top ranked games from BGG...");
      for (let page = 1; page <= topGamesPages; page++) {
        const topGames = await BGGDataSource.getTopRankedGames(ctx, page);
        topGames.forEach((game) => allGameIds.add(game.id));
      }

      const uniqueGameIds = Array.from(allGameIds);
      console.log(`Found ${uniqueGameIds.length} unique games to seed`);

      let successCount = 0;
      let errorCount = 0;

      // Fetch games in batches of 20 using bulk endpoint
      console.log(`[Seeding] Starting to fetch ${uniqueGameIds.length} games in batches of 20...`);
      const batchStartTime = Date.now();
      const gameDetails = await BGGDataSource.getMultipleGameDetails(ctx, uniqueGameIds);
      const batchDuration = Date.now() - batchStartTime;
      console.log(`[Seeding] Fetched ${gameDetails.length} games in ${batchDuration}ms (${Math.round(batchDuration/1000)}s)`);

      // Cache all games
      console.log(`[Seeding] Starting to cache games in database...`);
      const cacheStartTime = Date.now();
      
      for (let i = 0; i < gameDetails.length; i++) {
        const details = gameDetails[i];
        try {
          // Determine popularity based on whether it's in hot games
          const isHotGame = hotGameIds.includes(details.id);
          const popularity = isHotGame
            ? 1000 - hotGameIds.indexOf(details.id)
            : 500 - i;

          console.log(`[Seeding] Caching game ${i + 1}/${gameDetails.length}: ${details.name} (BGG ID: ${details.id})`);
          
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
            popularity,
          });

          successCount++;
          
          if ((i + 1) % 10 === 0) {
            console.log(`[Seeding] Progress: ${i + 1}/${gameDetails.length} games cached`);
          }
        } catch (error) {
          console.error(`[Seeding] Failed to cache game ${details.id} (${details.name}):`, error);
          errorCount++;
        }
      }
      
      const cacheDuration = Date.now() - cacheStartTime;
      console.log(`[Seeding] Caching completed in ${cacheDuration}ms (${Math.round(cacheDuration/1000)}s)`);
      console.log(`[Seeding] Success: ${successCount}, Errors: ${errorCount}`);

      console.log(
        `Seeding complete: ${successCount} successful, ${errorCount} failed`,
      );
      return { success: successCount, errors: errorCount };
    } catch (error) {
      console.error("Failed to seed games:", error);
      throw error;
    }
  },
});

// Seed popular games from BGG - now much more efficient!
export const seedPopularGames = action({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 100;
    console.log(`Starting to seed ${limit} popular games...`);

    try {
      // Get hot games from BGG
      const hotGameIds = await BGGDataSource.getHotGames(ctx, limit);

      let successCount = 0;
      let errorCount = 0;

      // Fetch games in batches of 20 using bulk endpoint
      const gameDetails = await BGGDataSource.getMultipleGameDetails(ctx, hotGameIds);

      // Cache all games
      for (let i = 0; i < gameDetails.length; i++) {
        const details = gameDetails[i];
        try {
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
            popularity: limit - i, // Higher popularity for games earlier in hot list
          });

          successCount++;
        } catch (error) {
          console.error(`Failed to cache game ${details.id}:`, error);
          errorCount++;
        }
      }

      console.log(
        `Seeding complete: ${successCount} successful, ${errorCount} failed`,
      );
      return { success: successCount, errors: errorCount };
    } catch (error) {
      console.error("Failed to seed games:", error);
      throw error;
    }
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

// Test action to verify rate limiting
export const testRateLimiting = action({
  args: {
    numberOfRequests: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const requests = args.numberOfRequests || 5;
    console.log(`[Rate Limit Test] Starting test with ${requests} rapid requests...`);
    console.log(`[Rate Limit Test] Expected behavior: First request immediate, then 5s between each`);
    
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
      const requestStartTime = Date.now();
      console.log(`[Rate Limit Test] Request ${i + 1}/${requests} starting...`);
      
      try {
        const details = await BGGDataSource.getGameDetails(ctx, testGameIds[i]);
        const duration = Date.now() - requestStartTime;
        
        results.push({
          request: i + 1,
          gameId: testGameIds[i],
          gameName: details.name,
          duration: `${duration}ms`,
          timestamp: new Date().toISOString(),
        });
        
        console.log(`[Rate Limit Test] Request ${i + 1} completed in ${duration}ms`);
        console.log(`[Rate Limit Test] Retrieved: ${details.name}`);
      } catch (error) {
        const duration = Date.now() - requestStartTime;
        console.error(`[Rate Limit Test] Request ${i + 1} failed after ${duration}ms:`, error);
        
        results.push({
          request: i + 1,
          gameId: testGameIds[i],
          error: error instanceof Error ? error.message : String(error),
          duration: `${duration}ms`,
          timestamp: new Date().toISOString(),
        });
      }
    }
    
    const totalDuration = Date.now() - overallStartTime;
    console.log(`[Rate Limit Test] Test completed in ${totalDuration}ms (${Math.round(totalDuration/1000)}s)`);
    console.log(`[Rate Limit Test] Average time per request: ${Math.round(totalDuration/requests)}ms`);
    
    return {
      summary: {
        totalRequests: requests,
        totalDuration: `${totalDuration}ms`,
        averagePerRequest: `${Math.round(totalDuration/requests)}ms`,
        expectedMinimumDuration: `${(requests - 1) * 5000}ms`,
      },
      results,
    };
  },
});
