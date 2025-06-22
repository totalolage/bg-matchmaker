/**
 * Rate limiting configuration and utilities for BGG API
 */
import { RateLimiter, SECOND } from "@convex-dev/rate-limiter";

import { ConvexError } from "convex/values";

import { components } from "../../_generated/api";
import { ActionCtx } from "../../_generated/server";

// Initialize rate limiter with BGG-specific policies
export const rateLimiter = new RateLimiter(components.rateLimiter, {
  // BGG requires minimum 5 seconds between requests - global for all users
  bggApiThrottle: {
    kind: "fixed window",
    rate: 1,
    period: 5 * SECOND,
  },
  // Per-client rate limit for our API endpoints
  clientApiLimit: {
    kind: "token bucket",
    rate: 100,
    period: 60 * SECOND,
    capacity: 100,
  },
});

/**
 * Enforce BGG API rate limits (global throttle)
 * BGG requires minimum 5 seconds between ALL requests across all users
 */
export async function enforceBGGRateLimit(ctx: ActionCtx): Promise<void> {
  // Use reserve to hold our place in the queue
  const throttleStatus = await rateLimiter.limit(ctx, "bggApiThrottle", {
    reserve: true,
  });

  // If we need to wait, do so
  if (!throttleStatus.ok && throttleStatus.retryAfter) {
    console.log(`[BGG Rate Limiter] Waiting ${throttleStatus.retryAfter}ms before next BGG API request`);
    await new Promise((resolve) => setTimeout(resolve, throttleStatus.retryAfter));
  }
}

/**
 * Check client API rate limits (per-client)
 * @param clientId - Unique identifier for the client (e.g., user ID)
 */
export async function enforceClientRateLimit(ctx: ActionCtx, clientId: string): Promise<void> {
  const status = await rateLimiter.limit(ctx, "clientApiLimit", {
    key: clientId,
  });
  
  if (!status.ok) {
    throw new ConvexError(
      `Rate limit exceeded. Please try again in ${Math.ceil(status.retryAfter / 1000)} seconds.`
    );
  }
}


