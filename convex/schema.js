import { authTables } from "@convex-dev/auth/server";
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
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
    role: v.optional(v.union(v.literal("User"), v.literal("Admin"))),
    gameLibrary: v.array(
      v.object({
        gameId: v.string(),
        gameName: v.string(),
        gameImage: v.optional(v.string()),
        expertiseLevel: v.union(
          v.literal("novice"),
          v.literal("beginner"),
          v.literal("intermediate"),
          v.literal("advanced"),
          v.literal("expert"),
        ),
      }),
    ),
    availability: v.array(
      v.object({
        date: v.string(), // ISO date string "YYYY-MM-DD"
        intervals: v.array(
          v.object({
            start: v.number(), // minutes since midnight (0-1439)
            end: v.number(), // minutes since midnight (0-1439)
            type: v.optional(
              v.union(v.literal("available"), v.literal("committed")),
            ), // default is "available"
            sessionId: v.optional(v.id("sessions")), // for committed slots
          }),
        ),
      }),
    ),
    pushSubscription: v.optional(
      v.object({
        endpoint: v.string(),
        keys: v.object({
          p256dh: v.string(),
          auth: v.string(),
        }),
      }),
    ),
  })
    .index("by_discord_id", ["discordId"])
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
      v.literal("cancelled"),
    ),
    scheduledTime: v.optional(v.number()), // timestamp
    minPlayers: v.number(),
    maxPlayers: v.number(),
    discordChannelId: v.optional(v.string()),
    description: v.optional(v.string()),
    location: v.optional(v.string()),
  })
    .index("by_status", ["status"])
    .index("by_host", ["hostId"])
    .index("by_scheduled_time", ["scheduledTime"]),
  sessionFeedback: defineTable({
    userId: v.id("users"),
    sessionId: v.id("sessions"),
    enjoymentRating: v.number(), // 1-5
    selfAttended: v.boolean(),
    presentPlayers: v.array(v.id("users")),
    comments: v.optional(v.string()),
  })
    .index("by_session", ["sessionId"])
    .index("by_user", ["userId"]),
  gameData: defineTable({
    bggId: v.string(),
    name: v.string(),
    alternateNames: v.optional(v.array(v.string())), // Alternate game names from BGG
    searchText: v.optional(v.string()), // Combined search field for name + alternate names
    image: v.optional(v.string()),
    thumbnail: v.optional(v.string()),
    minPlayers: v.optional(v.number()),
    maxPlayers: v.optional(v.number()),
    playingTime: v.optional(v.number()),
    complexity: v.optional(v.number()),
    description: v.optional(v.string()),
    yearPublished: v.optional(v.number()),
    lastUpdated: v.number(), // Timestamp for cache freshness
    popularity: v.optional(v.number()), // For sorting search results
    averageRating: v.optional(v.number()), // BGG average rating
  })
    .index("by_bgg_id", ["bggId"])
    .searchIndex("search_name", {
      searchField: "name",
    }),
  userSwipes: defineTable({
    userId: v.id("users"),
    sessionId: v.id("sessions"),
    action: v.union(v.literal("like"), v.literal("pass")),
  })
    .index("by_user", ["userId"])
    .index("by_session", ["sessionId"])
    .index("by_user_session", ["userId", "sessionId"]),
  sessionInteractions: defineTable({
    userId: v.id("users"),
    sessionId: v.id("sessions"),
    interactionType: v.union(
      v.literal("interested"),
      v.literal("declined"),
      v.literal("accepted"),
    ),
    createdAt: v.number(),
    metadata: v.optional(
      v.object({
        swipeDirection: v.optional(v.string()),
        deviceType: v.optional(v.string()),
      }),
    ),
  })
    .index("by_user", ["userId"])
    .index("by_session", ["sessionId"])
    .index("by_user_session", ["userId", "sessionId"])
    .index("by_interaction_type", ["interactionType"])
    .index("by_created_at", ["createdAt"]),
  jobs: defineTable({
    name: v.string(), // Unique job identifier (e.g., "bgg_seed")
    type: v.string(), // Job type (e.g., "seeding", "import", "export")
    status: v.union(
      v.literal("in_progress"),
      v.literal("stopping"),
      v.literal("stopped"),
      v.literal("completed"),
      v.literal("failed"),
    ),
    progress: v.object({
      current: v.number(), // Current progress value
      total: v.optional(v.number()), // Total items to process (if known)
    }),
    metadata: v.any(), // Job-specific metadata (flexible schema)
    error: v.optional(v.string()), // Error message if failed
    startedAt: v.number(), // Timestamp when job started
    lastUpdatedAt: v.number(), // Timestamp of last update
    completedAt: v.optional(v.number()), // Timestamp when completed
    scheduledFunctionId: v.optional(v.id("_scheduled_functions")), // ID of scheduled continuation
  })
    .index("by_name", ["name"])
    .index("by_type", ["type"])
    .index("by_status", ["status"]),
  sessionProposals: defineTable({
    proposedToUserId: v.id("users"),
    proposedByAlgorithm: v.boolean(),
    gameId: v.string(),
    gameName: v.string(),
    gameImage: v.optional(v.string()),
    proposedParticipants: v.array(v.id("users")),
    preferenceScore: v.number(), // 0-1 range
    timeCompatibilityScore: v.number(), // 0-1 range
    successRateScore: v.number(), // 0-1 range
    overallScore: v.number(), // 0-1 range
    proposedDateTime: v.number(), // timestamp
    status: v.union(
      v.literal("pending"),
      v.literal("accepted"),
      v.literal("declined"),
      v.literal("expired"),
    ),
    reason: v.optional(v.string()), // Human-readable reason for the proposal
    createdAt: v.number(), // timestamp
    expiresAt: v.optional(v.number()), // timestamp when proposal expires
    metadata: v.optional(
      v.object({
        commonGames: v.optional(v.array(v.string())), // List of shared games
        overlappingTimeSlots: v.optional(v.number()), // Number of overlapping time slots
      }),
    ),
  })
    .index("by_user", ["proposedToUserId"])
    .index("by_score", ["overallScore"])
    .index("by_status", ["status"])
    .index("by_created_at", ["createdAt"])
    .index("by_user_status", ["proposedToUserId", "status"]),
};
export default defineSchema({
  ...authTables,
  ...applicationTables,
});
