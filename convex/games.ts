import { v } from "convex/values";
import { mutation, query, action } from "./_generated/server";

export const searchGames = action({
  args: {
    query: v.string(),
  },
  handler: async (ctx, args) => {
    // This is a simplified implementation
    // In a real app, you'd integrate with BoardGameGeek API
    const mockGames = [
      {
        bggId: "174430",
        name: "Gloomhaven",
        image: "https://cf.geekdo-images.com/sZYp_3BTDGjh2unaZfZmuA__original/img/FnNTJz-qqhHNKKEtqUkOJbpjqAY=/0x0/filters:format(jpeg)/pic2437871.jpg",
        minPlayers: 1,
        maxPlayers: 4,
        playingTime: 120,
        complexity: 3.9,
      },
      {
        bggId: "167791",
        name: "Terraforming Mars",
        image: "https://cf.geekdo-images.com/wg9oOLcsKvDesSUdZQ4rxw__original/img/BTkQqJqC_LjOkEAwrJJtOciocio=/0x0/filters:format(jpeg)/pic3536616.jpg",
        minPlayers: 1,
        maxPlayers: 5,
        playingTime: 120,
        complexity: 3.2,
      },
      {
        bggId: "224517",
        name: "Brass: Birmingham",
        image: "https://cf.geekdo-images.com/x3zxjr-Vw5iU4cDPbZHdFw__original/img/FpyxH41Y6_ROoePAilPNEhXnzO8=/0x0/filters:format(jpeg)/pic3490053.jpg",
        minPlayers: 2,
        maxPlayers: 4,
        playingTime: 120,
        complexity: 3.9,
      },
      {
        bggId: "161936",
        name: "Pandemic Legacy: Season 1",
        image: "https://cf.geekdo-images.com/S3ybV1LAp-8SnHIXLLjVqA__original/img/oVWlauGsKVZDL6FL_hPlbKd3M_w=/0x0/filters:format(jpeg)/pic2452831.jpg",
        minPlayers: 2,
        maxPlayers: 4,
        playingTime: 60,
        complexity: 2.8,
      },
      {
        bggId: "12333",
        name: "Twilight Struggle",
        image: "https://cf.geekdo-images.com/pNCiRBV8sx_8pNZ3Qa2l9g__original/img/kdXpNKqeOiOiNTSIBBiuEBc8S5c=/0x0/filters:format(jpeg)/pic361592.jpg",
        minPlayers: 2,
        maxPlayers: 2,
        playingTime: 180,
        complexity: 3.6,
      }
    ];

    return mockGames.filter(game => 
      game.name.toLowerCase().includes(args.query.toLowerCase())
    );
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
          image: "https://cf.geekdo-images.com/sZYp_3BTDGjh2unaZfZmuA__original/img/FnNTJz-qqhHNKKEtqUkOJbpjqAY=/0x0/filters:format(jpeg)/pic2437871.jpg",
          minPlayers: 1,
          maxPlayers: 4,
          playingTime: 120,
          complexity: 3.9,
        },
        {
          bggId: "167791",
          name: "Terraforming Mars",
          image: "https://cf.geekdo-images.com/wg9oOLcsKvDesSUdZQ4rxw__original/img/BTkQqJqC_LjOkEAwrJJtOciocio=/0x0/filters:format(jpeg)/pic3536616.jpg",
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
    minPlayers: v.number(),
    maxPlayers: v.number(),
    playingTime: v.number(),
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

    return await ctx.db.insert("gameData", args);
  },
});
