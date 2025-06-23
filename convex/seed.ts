import { Id } from "./_generated/dataModel";
import { mutation } from "./_generated/server";

export const seedTestUsers = mutation({
  args: {},
  handler: async ctx => {
    const testUsers = [
      {
        name: "alice_boardgamer",
        displayName: "Alice",
        discordId: "test_user_1",
        email: "alice@test.com",
        profilePic: "https://api.dicebear.com/7.x/avataaars/svg?seed=alice",
        gameLibrary: [
          {
            gameId: "13",
            gameName: "Catan",
            gameImage:
              "https://cf.geekdo-images.com/W3Bsga_uLP9kO91gZ7H8yw__thumb/img/8a9HeqFydO7Ax3sWwPRQ-EKI7Xg=/fit-in/200x150/filters:strip_icc()/pic2419375.jpg",
            expertiseLevel: "intermediate" as const,
          },
          {
            gameId: "167791",
            gameName: "Terraforming Mars",
            gameImage:
              "https://cf.geekdo-images.com/wg9oOLcsKvDesSUdZQ4rxw__thumb/img/BTxqxgYay5tHJfVoJ2NF5g43_gA=/fit-in/200x150/filters:strip_icc()/pic3536616.jpg",
            expertiseLevel: "advanced" as const,
          },
        ],
        availability: [
          {
            date: new Date().toISOString().split("T")[0]!,
            intervals: [{ start: 1080, end: 1320 }], // 6pm-10pm
          },
        ],
      },
      {
        name: "bob_the_strategist",
        displayName: "Bob",
        discordId: "test_user_2",
        email: "bob@test.com",
        profilePic: "https://api.dicebear.com/7.x/avataaars/svg?seed=bob",
        gameLibrary: [
          {
            gameId: "174430",
            gameName: "Gloomhaven",
            gameImage:
              "https://cf.geekdo-images.com/sZYp_3BTDGjh2unaZfZmuA__thumb/img/veqFeP4d_3zNhFc3GNBkV95rBEQ=/fit-in/200x150/filters:strip_icc()/pic2437871.jpg",
            expertiseLevel: "expert" as const,
          },
          {
            gameId: "169786",
            gameName: "Scythe",
            gameImage:
              "https://cf.geekdo-images.com/7k_nOxpO9OGIjhLq2BUZdA__thumb/img/eQ69OEDdjYjfKg6q5Navee87skU=/fit-in/200x150/filters:strip_icc()/pic3163924.jpg",
            expertiseLevel: "intermediate" as const,
          },
        ],
        availability: [
          {
            date: new Date().toISOString().split("T")[0]!,
            intervals: [{ start: 780, end: 960 }], // 1pm-4pm
          },
        ],
      },
      {
        name: "carol_casual",
        displayName: "Carol",
        discordId: "test_user_3",
        email: "carol@test.com",
        profilePic: "https://api.dicebear.com/7.x/avataaars/svg?seed=carol",
        gameLibrary: [
          {
            gameId: "13",
            gameName: "Catan",
            gameImage:
              "https://cf.geekdo-images.com/W3Bsga_uLP9kO91gZ7H8yw__thumb/img/8a9HeqFydO7Ax3sWwPRQ-EKI7Xg=/fit-in/200x150/filters:strip_icc()/pic2419375.jpg",
            expertiseLevel: "beginner" as const,
          },
          {
            gameId: "224517",
            gameName: "Brass: Birmingham",
            gameImage:
              "https://cf.geekdo-images.com/x3zxjr-Vw5iU4yDPg70Jgw__thumb/img/FpyxH41Y6_ROoePAilPNEhXnzO8=/fit-in/200x150/filters:strip_icc()/pic3490053.jpg",
            expertiseLevel: "novice" as const,
          },
        ],
        availability: [
          {
            date: new Date().toISOString().split("T")[0]!,
            intervals: [{ start: 600, end: 840 }], // 10am-2pm
          },
        ],
      },
    ];

    const userIds: Id<"users">[] = [];

    for (const userData of testUsers) {
      const userId = await ctx.db.insert("users", {
        ...userData,
        role: "User" as const,
        isAnonymous: false,
      });
      userIds.push(userId);
    }

    return {
      message: `Created ${userIds.length} test users`,
      userIds,
    };
  },
});

