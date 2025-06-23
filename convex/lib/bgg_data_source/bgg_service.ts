/**
 * High-level BGG data service
 * Combines API client, parsing, and mapping functionality
 */
import { ActionCtx } from "../../_generated/server";

import {
  buildHotParams,
  buildSearchParams,
  buildThingParams,
  buildTopRankedParams,
  makeRequest,
} from "./api_client";
import {
  mapHotResponse,
  mapMultipleThingItems,
  mapSearchResponse,
  mapThingResponse,
} from "./mappers";
import { BGGGameDetails, BGGSearchResult, BulkFetchResult } from "./types";
import {
  parseHotResponse,
  parseSearchResponse,
  parseThingResponse,
} from "./xml_parser";

/**
 * Search for games by name
 */
export async function searchGames(
  ctx: ActionCtx,
  query: string,
  exact: boolean = false,
): Promise<BGGSearchResult[]> {
  if (!query || query.trim().length < 2) {
    return [];
  }

  const params = buildSearchParams(query, exact);
  const xmlData = await makeRequest(ctx, {
    endpoint: "/search",
    params,
  });

  const parsed = parseSearchResponse(xmlData);
  return mapSearchResponse(parsed);
}

/**
 * Get detailed game information by BGG ID
 */
export async function getGameDetails(
  ctx: ActionCtx,
  bggId: string,
): Promise<BGGGameDetails> {
  const params = buildThingParams(bggId);
  const xmlData = await makeRequest(ctx, {
    endpoint: "/thing",
    params,
  });

  const parsed = parseThingResponse(xmlData);
  return mapThingResponse(parsed, bggId);
}

/**
 * Get multiple game details in bulk (up to 20 at once)
 */
export async function getMultipleGameDetails(
  ctx: ActionCtx,
  bggIds: string[],
): Promise<BGGGameDetails[]> {
  if (bggIds.length === 0) {
    return [];
  }

  const results: BGGGameDetails[] = [];
  const { BGG_SEEDING } = await import("../constants");
  const BATCH_SIZE = BGG_SEEDING.API_BATCH_SIZE;

  // Process in batches
  for (let i = 0; i < bggIds.length; i += BATCH_SIZE) {
    const batch = bggIds.slice(i, i + BATCH_SIZE);

    try {
      const params = buildThingParams(batch);
      const xmlData = await makeRequest(ctx, {
        endpoint: "/thing",
        params,
      });

      const parsed = parseThingResponse(xmlData);
      const batchResults = mapMultipleThingItems(parsed);
      results.push(...batchResults);
    } catch (error) {
      // Log error but continue with next batch
      console.error(`Failed to fetch batch starting at index ${i}:`, error);
    }
  }

  return results;
}

/**
 * Get hot/popular games from BGG
 */
export async function getHotGames(
  ctx: ActionCtx,
  limit: number = 50,
): Promise<string[]> {
  const params = buildHotParams();
  const xmlData = await makeRequest(ctx, {
    endpoint: "/hot",
    params,
  });

  const parsed = parseHotResponse(xmlData);
  const gameIds = mapHotResponse(parsed);

  return gameIds.slice(0, limit);
}

/**
 * Get top ranked games by page
 */
export async function getTopRankedGames(
  ctx: ActionCtx,
  page: number = 1,
): Promise<BGGSearchResult[]> {
  const params = buildTopRankedParams(page);
  const xmlData = await makeRequest(ctx, {
    endpoint: "/search",
    params,
  });

  const parsed = parseSearchResponse(xmlData);
  return mapSearchResponse(parsed);
}

/**
 * Fetch game details with error handling for each game
 */
export async function getGameDetailsWithErrorHandling(
  ctx: ActionCtx,
  bggIds: string[],
): Promise<BulkFetchResult<BGGGameDetails>> {
  const result: BulkFetchResult<BGGGameDetails> = {
    successful: [],
    failed: [],
  };

  if (bggIds.length === 0) {
    return result;
  }

  // Try bulk fetch first
  try {
    const bulkResults = await getMultipleGameDetails(ctx, bggIds);
    result.successful = bulkResults;

    // Find which IDs failed
    const successfulIds = new Set(bulkResults.map(game => game.id));
    const failedIds = bggIds.filter(id => !successfulIds.has(id));

    result.failed = failedIds.map(id => ({
      id,
      error: new Error("Game not found in bulk response"),
    }));
  } catch {
    // If bulk fetch fails entirely, try individual fetches
    for (const bggId of bggIds) {
      try {
        const details = await getGameDetails(ctx, bggId);
        result.successful.push(details);
      } catch (error) {
        result.failed.push({
          id: bggId,
          error: error instanceof Error ? error : new Error(String(error)),
        });
      }
    }
  }

  return result;
}
