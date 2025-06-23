/**
 * Type definitions for BoardGameGeek API data
 */

// API response types
export interface BGGSearchResult {
  id: string;
  name: string;
  yearPublished?: number;
}

export interface BGGGameDetails {
  id: string;
  name: string;
  alternateNames?: string[];
  description?: string;
  yearPublished?: number;
  minPlayers?: number;
  maxPlayers?: number;
  playingTime?: number;
  minAge?: number;
  image?: string;
  thumbnail?: string;
  averageWeight?: number;
  averageRating?: number;
}

// Error types
export class BGGAPIError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    originalError?: Error,
  ) {
    super(message, { cause: originalError });
    this.name = "BGGAPIError";
  }
}

// Configuration types
export interface BGGDataSourceConfig {
  baseUrl?: string;
  rateLimits?: {
    requestsPerMinute?: number;
    minSecondsBetweenRequests?: number;
  };
}

// Internal types for API operations
export interface FetchOptions {
  endpoint: string;
  params?: URLSearchParams;
}

export interface BulkFetchResult<T> {
  successful: T[];
  failed: Array<{ id: string; error: Error }>;
}