export const seedTestSessions = mutation({
  args: {},
  handler: async ctx => {
    // Get all users to use as hosts and players
    const users = await ctx.db.query("users").collect();

    if (users.length < 2) {
      throw new Error("Need at least 2 users to create test sessions");
    }

    // Test game data
    const testGames = [
      {
        gameId: "13",
        gameName: "Catan",
        gameImage:
          "https://cf.geekdo-images.com/W3Bsga_uLP9kO91gZ7H8yw__thumb/img/8a9HeqFydO7Ax3sWwPRQ-EKI7Xg=/fit-in/200x150/filters:strip_icc()/pic2419375.jpg",
        minPlayers: 3,
        maxPlayers: 4,
        description:
          "Trade, build, and settle the island of Catan in this classic resource management game.",
      },
      {
        gameId: "174430",
        gameName: "Gloomhaven",
        gameImage:
          "https://cf.geekdo-images.com/sZYp_3BTDGjh2unaZfZmuA__thumb/img/veqFeP4d_3zNhFc3GNBkV95rBEQ=/fit-in/200x150/filters:strip_icc()/pic2437871.jpg",
        minPlayers: 2,
        maxPlayers: 4,
        description:
          "Epic tactical combat game with persistent characters and a branching narrative.",
      },
      {
        gameId: "167791",
        gameName: "Terraforming Mars",
        gameImage:
          "https://cf.geekdo-images.com/wg9oOLcsKvDesSUdZQ4rxw__thumb/img/BTxqxgYay5tHJfVoJ2NF5g43_gA=/fit-in/200x150/filters:strip_icc()/pic3536616.jpg",
        minPlayers: 1,
        maxPlayers: 5,
        description:
          "Compete to make Mars habitable through corporate-driven terraforming projects.",
      },
      {
        gameId: "169786",
        gameName: "Scythe",
        gameImage:
          "https://cf.geekdo-images.com/7k_nOxpO9OGIjhLq2BUZdA__thumb/img/eQ69OEDdjYjfKg6q5Navee87skU=/fit-in/200x150/filters:strip_icc()/pic3163924.jpg",
        minPlayers: 1,
        maxPlayers: 5,
        description:
          "Lead your faction to victory in an alternate-history 1920s Europe.",
      },
      {
        gameId: "12333",
        gameName: "Twilight Struggle",
        gameImage:
          "https://cf.geekdo-images.com/pNCiUUphnoeWOYfsWq0kng__thumb/img/CDg2IegBqWdhMSPKqGqP7dq96rI=/fit-in/200x150/filters:strip_icc()/pic361592.jpg",
        minPlayers: 2,
        maxPlayers: 2,
        description:
          "Relive the Cold War tension between the US and USSR in this card-driven strategy game.",
      },
      {
        gameId: "224517",
        gameName: "Brass: Birmingham",
        gameImage:
          "https://cf.geekdo-images.com/x3zxjr-Vw5iU4yDPg70Jgw__thumb/img/FpyxH41Y6_ROoePAilPNEhXnzO8=/fit-in/200x150/filters:strip_icc()/pic3490053.jpg",
        minPlayers: 2,
        maxPlayers: 4,
        description:
          "Build your industrial empire during the industrial revolution in Birmingham.",
      },
    ];

    // Create test sessions
    const sessions: Id<"sessions">[] = [];
    const now = Date.now();
    const day = 24 * 60 * 60 * 1000; // milliseconds in a day

    for (let i = 0; i < testGames.length; i++) {
      const game = testGames[i];
      const hostIndex = i % users.length;
      const host = users[hostIndex];

      if (!host || !game) continue;

      // Create a proposed session (looking for players)
      const proposedSessionId = await ctx.db.insert("sessions", {
        gameId: game.gameId,
        gameName: game.gameName,
        gameImage: game.gameImage,
        minPlayers: game.minPlayers,
        maxPlayers: game.maxPlayers,
        hostId: host._id,
        players: [],
        interestedPlayers: [],
        status: "proposed" as const,
        scheduledTime: now + (i + 1) * day, // Sessions over next few days
        location: i % 2 === 0 ? "Main Hall" : "Game Room B",
      });
      sessions.push(proposedSessionId);

      // Create an established session (has some interested players)
      if (users.length > 2 && i < 3) {
        const nextHost = users[(hostIndex + 1) % users.length];
        const interestedPlayer = users[(hostIndex + 2) % users.length];
        if (!nextHost || !interestedPlayer) continue;

        const establishedSessionId = await ctx.db.insert("sessions", {
          gameId: game.gameId + "_est",
          gameName: game.gameName,
          gameImage: game.gameImage,
          minPlayers: game.minPlayers,
          maxPlayers: game.maxPlayers,
          hostId: nextHost._id,
          players: [],
          interestedPlayers: [interestedPlayer._id],
          status: "established" as const,
          scheduledTime: now + (i + 2) * day,
          location: "Community Center",
          description: `Looking for more players for a great game!`,
        });
        sessions.push(establishedSessionId);
      }
    }

    return {
      message: `Created ${sessions.length} test sessions`,
      sessionIds: sessions,
    };
  },
});

export const clearTestSessions = mutation({
  args: {},
  handler: async ctx => {
    // Get all sessions
    const sessions = await ctx.db.query("sessions").collect();

    // Delete all sessions
    for (const session of sessions) {
      await ctx.db.delete(session._id);
    }

    // Clear all user swipes
    const swipes = await ctx.db.query("userSwipes").collect();
    for (const swipe of swipes) {
      await ctx.db.delete(swipe._id);
    }

    // Clear all session interactions
    const interactions = await ctx.db.query("sessionInteractions").collect();
    for (const interaction of interactions) {
      await ctx.db.delete(interaction._id);
    }

    return {
      message: `Cleared ${sessions.length} sessions, ${swipes.length} swipes, and ${interactions.length} interactions`,
    };
  },
});
