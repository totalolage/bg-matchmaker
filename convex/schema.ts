import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

const applicationTables = {
  users: defineTable({
    name: v.string(),
    profilePic: v.optional(v.string()),
    discordId: v.string(),
    gameLibrary: v.array(v.object({
      gameId: v.string(),
      gameName: v.string(),
      gameImage: v.optional(v.string()),
      expertiseLevel: v.union(
        v.literal("novice"),
        v.literal("beginner"),
        v.literal("intermediate"),
        v.literal("advanced"),
        v.literal("expert")
      )
    })),
    availability: v.array(v.object({
      dayOfWeek: v.number(), // 0-6 (Sunday-Saturday)
      startTime: v.string(), // "HH:MM" format
      endTime: v.string(), // "HH:MM" format
    })),
    pushSubscription: v.optional(v.object({
      endpoint: v.string(),
      keys: v.object({
        p256dh: v.string(),
        auth: v.string(),
      }),
    })),
  }).index("by_discord_id", ["discordId"]),

  sessions: defineTable({
    gameId: v.string(),
    gameName: v.string(),
    gameImage: v.optional(v.string()),
    hostId: v.id("users"),
    players: v.array(v.id("users")),
    interestedPlayers: v.array(v.id("users")),
    status: v.union(
      v.literal("proposed"),
      v.literal("established"),
      v.literal("confirmed"),
      v.literal("completed"),
      v.literal("cancelled")
    ),
    scheduledTime: v.optional(v.number()), // timestamp
    minPlayers: v.number(),
    maxPlayers: v.number(),
    discordChannelId: v.optional(v.string()),
    description: v.optional(v.string()),
    location: v.optional(v.string()),
  }).index("by_status", ["status"])
    .index("by_host", ["hostId"])
    .index("by_scheduled_time", ["scheduledTime"]),

  sessionFeedback: defineTable({
    userId: v.id("users"),
    sessionId: v.id("sessions"),
    enjoymentRating: v.number(), // 1-5
    selfAttended: v.boolean(),
    presentPlayers: v.array(v.id("users")),
    comments: v.optional(v.string()),
  }).index("by_session", ["sessionId"])
    .index("by_user", ["userId"]),

  gameData: defineTable({
    bggId: v.string(),
    name: v.string(),
    image: v.optional(v.string()),
    minPlayers: v.number(),
    maxPlayers: v.number(),
    playingTime: v.number(),
    complexity: v.optional(v.number()),
    description: v.optional(v.string()),
  }).index("by_bgg_id", ["bggId"]),

  userSwipes: defineTable({
    userId: v.id("users"),
    sessionId: v.id("sessions"),
    action: v.union(v.literal("like"), v.literal("pass")),
  }).index("by_user", ["userId"])
    .index("by_session", ["sessionId"])
    .index("by_user_session", ["userId", "sessionId"]),
};

export default defineSchema({
  ...authTables,
  ...applicationTables,
});
