# BGG Data Source

A clean, modular data source for fetching board game information from BoardGameGeek's XML API v2.

## Architecture

This module follows the **Single Responsibility Principle** and is organized into focused, composable modules:

### Core Modules

- **`types.ts`** - Type definitions and interfaces
  - API response types (`BGGSearchResult`, `BGGGameDetails`)
  - Error types (`BGGAPIError`)
  - Configuration types

- **`rate-limiter.ts`** - Rate limiting logic
  - Enforces BGG's 5-second minimum between requests
  - Provides API protection (100 requests/minute limit)
  - Handles waiting and retries transparently

- **`xml-parser.ts`** - XML parsing utilities
  - Parses BGG's XML responses
  - Validates response schemas using arktype
  - Provides type-safe parsing functions

- **`api-client.ts`** - Low-level HTTP client
  - Makes rate-limited requests to BGG API
  - Builds query parameters for different endpoints
  - Handles HTTP errors and retries

- **`mappers.ts`** - Data transformation
  - Maps XML responses to clean TypeScript objects
  - Handles edge cases and data normalization
  - Extracts primary names and statistics

- **`bgg-service.ts`** - High-level service API
  - Combines all modules into easy-to-use functions
  - Handles batching for bulk operations
  - Provides error recovery strategies

- **`index.ts`** - Barrel file for clean exports
  - Re-exports only public APIs
  - Provides namespace import (`BGGDataSource`)

## Usage

```typescript
import { BGGDataSource } from './lib/bgg-data-source';

// Search for games
const searchResults = await BGGDataSource.searchGames(ctx, "Wingspan");

// Get detailed game information
const gameDetails = await BGGDataSource.getGameDetails(ctx, "266192");

// Get multiple games in bulk (batched automatically)
const games = await BGGDataSource.getMultipleGameDetails(ctx, ["266192", "174430"]);

// Get hot games
const hotGameIds = await BGGDataSource.getHotGames(ctx, 50);

// Get top ranked games
const topGames = await BGGDataSource.getTopRankedGames(ctx, 1);
```

## Design Principles

1. **Separation of Concerns** - Each module has a single, well-defined responsibility
2. **Composability** - Modules can be combined in different ways
3. **Type Safety** - Full TypeScript types with arktype validation
4. **Error Handling** - Custom error types with context
5. **Rate Limiting** - Built-in compliance with BGG's API limits
6. **Testability** - Each module can be tested independently

## API Limits

- Minimum 5 seconds between requests (enforced automatically)
- Maximum 100 requests per minute
- Batch operations limited to 20 games per request