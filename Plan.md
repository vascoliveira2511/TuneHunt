# Project Plan: Name That Tune Game (Whatsamusic Clone)

## Core Game Concept

Create a multiplayer name-that-tune party game where:

- Players select songs privately at the start
- 30-second clips play one at a time
- Players guess song titles and artists for points
- Real-time scoring and chat functionality

## Technical Architecture

### Frontend (React/Next.js)

```
src/
├── components/
│   ├── GameRoom/
│   │   ├── GameLobby.tsx
│   │   ├── SongSelection.tsx
│   │   ├── GamePlay.tsx
│   │   ├── Scoreboard.tsx
│   │   └── Chat.tsx
│   ├── Playlists/
│   │   ├── PlaylistBrowser.tsx
│   │   ├── PlaylistCreator.tsx
│   │   └── PlaylistManager.tsx
│   ├── Audio/
│   │   ├── AudioPlayer.tsx
│   │   └── AudioControls.tsx
│   └── UI/
│       ├── ThemeToggle.tsx
│       └── PlayerList.tsx
├── pages/
│   ├── index.tsx (home/lobby)
│   ├── game/[roomId].tsx
│   └── playlists/
└── hooks/
    ├── useSocket.ts
    ├── useAudio.ts
    └── useGame.ts
```

### Backend (Node.js/Express + Socket.IO)

```
server/
├── routes/
│   ├── rooms.js
│   ├── playlists.js
│   └── music.js
├── socket/
│   ├── gameEvents.js
│   └── roomEvents.js
├── services/
│   ├── musicService.js (Spotify/Apple Music API)
│   ├── roomService.js
│   └── playlistService.js
└── models/
    ├── Room.js
    ├── Playlist.js
    └── Player.js
```

## Key Features to Implement

### 1. Room Management

- Create/join rooms with unique codes
- Player limit settings
- Host controls (start game, skip songs, etc.)
- Real-time player list updates

### 2. Music Integration

- Spotify Web API integration for song search and 30-second previews
- Fallback to other music services if needed
- Song metadata handling (title, artist, album, artwork)

### 3. Playlist System

- Official curated playlists
- User-created playlists
- Playlist rating/voting system
- Moderation queue for community playlists
- "As Is" vs "Customizable" playlist types

### 4. Game Mechanics

- Private song selection phase
- 30-second audio clips with countdown timer
- Real-time guess submission
- Scoring system:
  - Title guess: 10 points × seconds remaining
  - Artist guess: 4 points × seconds remaining
  - Song picker gets points for correct guesses

### 5. Chat & Social Features

- Real-time chat during gameplay
- Quick commands (+1 to like, +b to bookmark)
- Safe mode chat filtering
- Song bookmarking system

### 6. UI/UX Features

- Dark/light theme toggle
- Mobile-responsive design
- "Cozy view" chat option
- Audio visualization during playback

## Implementation Phases

### Phase 1: Core Infrastructure

1. Set up Next.js project with TypeScript
2. Implement Socket.IO server and client
3. Create basic room creation/joining
4. Build audio player component
5. Set up database (PostgreSQL/MongoDB)

### Phase 2: Music Integration

1. Integrate Spotify Web API
2. Implement song search functionality
3. Create audio preview system
4. Add music metadata handling

### Phase 3: Game Logic

1. Build song selection interface
2. Implement game state management
3. Create guess submission system
4. Add scoring calculations
5. Build real-time scoreboard

### Phase 4: Playlist System

1. Create playlist CRUD operations
2. Build playlist browser interface
3. Add rating/voting system
4. Implement moderation features

### Phase 5: Social Features

1. Add real-time chat
2. Implement user accounts (Google/Twitch OAuth)
3. Create bookmarking system
4. Add like/rating features

### Phase 6: Polish & Optimization

1. Mobile optimization
2. Theme system
3. Advanced settings
4. Performance optimizations
5. Error handling & edge cases

## Detailed Component Breakdown

### Core Components

#### **Layout Components**

- `Layout.tsx` - Main app wrapper with navigation
- `Navbar.tsx` - Top navigation bar with user menu
- `Sidebar.tsx` - Side navigation (if needed)
- `Footer.tsx` - App footer

