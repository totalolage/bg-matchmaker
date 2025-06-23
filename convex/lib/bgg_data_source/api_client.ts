/**
 * Low-level API client for BGG XML API v2
 */
import { ActionCtx } from "../../_generated/server";

import { enforceBGGRateLimit } from "./rate_limiter";
import { BGGAPIError, FetchOptions } from "./types";

const BGG_BASE_URL = "https://boardgamegeek.com/xmlapi2";

/**
 * Make a rate-limited request to the BGG API
 */
export async function makeRequest(
  ctx: ActionCtx,
  options: FetchOptions,
): Promise<string> {
  // Enforce rate limits before making request
  await enforceBGGRateLimit(ctx);

  // Build URL
  const url = new URL(`${BGG_BASE_URL}${options.endpoint}`);
  if (options.params) {
    url.search = options.params.toString();
  }

  try {
    const response = await fetch(url.toString());

    if (!response.ok) {
      if (response.status === 503 || response.status === 429) {
        throw new BGGAPIError(
          "BGG API rate limit reached. Please try again later.",
          response.status,
        );
      }
      throw new BGGAPIError(
        `BGG API request failed: ${response.statusText}`,
        response.status,
      );
    }

    return await response.text();
  } catch (error) {
    if (error instanceof BGGAPIError) {
      throw error;
    }
    throw new BGGAPIError(
      "Failed to connect to BGG API",
      undefined,
      error as Error,
    );
  }
}

/**
 * Build search parameters
 */
export function buildSearchParams(
  query: string,
  exact: boolean = false,
): URLSearchParams {
  return new URLSearchParams({
    query: query.trim(),
    type: "boardgame",
    ...(exact && { exact: "1" }),
  });
}

/**
 * Build thing/details parameters
 */
export function buildThingParams(
  bggIds: string | string[],
  includeStats: boolean = true,
): URLSearchParams {
  const ids = Array.isArray(bggIds) ? bggIds.join(",") : bggIds;
  const params = new URLSearchParams({ id: ids });

  if (includeStats) {
    params.append("stats", "1");
  }

  return params;
}

/**
 * Build hot games parameters
 */
export function buildHotParams(): URLSearchParams {
  return new URLSearchParams({ type: "boardgame" });
}

/**
 * Build top ranked parameters
 */
export function buildTopRankedParams(page: number = 1): URLSearchParams {
  return new URLSearchParams({
    type: "boardgame",
    sort: "rank",
    page: page.toString(),
  });
}
