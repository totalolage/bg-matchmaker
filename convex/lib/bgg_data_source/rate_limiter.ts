/**
 * Rate limiting configuration and utilities for BGG API
 */
import { RateLimiter, SECOND } from "@convex-dev/rate-limiter";
import { components } from "../../_generated/api";
import { ActionCtx } from "../../_generated/server";
import { ConvexError } from "convex/values";

// Initialize rate limiter with BGG-specific policies
export const rateLimiter = new RateLimiter(components.rateLimiter, {
  // BGG requires minimum 5 seconds between requests
  bggApiThrottle: {
    kind: "fixed window",
    rate: 1,
    period: 5 * SECOND,
  },
  // Protection against excessive API calls
  bggApiProtection: {
    kind: "token bucket",
    rate: 100,
    period: 60 * SECOND,
    capacity: 10,
  },
});

/**
 * Check rate limits and wait if necessary
 * @returns Promise that resolves when request can proceed
 */
export async function enforceRateLimits(ctx: ActionCtx): Promise<void> {
  // Check API protection limit first
  const protectionStatus = await rateLimiter.limit(ctx, "bggApiProtection");
  
  if (!protectionStatus.ok) {
    throw new ConvexError(
      `API protection limit exceeded. Please try again in ${Math.ceil(protectionStatus.retryAfter / 1000)} seconds.`
    );
  }

  // Check throttle limit with reservation
  const throttleStatus = await rateLimiter.limit(ctx, "bggApiThrottle", {
    reserve: true,
  });

  // If we need to wait, do so
  if (throttleStatus.retryAfter) {
    await new Promise((resolve) => setTimeout(resolve, throttleStatus.retryAfter));
    
    // Verify we can proceed after waiting
    const retryStatus = await rateLimiter.limit(ctx, "bggApiThrottle");
    if (!retryStatus.ok) {
      throw new Error("Rate limit still exceeded after waiting");
    }
  }
}