#### **Auth Components**

- `LoginModal.tsx` - Login/signup modal
- `AuthButton.tsx` - Login/logout button
- `UserProfile.tsx` - User profile dropdown
- `ProtectedRoute.tsx` - Route protection wrapper

#### **Room Components**

- `CreateRoomModal.tsx` - Modal to create new room
- `JoinRoomModal.tsx` - Modal to join room by code
- `RoomCard.tsx` - Display room information
- `RoomSettings.tsx` - Host room configuration
- `PlayerList.tsx` - List of players in room
- `PlayerCard.tsx` - Individual player display

#### **Game Components**

- `GameLobby.tsx` - Pre-game waiting area
- `GameCountdown.tsx` - 3-2-1 game start countdown
- `SongSelection.tsx` - Private song picking interface
- `SongSearchModal.tsx` - Search and select songs
- `SongCard.tsx` - Display song info with artwork
- `GamePlay.tsx` - Main game interface during play
- `AudioPlayer.tsx` - Audio playback with waveform
- `GuessInput.tsx` - Input for song/artist guesses
- `Timer.tsx` - Countdown timer component
- `Scoreboard.tsx` - Real-time scoring display
- `ScoreCard.tsx` - Individual player score
- `GameResults.tsx` - Final game results screen
- `RoundResults.tsx` - Results after each song

#### **Playlist Components**

- `PlaylistBrowser.tsx` - Browse all playlists
- `PlaylistGrid.tsx` - Grid layout for playlists
- `PlaylistCard.tsx` - Individual playlist preview
- `PlaylistDetails.tsx` - Full playlist view with songs
- `PlaylistCreator.tsx` - Create new playlist interface
- `PlaylistEditor.tsx` - Edit existing playlist
- `SongList.tsx` - List of songs in playlist
- `SongItem.tsx` - Individual song in list
- `PlaylistRating.tsx` - Star rating component

#### **Chat Components**

- `ChatContainer.tsx` - Main chat wrapper
- `ChatMessages.tsx` - Message display area
- `ChatMessage.tsx` - Individual message
- `ChatInput.tsx` - Message input with commands
- `ChatCommands.tsx` - Helper for +1, +b commands
- `EmojiPicker.tsx` - Emoji selection

#### **Audio Components**

- `AudioControls.tsx` - Play/pause/volume controls
- `AudioVisualizer.tsx` - Waveform or spectrum display
- `VolumeSlider.tsx` - Volume control
- `AudioProgress.tsx` - Progress bar for current song

#### **UI Components**

- `Button.tsx` - Reusable button component
- `Input.tsx` - Form input component
- `Modal.tsx` - Generic modal wrapper
- `Dropdown.tsx` - Dropdown menu
- `Tooltip.tsx` - Hover tooltips
- `LoadingSpinner.tsx` - Loading indicator
- `ThemeToggle.tsx` - Dark/light mode switch
- `Toast.tsx` - Notification messages
- `Badge.tsx` - Status badges
- `Card.tsx` - Generic card container
- `Tabs.tsx` - Tab navigation
- `SearchBar.tsx` - Search input with suggestions

## Step-by-Step Implementation Guide

### **STEP 1: Project Setup & Basic Infrastructure** ⏱️ 2-3 days

#### 1.1 Initialize Project

```bash
# Create Next.js project
npx create-next-app@latest name-that-tune --typescript --tailwind --eslint --app

# Install core dependencies
npm install socket.io-client @types/socket.io-client
npm install @headlessui/react @heroicons/react
npm install next-auth
npm install @prisma/client prisma
```

#### 1.2 Create Basic Layout Structure

- Set up `app/layout.tsx` with theme provider
- Create `components/Layout.tsx`
- Build `components/Navbar.tsx` with basic navigation
- Add `components/ThemeToggle.tsx` for dark/light mode

#### 1.3 Set Up Authentication

- Configure NextAuth.js with Google provider
- Create `components/auth/LoginModal.tsx`
- Build `components/auth/AuthButton.tsx`
- Add authentication middleware

