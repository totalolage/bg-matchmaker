# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

DeskoSpojka is a Progressive Web Application for matchmaking board game players based on game preferences, availability, and skill level. It features a Tinder-like discovery interface and Discord integration for communication.

## Technology Stack

- **Frontend**: React PWA with TanStack Router and View Transitions API
- **Authentication**: Discord OAuth 2.0 only
- **External APIs**: BoardGameGeek API for game data
- **Communication**: Discord bot for session coordination
- **Notifications**: PWA push notifications

## Key Design Decisions

1. **Single Physical Location**: MVP assumes all users are in the same location (future: multi-tenant)
2. **Discord-Only Auth**: All users must have Discord for communication
3. **Session Types**: One-off, in-person sessions only
4. **User Scale**: <100 users expected, no scaling optimizations needed
5. **No Admin UI**: Direct database access for administration

## Core Features

1. **User Profiles**: Name, picture, game library with expertise levels (novice to expert), availability calendar
2. **Fuzzy Matchmaking**: Matches based on games, times, and skill levels
3. **Discovery Interface**: Tinder-like swiping for browsing sessions
4. **Session Creation**: Automatic proposals when enough players match preferences
5. **Discord Integration**: Auto-creates channels and invites players when sessions confirm

## Development Commands

*To be added when project is initialized with specific framework*

## TanStack Start + Convex Setup

### Quick Setup
```bash
bun create convex@latest -- -t tanstack-start
```

### Manual Setup
1. **Install dependencies**:
   ```bash
   bun install convex @convex-dev/react-query @tanstack/react-router-with-query @tanstack/react-query
   ```

2. **Update `app/routes/__root.tsx`**: Add QueryClient to router context
3. **Update `app/router.tsx`**: Create ConvexClient, ConvexQueryClient, and wire ConvexProvider
4. **Run Convex dev**: `npx convex dev` (creates convex/ folder, syncs with cloud)
5. **Create queries**: Export from `convex/*.ts` files (e.g., `api.tasks.get`)
6. **Use in components**: `useSuspenseQuery(convexQuery(api.tasks.get, {}))`

### Key Features with TanStack Start
- **Live-updating queries**: Using React Query hooks
- **SSR support**: Automatic with `useSuspenseQuery`
- **Consistent views**: All queries at same logical timestamp
- **Preloading**: Via route loaders for faster navigation
- **Subscription persistence**: Queries stay live for 5min after unmount (configurable via `gcTime`)

### Example Query Usage
```tsx
// convex/tasks.ts
export const get = query({
  args: {},
  handler: async (ctx) => await ctx.db.query("tasks").collect(),
});

// app/routes/index.tsx
const { data } = useSuspenseQuery(convexQuery(api.tasks.get, {}));
```

## Architecture Notes

- Design flexible API interfaces to support future game database integrations beyond BGG
- Store cancellation/no-show data for future rating system implementation
- PWA features are critical: offline capability, push notifications, installability

## Important Files

- `/DESIGN.md`: Comprehensive design document with data models and user flows

## Development Guidelines

- Always use bun instead of npm

## Memories

- Use Context7 MCP to reference documentation
- Use ShadCN components
- To check that the server is running, use curl to ping the url.
- Always validate your changes using Playwright MCP