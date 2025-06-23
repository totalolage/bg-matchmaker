# DeskoSpojka - Board Game Session Matcher PWA

A Progressive Web Application for matchmaking board game players based on game preferences, availability, and skill level. Features a Tinder-like discovery interface and Discord integration for communication.

This project uses [Convex](https://convex.dev) as its backend and is connected to the deployment [`dazzling-okapi-190`](https://dashboard.convex.dev/d/dazzling-okapi-190).

## Project structure

The frontend code is in the `app` directory and is built with [Vite](https://vitejs.dev/).

The backend code is in the `convex` directory.

`bun run dev` will start the frontend and backend servers.

## App authentication

Chef apps use [Convex Auth](https://auth.convex.dev/) with Anonymous auth for easy sign in. You may wish to change this before deploying your app.

## Development Workflow

### Task Management

This project uses [Task Master AI](https://github.com/AntonioRdC/task-master-ai) for tracking development progress. All tasks are managed through Task Master instead of manual TODO lists.

```bash
# View current tasks
task-master list

# Get next task to work on
task-master next

# View task details
task-master show <id>

# Mark task as complete
task-master set-status --id=<id> --status=done
```

### Deployment

This project is configured to deploy to Vercel only when a release tag is created. This prevents unnecessary builds on every commit.

Release tags are automatically created by GitHub Actions when appropriate. The `vercel-build-ignore.sh` script checks for tags starting with `v` or `release-` and only allows builds for those commits.

### Developing and deploying your app

Check out the [Convex docs](https://docs.convex.dev/) for more information on how to develop with Convex.

- If you're new to Convex, the [Overview](https://docs.convex.dev/understanding/) is a good place to start
- Check out the [Hosting and Deployment](https://docs.convex.dev/production/) docs for how to deploy your app
- Read the [Best Practices](https://docs.convex.dev/understanding/best-practices/) guide for tips on how to improve you app further

## API Documentation

### Game Search with Weighted Scoring

The game search API supports weighted relevance scoring across multiple fields to provide more accurate search results.

#### Search Endpoints

**`searchGames`** - Returns up to 20 results with relevance scores

```typescript
// Basic search (uses default weights)
const results = await ctx.query(api.games.searchGames, {
  query: "gloomhaven",
});

// Search with custom weights
const results = await ctx.query(api.games.searchGames, {
  query: "gloomhaven",
  weights: {
    title: 15, // Higher weight for title matches
    alternateNames: 5, // Default weight
    description: 1, // Lower weight for description matches
  },
});
```

**`searchGamesPaginated`** - Returns paginated results with relevance scores

```typescript
const results = await ctx.query(api.games.searchGamesPaginated, {
  query: "terraforming",
  paginationOpts: {
    numItems: 10,
    cursor: null,
  },
  weights: {
    title: 10,
    alternateNames: 5,
    description: 2,
  },
});
```

#### Default Weights

The default search weights are configured in `convex/lib/constants.ts`:

- **Title**: 10 - Highest priority for matches in the game title
- **Alternate Names**: 5 - Medium priority for alternate game names/editions
- **Description**: 2 - Lower priority for matches in the game description

#### Popularity Boost

Search results are sorted by a combination of relevance score and game popularity:

- **Relevance scoring**:
  - Exact name matches get 3x bonus
  - Games starting with the search term get extra weight
  - Occurrence counting is capped to prevent gaming the system
- **Popularity boost**:
  - Very popular games (>10k ratings) get up to 50% boost using logarithmic scale
  - Medium popularity (1k-10k) gets up to 30% boost
  - Low popularity (<1k) gets up to 10% boost
- This ensures the most relevant AND popular games appear first (e.g., "Catan" returns the original game before expansions)

#### Response Format

Search results include an optional `score` field indicating relevance:

```typescript
{
  bggId: string;
  name: string;
  image: string;
  minPlayers: number;
  maxPlayers: number;
  playingTime: number;
  complexity: number;
  score?: number; // Relevance score (higher is more relevant)
}
```

## HTTP API

User-defined http routes are defined in the `convex/router.ts` file. We split these routes into a separate file from `convex/http.ts` to allow us to prevent the LLM from modifying the authentication routes.