#### 1.4 Database Setup

- Set up Prisma schema
- Create initial database migrations
- Set up database connection

**Deliverable**: Basic Next.js app with auth, theming, and database connection

---

### **STEP 2: Room Management System** ⏱️ 3-4 days

#### 2.1 Backend Room API

- Create Express server with Socket.IO
- Build room creation/joining endpoints
- Implement room state management
- Add real-time room updates

#### 2.2 Frontend Room Components

- Create `components/room/CreateRoomModal.tsx`
- Build `components/room/JoinRoomModal.tsx`
- Add `components/room/RoomCard.tsx`
- Create `components/room/PlayerList.tsx`

#### 2.3 Real-time Communication

- Set up Socket.IO client connection
- Implement join/leave room events
- Add real-time player list updates
- Create `hooks/useSocket.ts`

#### 2.4 Room Management Pages

- Build home page with create/join options
- Create dynamic room page `app/room/[code]/page.tsx`
- Add room settings for hosts

**Deliverable**: Working room creation, joining, and basic multiplayer lobby

---

### **STEP 3: Music Integration & Search** ⏱️ 4-5 days

#### 3.1 Spotify API Setup

- Register Spotify app and get credentials
- Create `services/spotifyService.js`
- Implement OAuth flow for Spotify
- Build music search functionality

#### 3.2 Music Components

- Create `components/music/SongSearchModal.tsx`
- Build `components/music/SongCard.tsx`
- Add `components/music/AudioPlayer.tsx`
- Create `hooks/useAudio.ts`

#### 3.3 Audio System

- Implement 30-second preview playback
- Add audio preloading
- Create volume and playback controls
- Handle audio errors gracefully

#### 3.4 Song Database

- Create songs table and models
- Build song caching system
- Add song metadata storage
- Implement search indexing

**Deliverable**: Working music search and audio playback system

---

### **STEP 4: Core Game Logic** ⏱️ 5-6 days

#### 4.1 Game State Management

- Create game state machine
- Build `hooks/useGame.ts`
- Implement game phases (selecting, playing, results)
- Add game timer functionality

#### 4.2 Song Selection Phase

- Create `components/game/SongSelection.tsx`
- Build private song picking interface
- Add selected songs validation
- Implement ready state tracking

#### 4.3 Gameplay Components

- Build `components/game/GamePlay.tsx`
- Create `components/game/GuessInput.tsx`
- Add `components/game/Timer.tsx`
- Build real-time guess submission

#### 4.4 Scoring System

- Implement scoring calculations
- Create `components/game/Scoreboard.tsx`
- Add real-time score updates
- Build end-game results screen

**Deliverable**: Complete game flow from song selection to scoring

---

### **STEP 5: Playlist System** ⏱️ 3-4 days

#### 5.1 Playlist Database & API

- Create playlist models and API endpoints
- Build playlist CRUD operations
- Add playlist-song relationships
- Implement playlist search

#### 5.2 Playlist Components

- Create `components/playlist/PlaylistBrowser.tsx`
- Build `components/playlist/PlaylistCreator.tsx`
- Add `components/playlist/PlaylistCard.tsx`
- Create playlist detail views

#### 5.3 Playlist Features

- Add playlist rating system
- Implement "As Is" vs "Customizable" modes
- Create playlist categories (Official, Community, Personal)
- Add playlist sharing functionality

**Deliverable**: Complete playlist creation and management system

---

### **STEP 6: Chat & Social Features** ⏱️ 2-3 days

#### 6.1 Real-time Chat

- Create `components/chat/ChatContainer.tsx`
- Build `components/chat/ChatMessages.tsx`
- Add `components/chat/ChatInput.tsx`
- Implement chat commands (+1, +b)

#### 6.2 Social Features

- Add song liking system
- Implement bookmarking functionality
- Create user bookmark management
- Add social sharing options

#### 6.3 Chat Moderation

- Implement safe mode filtering
- Add message reporting
- Create chat command shortcuts
- Add emoji support

**Deliverable**: Working chat system with social features

---

