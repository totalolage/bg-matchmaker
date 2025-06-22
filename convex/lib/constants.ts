// BGG Seeding Constants
export const BGG_SEEDING = {
  // Convex timeout is 10 minutes (600,000ms), we'll use 90% of that
  MAX_DURATION_MS: 540000, // 9 minutes

  // BGG API rate limiting
  RATE_LIMIT_REQUESTS_PER_SECOND: 2,
  ESTIMATED_TIME_PER_BATCH_MS: 5000, // 5 seconds per batch due to rate limiting
  API_BATCH_SIZE: 20, // BGG API limit for bulk requests

  // BGG database size estimates
  EST_GAME_COUNT: 1662 * 100, // BGG website lists 1662 pages of games, at 100 per page
  MAX_CONSECUTIVE_NOT_FOUND: 1000, // Stop if we hit 1000 consecutive missing IDs

  // Scheduling
  SCHEDULE_DELAY_MS: 600000, // 10 minutes between scheduled runs

  // Progress tracking
  SEED_NAME: "bgg_seed",
} as const;

// CSV Import Constants
export const CSV_IMPORT = {
  // Batch size for bulk imports to avoid memory issues
  BATCH_SIZE: 1000,
} as const;

// Other app constants can be added here as needed
