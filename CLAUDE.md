# TuneHunt - Project Documentation for Claude Code

## Project Overview

TuneHunt is a Next.js-based multiplayer "name that tune" game where players guess songs from audio previews. The game supports both individual track selection and playlist-based gameplay modes.

### Tech Stack
- **Frontend**: Next.js 15 with TypeScript, React, Tailwind CSS
- **Backend**: Next.js API routes with Prisma ORM
- **Database**: PostgreSQL with Prisma
- **Authentication**: NextAuth.js
- **Music API**: Deezer API integration
- **UI Components**: shadcn/ui component library

### Key Features
- Real-time multiplayer rooms with host controls
- Two game modes: Individual Selection & Playlist-based
- Deezer track search and preview playback
- User authentication and session management
- Room management with join codes
- Score tracking and leaderboards

## Current Project State (as of 2025-09-18)

### ✅ Recently Completed Fixes

#### Major Updates (2025-09-18)
- **Complete Deezer Migration**: Full transition from Spotify to Deezer API
  - ✅ Reliable 30-second preview URLs (no more null preview_url issues)
  - ✅ No authentication required for Deezer API
  - ✅ Maintained backward compatibility with existing components
  - ✅ Fixed all TypeScript compilation errors

#### Game Flow & UX Improvements (2025-09-18)
- **✅ Start New Game Functionality**: Fixed broken "Start New Game" button
  - Created `/api/rooms/[code]/new-game` endpoint
  - Preserves all participants from finished games
  - Proper state management and room refresh

- **✅ Game End Experience**: Enhanced post-game summary
  - Added `GameSongsSummary` component showing all songs played
  - Displays track details, album art, and who selected each song
  - New `/api/games/[gameId]/songs` API endpoint

- **✅ Unlimited Guessing**: Removed guess limitations
  - Players can guess as many times as they want per song
  - Real-time guess feed with smart spoiler protection
  - Visual celebrations for correct guesses with points

- **✅ Round Experience**: Improved song presentation
  - Song intro modals showing whose track is playing (3s)
  - Round end modals with song reveal and winner celebration (5s)
  - Album covers hidden during gameplay to prevent cheating

#### UI/UX Polish (2025-09-18)
- **✅ Modern Theming**: Updated color scheme
  - Primary: Emerald green (`16 185 129` light, `34 197 94` dark)
  - Accent: Teal/blue gradients for visual interest
  - Better contrast and accessibility in both light/dark modes

- **✅ Consistent Create Room Experience**:
  - Unified modal and page functionality with playlist selection
  - Fixed naming inconsistencies (removed Spotify references)
  - Improved empty states and error messages

- **✅ Enhanced Real-time Features**:
  - Live guess feed showing all players' attempts
  - Smart filtering to hide guesses too close to correct answers
  - Real-time participant updates and status changes

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
- `Song` - Track metadata from Deezer
- `SelectedSong` - Player song selections for games
- `Playlist` - Curated song collections

#### API Endpoints
- `/api/rooms` - Room CRUD operations
- `/api/rooms/[code]` - Individual room management
- `/api/rooms/[code]/join` - Join room functionality
- `/api/rooms/[code]/new-game` - Create new game after completion
- `/api/games/[gameId]/start` - Game initialization
- `/api/games/[gameId]/next` - Advance to next song
- `/api/games/[gameId]/guess` - Submit player guesses
- `/api/games/[gameId]/guesses` - Real-time guess polling
- `/api/games/[gameId]/songs` - Get game song summary
- `/api/games/[gameId]/state` - Get current game state
- `/api/spotify/search` - Track search (now uses Deezer)
- `/api/spotify/track/[id]` - Get track details (now uses Deezer)

#### Key Components
- `app/rooms/page.tsx` - Room browser with search and filtering
- `app/room/[code]/page.tsx` - Individual room interface with game flow
- `app/create-room/page.tsx` - Room creation wizard
- `components/Game/TrackSelection.tsx` - Song selection interface
- `components/Game/MusicSearch.tsx` - Deezer search integration
- `components/Game/GamePlay.tsx` - Main gameplay component with real-time features
- `components/Game/GameSongsSummary.tsx` - Post-game song list summary
- `components/Room/CreateRoomModal.tsx` - Unified room creation modal

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
- No real WebSocket implementation (using polling every 2-5s)
- No offline/reconnection handling
- Limited error handling for Deezer API failures
- No mobile-specific optimizations yet

### 🚀 Planned Features
- Real-time WebSocket implementation to replace polling
- Enhanced scoring system with streaks and bonuses
- Game replay functionality and detailed statistics
- Mobile-responsive improvements and PWA features
- Advanced playlist management with categories
- Tournament/bracket modes for competitive play
- Social features (friends, leaderboards, sharing)
- Audio visualization during playback

### 🎯 Immediate Next Steps
1. **WebSocket Integration**: Replace polling with real-time updates
2. **Error Handling**: Improve Deezer API error handling
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
│   ├── deezer.ts          # Deezer API integration
│   └── spotify.ts         # Legacy file (now uses Deezer)
└── prisma/
    └── schema.prisma      # Database schema
```

## Environment Setup

### Required Environment Variables
```env
DATABASE_URL="postgresql://..."
NEXTAUTH_SECRET="..."
NEXTAUTH_URL="http://localhost:3000"
# Spotify credentials no longer needed - using Deezer API
# SPOTIFY_CLIENT_ID="..."
# SPOTIFY_CLIENT_SECRET="..."
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

---

## Current Status: ✅ FULLY FUNCTIONAL

**Game Features Working:**
- ✅ Room creation with individual/playlist modes
- ✅ Player joining and real-time participant updates
- ✅ Track selection with Deezer search (reliable previews)
- ✅ Full gameplay with unlimited guessing
- ✅ Real-time guess feed with smart spoiler protection
- ✅ Round intro/outro modals with song reveals
- ✅ Post-game summary with complete song list
- ✅ Start new game functionality after completion
- ✅ Modern theming with green/teal color scheme

**Technical Status:**
- ✅ ESLint: No errors or warnings
- ✅ TypeScript: Strict compilation passing
- ✅ Build: Production ready
- ✅ API: All endpoints functional
- ✅ Database: Schema up to date

---

**Last Updated**: 2025-09-18
**Claude Code Session**: Complete game functionality implemented - Start New Game working, song summaries added, Deezer migration complete, modern theming applied