### **STEP 7: Mobile Optimization** ⏱️ 2-3 days

#### 7.1 Responsive Design

- Optimize all components for mobile
- Add touch-friendly controls
- Implement swipe gestures
- Create mobile-specific layouts

#### 7.2 Mobile UX Improvements

- Add haptic feedback
- Optimize audio for mobile browsers
- Implement offline handling
- Add progressive web app features

#### 7.3 Performance Optimization

- Add component lazy loading
- Implement audio preloading strategies
- Optimize bundle size
- Add service worker caching

**Deliverable**: Fully mobile-optimized experience

---

### **STEP 8: Advanced Features & Polish** ⏱️ 3-4 days

#### 8.1 Advanced Game Features

- Add spectator mode
- Implement game replays
- Create tournament brackets
- Add custom game modes

#### 8.2 Admin & Moderation

- Build playlist moderation interface
- Add user management system
- Create analytics dashboard
- Implement content filtering

#### 8.3 Polish & Bug Fixes

- Add comprehensive error handling
- Implement loading states
- Add success/error notifications
- Create help and tutorial system

#### 8.4 Testing & Deployment

- Write unit and integration tests
- Set up CI/CD pipeline
- Deploy to production
- Monitor and optimize performance

**Deliverable**: Production-ready application with all features

---

## Component Library & UI Framework

### **Recommended: Shadcn/ui + Radix UI** ⭐

```bash
npx shadcn-ui@latest init
npx shadcn-ui@latest add button input card modal dialog toast
npx shadcn-ui@latest add dropdown-menu tabs badge avatar
npx shadcn-ui@latest add slider progress separator
```

**Why Shadcn/ui:**

- ✅ Modern, clean aesthetic out of the box
- ✅ Fully customizable with Tailwind CSS
- ✅ Built on Radix UI (excellent accessibility)
- ✅ Copy-paste components (no bloated dependencies)
- ✅ Perfect for "modern but simple" design
- ✅ Dark mode support built-in

### **Alternative Options:**

#### **Option 2: Headless UI + Custom Design**

```bash
npm install @headlessui/react @heroicons/react
```

- More work but complete design control
- Great for unique branding
- Excellent accessibility

#### **Option 3: Mantine**

```bash
npm install @mantine/core @mantine/hooks @mantine/form
```

- Rich component library
- Built-in theming system
- Good for rapid development

#### **Option 4: Chakra UI**

```bash
npm install @chakra-ui/react @emotion/react @emotion/styled
```

- Simple, modular components
- Great developer experience
- Good default styling

## Design Aesthetic Guidelines

### **Modern but Simple Approach**

- **Clean Typography**: Inter or Geist font families
- **Subtle Shadows**: Minimal drop shadows, focus on elevation
- **Rounded Corners**: 8px-12px border radius for modern feel
- **Generous Whitespace**: Breathing room between elements
- **Muted Color Palette**: Grays, subtle accents, avoid bright colors
- **Glassmorphism**: Subtle backdrop blur effects for modals
- **Micro-interactions**: Smooth hover states and transitions

### **Color Palette Suggestion**

```css
/* Light Mode */
--background: 255 255 255;
--foreground: 15 23 42;
--card: 255 255 255;
--card-foreground: 15 23 42;
--primary: 79 70 229; /* Indigo */
--primary-foreground: 255 255 255;
--secondary: 241 245 249;
--secondary-foreground: 15 23 42;
--muted: 248 250 252;
--muted-foreground: 100 116 139;
--accent: 241 245 249;
--accent-foreground: 15 23 42;
--destructive: 239 68 68;
--destructive-foreground: 255 255 255;

/* Dark Mode */
--background: 8 8 11;
--foreground: 250 250 250;
--card: 24 24 27;
--card-foreground: 250 250 250;
--primary: 99 102 241;
--primary-foreground: 15 23 42;
--secondary: 39 39 42;
--secondary-foreground: 161 161 170;
--muted: 39 39 42;
--muted-foreground: 113 113 122;
--accent: 39 39 42;
--accent-foreground: 250 250 250;
```

### **Component Styling Examples**

