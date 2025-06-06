import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

const applicationTables = {
  users: defineTable({
    // Auth fields required by Convex Auth
    email: v.optional(v.string()),
    emailVerificationTime: v.optional(v.number()),
    phone: v.optional(v.string()),
    phoneVerificationTime: v.optional(v.number()),
    isAnonymous: v.optional(v.boolean()),
    // Custom fields for the application
    name: v.string(), // Discord username
    displayName: v.optional(v.string()), // Custom display name
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
      date: v.string(), // ISO date string "YYYY-MM-DD"
      intervals: v.array(v.object({
        start: v.number(), // minutes since midnight (0-1439)
        end: v.number(),   // minutes since midnight (0-1439)
      }))
    })),
    pushSubscription: v.optional(v.object({
      endpoint: v.string(),
      keys: v.object({
        p256dh: v.string(),
        auth: v.string(),
      }),
    })),
  }).index("by_discord_id", ["discordId"])
    .index("email", ["email"]),

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

