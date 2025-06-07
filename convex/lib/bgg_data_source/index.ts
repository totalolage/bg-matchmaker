/**
 * BoardGameGeek Data Source
 * 
 * A clean, modular interface for fetching game data from BoardGameGeek's XML API.
 * This module handles rate limiting, XML parsing, and data transformation.
 * 
 * @example
 * ```typescript
 * import { BGGDataSource } from './lib/bgg-data-source';
 * 
 * // Search for games
 * const results = await BGGDataSource.searchGames(ctx, "Catan");
 * 
 * // Get game details
 * const game = await BGGDataSource.getGameDetails(ctx, "13");
 * 
 * // Get hot games
 * const hotGameIds = await BGGDataSource.getHotGames(ctx, 10);
 * ```
 */

// Re-export types
export type {
  BGGSearchResult,
  BGGGameDetails,
  BGGDataSourceConfig,
  BulkFetchResult,
} from "./types";

// Re-export service functions
export {
  searchGames,
  getGameDetails,
  getMultipleGameDetails,
  getHotGames,
  getTopRankedGames,
  getGameDetailsWithErrorHandling,
} from "./bgg_service";

// Create namespace for cleaner imports
export * as BGGDataSource from "./bgg_service";

// Export error class for instanceof checks
export { BGGAPIError } from "./types";