#### **Cards**

```tsx
<Card className="bg-card border-none shadow-sm hover:shadow-md transition-shadow">
  <CardHeader className="pb-3">
    <CardTitle className="text-lg font-medium">Room Code: ABC123</CardTitle>
  </CardHeader>
  <CardContent>
    <p className="text-muted-foreground text-sm">4/8 players</p>
  </CardContent>
</Card>
```

#### **Buttons**

```tsx
<Button
  className="bg-primary hover:bg-primary/90 transition-colors rounded-lg"
  size="lg"
>
  Join Game
</Button>

<Button
  variant="ghost"
  className="hover:bg-secondary transition-colors"
>
  Cancel
</Button>
```

#### **Input Fields**

```tsx
<Input
  placeholder="Enter room code..."
  className="border-input bg-background rounded-lg focus:ring-2 focus:ring-primary/20"
/>
```

### **Layout Principles**

- **Grid System**: CSS Grid for main layout, Flexbox for components
- **Mobile-First**: Design for mobile, enhance for desktop
- **Consistent Spacing**: Use Tailwind's spacing scale (4px increments)
- **Typography Scale**: Clear hierarchy with 5-6 text sizes max
- **Loading States**: Skeleton components and smooth transitions

## Technology Stack Recommendations

- **Frontend**: Next.js 14, TypeScript, Tailwind CSS, Shadcn/ui
- **Component Library**: Shadcn/ui + Radix UI primitives
- **Styling**: Tailwind CSS with custom design tokens
- **Icons**: Lucide React (clean, consistent icon set)
- **Backend**: Node.js, Express, Socket.IO, PostgreSQL
- **Authentication**: NextAuth.js with Google/Twitch providers
- **Music API**: Spotify Web API (primary), Apple Music API (fallback)
- **Deployment**: Vercel (frontend), Railway/Render (backend)
- **Database**: Supabase or Neon (managed PostgreSQL)

## Database Schema Outline

```sql
-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE,
  display_name VARCHAR(100),
  provider VARCHAR(50), -- 'google', 'twitch'
  provider_id VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Rooms table
CREATE TABLE rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(10) UNIQUE NOT NULL,
  host_id UUID REFERENCES users(id),
  name VARCHAR(100),
  max_players INTEGER DEFAULT 8,
  status VARCHAR(20) DEFAULT 'waiting', -- 'waiting', 'selecting', 'playing', 'finished'
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Playlists table
CREATE TABLE playlists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(200) NOT NULL,
  description TEXT,
  created_by UUID REFERENCES users(id),
  is_official BOOLEAN DEFAULT false,
  is_published BOOLEAN DEFAULT false,
  status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
  play_as_is BOOLEAN DEFAULT false,
  rating DECIMAL(3,2) DEFAULT 0,
  rating_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Songs table
CREATE TABLE songs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  spotify_id VARCHAR(255) UNIQUE,
  title VARCHAR(300) NOT NULL,
  artist VARCHAR(300) NOT NULL,
  album VARCHAR(300),
  preview_url VARCHAR(500),
  image_url VARCHAR(500),
  duration_ms INTEGER,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Playlist songs junction table
CREATE TABLE playlist_songs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  playlist_id UUID REFERENCES playlists(id) ON DELETE CASCADE,
  song_id UUID REFERENCES songs(id) ON DELETE CASCADE,
  position INTEGER,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Games table
CREATE TABLE games (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID REFERENCES rooms(id) ON DELETE CASCADE,
  playlist_id UUID REFERENCES playlists(id),
  current_song_index INTEGER DEFAULT 0,
  current_song_id UUID REFERENCES songs(id),
  status VARCHAR(20) DEFAULT 'selecting', -- 'selecting', 'playing', 'finished'
  started_at TIMESTAMP,
  finished_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Game participants table
CREATE TABLE game_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id UUID REFERENCES games(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id),
  display_name VARCHAR(100),
  score INTEGER DEFAULT 0,
  songs_selected INTEGER DEFAULT 0,
  joined_at TIMESTAMP DEFAULT NOW()
);

-- Selected songs table (songs chosen by players for the game)
CREATE TABLE game_selected_songs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id UUID REFERENCES games(id) ON DELETE CASCADE,
  song_id UUID REFERENCES songs(id),
  selected_by UUID REFERENCES users(id),
  play_order INTEGER,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Guesses table
CREATE TABLE guesses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id UUID REFERENCES games(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id),
  song_id UUID REFERENCES songs(id),
  guess_type VARCHAR(10), -- 'title', 'artist'
  guess_text VARCHAR(300),
  is_correct BOOLEAN,
  points_awarded INTEGER DEFAULT 0,
  seconds_remaining INTEGER,
  created_at TIMESTAMP DEFAULT NOW()
);

-- User bookmarks
CREATE TABLE user_bookmarks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  song_id UUID REFERENCES songs(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, song_id)
);

-- Playlist ratings
CREATE TABLE playlist_ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  playlist_id UUID REFERENCES playlists(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(playlist_id, user_id)
);
```

