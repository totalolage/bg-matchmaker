# BG Matchmaker - Design Document

## Executive Summary

BG Matchmaker is a Progressive Web Application that facilitates board game session scheduling by matching players based on game preferences, availability, and skill level. The application uses a Tinder-like interface for discovering gaming sessions and integrates with Discord for communication.

## Core Features

### 1. User Management

#### User Profile
- **Name**: Display name for the user
- **Profile Picture**: Avatar/photo upload
- **Game Library**: List of known games with self-assessed expertise levels
  - Expertise Levels: Novice, Beginner, Intermediate, Advanced, Expert
- **Availability Calendar**: When the user is available to play

### 2. Game Database Integration

- **Primary Source**: BoardGameGeek (BGG) API
- **Architecture**: Flexible interface to support future API integrations
- **Data Points from BGG**:
  - Game information (title, description, image)
  - Player count (min/max)
  - Play time estimates
  - Game complexity ratings

### 3. Matchmaking System

#### Session Types
1. **Established Sessions**: Games with confirmed players looking for additional participants
2. **Proposed Sessions**: Potential games that need minimum players to be realized

#### Matching Algorithm (Fuzzy Matching)
- **Primary Factors**:
  - Game preference overlap
  - Time availability alignment
  - Skill level compatibility
- **Ranking**: Sessions shown in order of best match

#### Discovery Interface
- **UI Pattern**: Tinder-like card swiping
- **Actions**:
  - Swipe right: Express interest
  - Swipe left: Pass
  - View details: Tap for more information

### 4. Session Creation Workflow

1. **Interest Expression**: Users input games they want to play and available times
2. **Matching**: System identifies potential matches
3. **Proposal**: When enough players match, system proposes a session
4. **Voting**: If multiple options exist (games/times), players rank preferences
5. **Confirmation**: Once consensus reached, session is created

### 5. Discord Integration

- **Discord Bot Features**:
  - Automatic channel creation for confirmed sessions
  - Player invitations to appropriate channels
  - Session reminders
  - Post-game cleanup (archive channels)

## Technical Architecture

### Frontend
- **Framework**: React
- **Routing**: TanStack Router with View Transitions API
- **Styling**: [TBD - Tailwind CSS recommended]
- **State Management**: [TBD - TanStack Query recommended]
- **PWA Features**: 
  - Offline capability
  - Push notifications
  - Install prompt

### Backend
- **API**: [TBD - Node.js/Express or Python/FastAPI recommended]
- **Database**: [TBD - PostgreSQL recommended]
- **Authentication**: Discord OAuth 2.0
- **Real-time Updates**: [TBD - WebSockets or Server-Sent Events]

### External Integrations
- **BoardGameGeek API**: Game data
- **Discord API**: Bot and OAuth
- **Image Storage**: [TBD - Cloudinary or S3]

## Data Models

### User
```typescript
interface User {
  id: string;
  name: string;
  profilePicture: string;
  email: string;
  discordId: string;
  gameLibrary: UserGame[];
  availability: AvailabilitySlot[];
  createdAt: Date;
  updatedAt: Date;
}
```

### UserGame
```typescript
interface UserGame {
  gameId: string; // BGG ID
  expertiseLevel: 'novice' | 'beginner' | 'intermediate' | 'advanced' | 'expert';
  lastPlayed?: Date;
}
```

### Session
```typescript
interface Session {
  id: string;
  gameId: string;
  hostId: string;
  players: string[]; // User IDs
  status: 'proposed' | 'voting' | 'confirmed' | 'completed' | 'cancelled';
  scheduledTime: Date;
  minPlayers: number;
  maxPlayers: number;
  location: string; // For future multi-tenant support
  discordChannelId?: string;
  feedback?: PostSessionFeedback[]; // Post-session feedback from players
}

interface PostSessionFeedback {
  userId: string; // User providing feedback
  sessionId: string;
  enjoymentRating?: number; // 1-5 stars
  attendanceReport: {
    presentPlayers: string[]; // User IDs of players who attended
    selfAttended: boolean; // Did the reporting user attend?
  };
  submittedAt: Date;
}
```

## User Flows

### 1. New User Onboarding
1. Sign up with email/Discord OAuth
2. Complete profile (name, picture)
3. Search and add games to library with expertise levels
4. Set availability in calendar
5. Tutorial on swiping interface

### 2. Finding a Game Session
1. Open discovery interface
2. View session cards showing:
   - Game name and image
   - Date/time
   - Current players and needed players
   - Average skill level
3. Swipe right on interesting sessions
4. Receive notification when matched
5. Join Discord channel for coordination

### 3. Creating a Game Proposal
1. Select game(s) from library
2. Choose available time slots
3. Set preferences (skill level range, etc.)
4. Submit proposal
5. System notifies when enough matches found
6. Vote on final details if needed
7. Session confirmed and Discord channel created

### 4. Post-Session Feedback
1. Push notification sent shortly after session end time
2. User opens feedback form showing:
   - Session details (game, time, location)
   - "How was your session?" (1-5 star rating)
   - "Who came?" checklist with all expected players
   - "I couldn't make it :(" option for self-reporting absence
3. User selects all players who attended (positive framing)
4. If user self-reports absence, skip enjoyment rating
5. Submit feedback
6. System aggregates attendance data across all reports

## MVP Scope

### Phase 1 (MVP)
- Basic user authentication and profiles
- BGG API integration for game data
- Simple matching algorithm
- Swiping interface for discovery
- Manual session creation
- Basic Discord bot for channel creation
- Post-session feedback system with attendance tracking
- Push notifications for session reminders and feedback

### Future Enhancements
- Multi-tenant support (multiple locations)
- Advanced matching algorithms
- Tournament organization
- Game library lending/trading
- Post-game reviews and ratings
- Mobile native apps
- Integration with other game databases
- Virtual tabletop integration for online play

## Design Decisions

1. **Authentication**: Discord OAuth only - ensures all users have Discord for communication
2. **Scheduling**: No limits on advance scheduling - flexibility for planning
3. **Post-Session Feedback**: 
   - Push notification sent after session ends
   - Players mark who attended (positive framing: "Who came?")
   - Option to self-report absence: "I couldn't make it :("
   - Session enjoyment rating (1-5 stars)
   - Attendance data aggregated from multiple reports
4. **User Capacity**: <100 users for MVP - no scaling optimizations needed
5. **Notifications**: 
   - Primary: PWA push notifications
   - Future: Discord bot notifications
6. **Admin Features**: Direct database access only - no admin UI for MVP