# TuneHunt - Project Documentation for Claude Code

## Project Overview

TuneHunt is a Next.js-based multiplayer "name that tune" game where players guess songs from audio previews. The game supports both individual track selection and playlist-based gameplay modes.

### Tech Stack
- **Frontend**: Next.js 15 with TypeScript, React, Tailwind CSS
- **Backend**: Next.js API routes with Prisma ORM
- **Database**: PostgreSQL with Prisma
- **Authentication**: NextAuth.js
- **Music API**: Spotify Web API integration
- **UI Components**: shadcn/ui component library

### Key Features
- Real-time multiplayer rooms with host controls
- Two game modes: Individual Selection & Playlist-based
- Spotify track search and preview playback
- User authentication and session management
- Room management with join codes
- Score tracking and leaderboards

## Current Project State (as of 2025-09-17)

### ✅ Recently Completed Fixes

#### Build & Code Quality Issues
- **ESLint/TypeScript Errors**: All compilation errors resolved
  - Removed unused imports (`PlaylistStatus`, `RoomStatus`, UI components)
  - Fixed `any` type usage with proper type assertions
  - Removed unused variables and state
  - Added missing TypeScript interface properties

#### Core Functionality Fixes
1. **Room Status Issues**: 
   - Fixed rooms stuck in "SELECTING" status indefinitely
   - Implemented proper game flow between SELECTING → PLAYING → FINISHED

2. **Participant Counting**: 
   - Fixed host not being counted as participant when creating rooms
   - Modified room creation to automatically add host as participant

3. **Real-time Updates**:
   - Added polling-based updates (5s for individual rooms, 10s for room lists)
   - Users now see real-time participant changes

4. **Game Start Logic**:
   - Implemented flexible start conditions (host can start with ≥1 players ready)
   - Added dual UI paths for playlist vs individual selection games
   - Fixed missing "Start Game" button visibility

### 🏗️ Current Architecture

#### Database Schema (Prisma)
Key entities:
- `User` - Authentication and profile data
- `Room` - Game rooms with host, settings, max players
- `Game` - Individual game instances within rooms
- `GameParticipant` - Player participation in games
- `Song` - Track metadata from Spotify
- `SelectedSong` - Player song selections for games
- `Playlist` - Curated song collections

#### API Endpoints
- `/api/rooms` - Room CRUD operations
- `/api/rooms/[code]` - Individual room management
- `/api/rooms/[code]/join` - Join room functionality
- `/api/games/[gameId]/start` - Game initialization
- `/api/games/[gameId]/selections` - Track selection management

#### Key Components
- `app/rooms/page.tsx` - Room browser with search and filtering
- `app/room/[code]/page.tsx` - Individual room interface
- `app/create-room/page.tsx` - Room creation wizard
- `components/Game/TrackSelection.tsx` - Song selection interface
- `components/Game/MusicSearch.tsx` - Spotify search integration

## Development Guidelines

### Before Deployment Checklist
⚠️ **CRITICAL**: Always run these commands before deployment:
```bash
npm run lint
npx tsc --noEmit
```

### Code Quality Standards
- No ESLint warnings/errors allowed
- Strict TypeScript compilation required
- Proper type assertions instead of `any` usage
- Remove unused imports and variables

### Real-time Updates Pattern
Current implementation uses polling intervals:
- Room lists: 10 second intervals
- Individual rooms: 5 second intervals
- Consider WebSocket upgrade for better performance

## Game Flow Logic

### Individual Selection Mode
1. Host creates room → Status: SELECTING
2. Players join and select individual tracks
3. Host can start game when ≥1 player has selected
4. Game transitions to PLAYING status
5. Players guess tracks in sequence

### Playlist Mode
1. Host creates room with playlist → Status: SELECTING  
2. Players join (no individual selection needed)
3. Host starts game immediately
4. Game uses playlist tracks in sequence

## Known Issues & Future Improvements

### 🐛 Known Issues
- No real WebSocket implementation (using polling)
- No offline/reconnection handling
- Limited error handling for Spotify API failures

### 🚀 Planned Features
- Real-time WebSocket implementation
- Enhanced scoring system
- Game replay functionality
- Mobile-responsive improvements
- Advanced playlist management
- Tournament/bracket modes

### 🎯 Immediate Next Steps
1. **WebSocket Integration**: Replace polling with real-time updates
2. **Error Handling**: Improve Spotify API error handling
3. **Mobile Optimization**: Enhance mobile user experience
4. **Testing**: Add comprehensive test coverage

## File Structure

```
TuneHunt/
├── app/
│   ├── api/                 # Next.js API routes
│   ├── rooms/              # Room browser
│   ├── room/[code]/        # Individual room interface
│   ├── create-room/        # Room creation
│   └── playlists/          # Playlist management
├── components/
│   ├── Game/               # Game-specific components
│   └── ui/                 # shadcn/ui components
├── lib/
│   ├── auth.ts            # NextAuth configuration
│   ├── prisma.ts          # Database client
│   └── spotify.ts         # Spotify API integration
└── prisma/
    └── schema.prisma      # Database schema
```

## Environment Setup

### Required Environment Variables
```env
DATABASE_URL="postgresql://..."
NEXTAUTH_SECRET="..."
NEXTAUTH_URL="http://localhost:3000"
SPOTIFY_CLIENT_ID="..."
SPOTIFY_CLIENT_SECRET="..."
```

### Development Commands
```bash
npm run dev          # Start development server
npm run build        # Production build
npm run lint         # ESLint check
npx tsc --noEmit     # TypeScript check
npx prisma studio    # Database GUI
npx prisma generate  # Update Prisma client
```

## Troubleshooting Common Issues

### Build Failures
1. Run `npm run lint` - fix all ESLint errors
2. Run `npx tsc --noEmit` - fix TypeScript errors
3. Check for unused imports/variables
4. Verify proper type assertions (avoid `any`)

### Room Issues
- If rooms appear empty: Check participant creation in `/api/rooms`
- If status stuck: Verify game flow logic in room components
- If no real-time updates: Check polling intervals

### Game Start Issues
- Verify host permissions in game start logic
- Check minimum participant requirements
- Ensure proper game mode detection (playlist vs individual)

---

**Last Updated**: 2025-09-17  
**Claude Code Session**: All ESLint/TypeScript errors resolved, core functionality fixes completed