## Environment Variables Needed

```env
# Spotify API
SPOTIFY_CLIENT_ID=your_spotify_client_id
SPOTIFY_CLIENT_SECRET=your_spotify_client_secret

# Authentication
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_nextauth_secret

# OAuth Providers
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
TWITCH_CLIENT_ID=your_twitch_client_id
TWITCH_CLIENT_SECRET=your_twitch_client_secret

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/name_that_tune

# Redis (for session management)
REDIS_URL=redis://localhost:6379

# Server
PORT=3001
NODE_ENV=development
```

## API Endpoints

### Game Management

- `POST /api/rooms` - Create a new room
- `GET /api/rooms/:code` - Join room by code
- `PUT /api/rooms/:id` - Update room settings
- `DELETE /api/rooms/:id` - Delete room

### Music & Playlists

- `GET /api/music/search` - Search for songs
- `GET /api/playlists` - Get playlists (official, community, user)
- `POST /api/playlists` - Create new playlist
- `PUT /api/playlists/:id` - Update playlist
- `POST /api/playlists/:id/rate` - Rate a playlist

### User Management

- `GET /api/user/profile` - Get user profile
- `GET /api/user/bookmarks` - Get user bookmarks
- `POST /api/user/bookmarks` - Bookmark a song
- `DELETE /api/user/bookmarks/:songId` - Remove bookmark

## Socket.IO Events

### Room Events

- `join-room` - Player joins room
- `leave-room` - Player leaves room
- `room-updated` - Room state changed
- `player-joined` - New player notification
- `player-left` - Player left notification

### Game Events

- `game-started` - Game begins
- `song-selection-phase` - Players select songs
- `song-selected` - Player selected a song
- `song-playing` - New song starts playing
- `guess-submitted` - Player makes a guess
- `round-ended` - Song round finished
- `game-ended` - Game completed
- `scores-updated` - Score changes

### Chat Events

- `chat-message` - New chat message
- `song-liked` - Player likes current song
- `song-bookmarked` - Player bookmarks song

## Game Flow Logic

1. **Room Creation**: Host creates room, gets shareable code
2. **Player Joining**: Players join via code, see lobby
3. **Playlist Selection**: Host chooses playlist
4. **Song Selection**: Each player privately picks songs
5. **Game Start**: Songs play in random/set order
6. **Guessing Phase**: 30-second clips with real-time guessing
7. **Scoring**: Points awarded based on speed and accuracy
8. **Results**: Final scores and replay option

## Mobile Considerations

- Touch-friendly guess input
- Responsive audio controls
- Optimized chat interface
- Gesture support for common actions
- Offline handling for network issues

## Security & Moderation

- Rate limiting on API endpoints
- Input validation and sanitization
- Playlist content moderation
- Chat filtering and reporting
- User authentication and authorization
- CORS configuration for frontend domains

## Performance Optimizations

- Audio preloading and caching
- Real-time data compression
- Database query optimization
- CDN for static assets
- Connection pooling
- Graceful degradation for slow connections

This comprehensive plan provides Claude Code with everything needed to build a feature-complete name-that-tune game. Start with Phase 1 and build incrementally!
