# TapTapTap.me - Development Roadmap

## Executive Summary

This document outlines two approaches for completing the typing practice application:
1. **Continue with existing codebase** - Build upon current React/NestJS foundation
2. **Fresh start** - Rebuild with modern stack and clean architecture

---

## Current State Assessment

### What Exists
| Component | Status | Notes |
|-----------|--------|-------|
| Basic typing UI | ✅ Working | Composer component with real-time feedback |
| Character matching | ✅ Working | Correct/incorrect highlighting |
| Progress bar | ✅ Working | Visual progress tracking |
| User auth (basic) | ⚠️ Partial | Login exists but password = username |
| Backend structure | ⚠️ Repurposed | NestJS exists but adapted from different project |
| Database schema | ⚠️ Minimal | Basic tables, not typing-specific |
| Multiplayer | ❌ Missing | Not implemented |
| Statistics | ❌ Missing | No WPM, accuracy history |
| Text library | ❌ Missing | Hardcoded texts only |
| LLM training | ❌ Missing | Dependencies exist, not integrated |

### Technical Debt
- Backend is repurposed from another project (has Sentry config for "suppilot")
- No typing-specific API endpoints
- No WebSocket infrastructure for real-time multiplayer
- Mixed dependencies (some unused)

---

## Option A: Continue with Existing Codebase

### Phase 1: Foundation (Core Infrastructure)

#### 1.1 Database Schema Design
```sql
-- Core entities needed
users, texts, typing_sessions, user_statistics,
competitions, competition_participants, leaderboards
```

**Tasks:**
- [ ] Design complete database schema for typing app
- [ ] Create TypeORM entities
- [ ] Set up migrations
- [ ] Seed initial text library

#### 1.2 Backend API Cleanup
- [ ] Remove unused dependencies (metascraper, cheerio, pdf-parse, etc.)
- [ ] Create typing-specific modules:
  - `texts/` - Text library management
  - `sessions/` - Typing session tracking
  - `stats/` - Statistics and analytics
  - `competitions/` - Multiplayer logic
- [ ] Implement proper JWT authentication
- [ ] Add input validation (class-validator)

#### 1.3 Frontend State Management
- [ ] Add proper state management (Zustand or Redux Toolkit)
- [ ] Create API client layer
- [ ] Implement proper auth flow with token refresh

---

### Phase 2: Core Features

#### 2.1 Text Library System
**Backend:**
- [ ] CRUD API for texts (`GET/POST/PUT/DELETE /api/texts`)
- [ ] Categories/tags for texts
- [ ] Difficulty scoring algorithm
- [ ] Random text selection endpoint

**Frontend:**
- [ ] Text selection UI
- [ ] Category/difficulty filters
- [ ] Search functionality

#### 2.2 Typing Session & Statistics
**Backend:**
- [ ] Session creation/completion endpoints
- [ ] Real-time WPM calculation
- [ ] Accuracy tracking
- [ ] Mistake pattern analysis
- [ ] Historical statistics storage

**Frontend:**
- [ ] Post-session results screen
- [ ] WPM/accuracy display during typing
- [ ] Statistics dashboard
- [ ] Progress charts (daily/weekly/monthly)

#### 2.3 User Profile & Settings
**Backend:**
- [ ] User profile CRUD
- [ ] Settings storage (theme, sound, etc.)
- [ ] Avatar upload

**Frontend:**
- [ ] Profile page
- [ ] Settings panel
- [ ] Theme switcher (already have light/dark tokens)

---

### Phase 3: Multiplayer & Competition

#### 3.1 Real-time Infrastructure
- [ ] Set up WebSocket gateway (NestJS Gateway)
- [ ] Implement room management
- [ ] Real-time position sync

#### 3.2 Competition System
**Backend:**
- [ ] Competition creation/joining
- [ ] Matchmaking logic
- [ ] Real-time progress broadcasting
- [ ] Result calculation and ranking

**Frontend:**
- [ ] Competition lobby
- [ ] Real-time opponent progress display
- [ ] Countdown/start synchronization
- [ ] Results/ranking screen

#### 3.3 Leaderboards
- [ ] Global leaderboard
- [ ] Daily/weekly/all-time rankings
- [ ] Friend leaderboards

---

### Phase 4: AI-Powered Training

#### 4.1 Mistake Analysis
- [ ] Track character-level mistakes
- [ ] Identify problem patterns (specific keys, combinations)
- [ ] Store mistake history

#### 4.2 LLM Text Generation
- [ ] Integrate OpenAI API for text generation
- [ ] Generate texts targeting weak areas
- [ ] Create practice modes for specific improvements

#### 4.3 Smart Recommendations
- [ ] Suggest practice based on weakness analysis
- [ ] Adaptive difficulty
- [ ] Personalized training plans

---

### Phase 5: Polish & Launch

#### 5.1 UX Improvements
- [ ] Sound effects (keystroke, errors, completion)
- [ ] Animations and micro-interactions
- [ ] Mobile responsive design
- [ ] Keyboard shortcuts

#### 5.2 Social Features
- [ ] Friend system
- [ ] Share results
- [ ] Achievements/badges

#### 5.3 Production Readiness
- [ ] Performance optimization
- [ ] Error tracking (Sentry)
- [ ] Analytics
- [ ] SEO optimization
- [ ] Documentation

---

## Option B: Fresh Start (Recommended)

### Why Consider Starting Fresh?

1. **Cleaner architecture** - Purpose-built for typing app
2. **Modern stack** - Latest versions, better DX
3. **No technical debt** - No repurposed code
4. **Faster long-term** - Easier to maintain and extend

### Recommended New Stack

#### Frontend
```
- Next.js 14 (App Router) or Vite + React 18
- TypeScript 5
- Tailwind CSS (faster development than styled-components)
- Zustand (lightweight state management)
- Socket.io-client (real-time)
- TanStack Query (data fetching)
```

#### Backend
```
- NestJS 10 (latest) OR Hono/Fastify (lighter)
- TypeScript 5
- Drizzle ORM (type-safe, fast) OR Prisma
- PostgreSQL
- Socket.io (real-time)
- Redis (caching, pub/sub for multiplayer)
```

#### Infrastructure
```
- Docker + Docker Compose
- GitHub Actions (CI/CD)
- Vercel (frontend) + Railway/Render (backend)
- Cloudflare (CDN, DDoS protection)
```

---

### Fresh Start Roadmap

#### Sprint 1: Project Setup & Auth
- [ ] Initialize monorepo (Turborepo or npm workspaces)
- [ ] Set up frontend with Vite/Next.js
- [ ] Set up NestJS backend
- [ ] Database schema design
- [ ] User authentication (JWT + refresh tokens)
- [ ] Basic UI components (design system)

#### Sprint 2: Core Typing Experience
- [ ] Typing composer component
- [ ] Real-time character matching
- [ ] WPM/accuracy calculation
- [ ] Progress tracking
- [ ] Session results screen
- [ ] Text library API + UI

#### Sprint 3: User Features
- [ ] User dashboard
- [ ] Statistics tracking
- [ ] Progress history
- [ ] Profile management
- [ ] Settings (theme, sounds)

#### Sprint 4: Multiplayer Foundation
- [ ] WebSocket infrastructure
- [ ] Room management
- [ ] Real-time position sync
- [ ] Basic 1v1 competition
- [ ] Competition results

#### Sprint 5: Advanced Competition
- [ ] Matchmaking system
- [ ] Multiple competition modes
- [ ] Leaderboards
- [ ] Ranking system

#### Sprint 6: AI Training
- [ ] Mistake pattern analysis
- [ ] OpenAI integration
- [ ] Custom text generation
- [ ] Practice recommendations

#### Sprint 7: Polish & Launch
- [ ] Mobile optimization
- [ ] Performance tuning
- [ ] Sound effects
- [ ] Achievements
- [ ] Social sharing
- [ ] Production deployment

---

## Feature Specification Details

### Typing Composer Requirements

```typescript
interface TypingSession {
  textId: string;
  startTime: Date;
  endTime?: Date;
  typed: string;
  mistakes: Mistake[];
  wpm: number;
  accuracy: number;
  rawWpm: number; // without error penalty
}

interface Mistake {
  position: number;
  expected: string;
  actual: string;
  timestamp: Date;
}
```

**Calculations:**
- **WPM**: `(correctCharacters / 5) / minutes`
- **Raw WPM**: `(totalCharacters / 5) / minutes`
- **Accuracy**: `(correctCharacters / totalCharacters) * 100`

### Competition Modes

1. **Race Mode** - First to finish wins
2. **Time Attack** - Most words in X seconds
3. **Accuracy Mode** - Highest accuracy wins (min WPM threshold)
4. **Marathon** - Longest session without stopping

### API Endpoints (Core)

```
Authentication:
POST   /api/auth/register
POST   /api/auth/login
POST   /api/auth/refresh
POST   /api/auth/logout

Texts:
GET    /api/texts              # List texts (paginated, filtered)
GET    /api/texts/:id          # Get single text
GET    /api/texts/random       # Get random text by difficulty
POST   /api/texts              # Admin: create text

Sessions:
POST   /api/sessions           # Start session
PUT    /api/sessions/:id       # Update session (submit result)
GET    /api/sessions           # Get user's session history

Statistics:
GET    /api/stats/me           # Current user stats
GET    /api/stats/me/history   # Historical data for charts
GET    /api/stats/leaderboard  # Global leaderboard

Competitions:
POST   /api/competitions       # Create/join competition
GET    /api/competitions/:id   # Get competition state
WS     /competitions           # Real-time competition events

Users:
GET    /api/users/me           # Current user profile
PUT    /api/users/me           # Update profile
GET    /api/users/:id          # Public profile
```

### Database Schema (Simplified)

```sql
-- Users
CREATE TABLE users (
  id UUID PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  username VARCHAR(50) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  avatar_url VARCHAR(500),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Texts
CREATE TABLE texts (
  id UUID PRIMARY KEY,
  content TEXT NOT NULL,
  title VARCHAR(255),
  source VARCHAR(255),
  difficulty VARCHAR(20), -- easy, medium, hard
  category VARCHAR(50),
  word_count INT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Typing Sessions
CREATE TABLE typing_sessions (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  text_id UUID REFERENCES texts(id),
  started_at TIMESTAMP NOT NULL,
  completed_at TIMESTAMP,
  wpm DECIMAL(6,2),
  raw_wpm DECIMAL(6,2),
  accuracy DECIMAL(5,2),
  mistakes_count INT,
  mistakes_data JSONB, -- detailed mistake info
  created_at TIMESTAMP DEFAULT NOW()
);

-- User Statistics (aggregated)
CREATE TABLE user_statistics (
  id UUID PRIMARY KEY,
  user_id UUID UNIQUE REFERENCES users(id),
  total_sessions INT DEFAULT 0,
  total_words_typed INT DEFAULT 0,
  total_time_seconds INT DEFAULT 0,
  average_wpm DECIMAL(6,2),
  best_wpm DECIMAL(6,2),
  average_accuracy DECIMAL(5,2),
  current_streak INT DEFAULT 0,
  longest_streak INT DEFAULT 0,
  last_session_at TIMESTAMP,
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Competitions
CREATE TABLE competitions (
  id UUID PRIMARY KEY,
  text_id UUID REFERENCES texts(id),
  mode VARCHAR(20), -- race, time_attack, accuracy
  status VARCHAR(20), -- waiting, in_progress, completed
  max_participants INT DEFAULT 2,
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Competition Participants
CREATE TABLE competition_participants (
  id UUID PRIMARY KEY,
  competition_id UUID REFERENCES competitions(id),
  user_id UUID REFERENCES users(id),
  progress INT DEFAULT 0, -- characters typed
  wpm DECIMAL(6,2),
  accuracy DECIMAL(5,2),
  finished_at TIMESTAMP,
  rank INT,
  UNIQUE(competition_id, user_id)
);

-- Leaderboard (materialized view or table)
CREATE TABLE leaderboard (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  period VARCHAR(20), -- daily, weekly, monthly, all_time
  wpm DECIMAL(6,2),
  accuracy DECIMAL(5,2),
  sessions_count INT,
  rank INT,
  updated_at TIMESTAMP DEFAULT NOW()
);
```

---

## Recommendation

**Go with Option B (Fresh Start)** if:
- You have time to invest upfront
- You want a maintainable, scalable codebase
- The current backend doesn't have significant business logic to preserve

**Continue with Option A** if:
- You need to ship quickly
- The current typing UI meets your needs
- You're comfortable refactoring incrementally

---

## Immediate Next Steps

1. **Decide: Option A or B?**
2. If A: Start with Phase 1.1 (Database Schema)
3. If B: Initialize new monorepo structure
4. Either way: Define MVP scope (what's the minimum for first release?)

---

## MVP Definition (Suggested)

For initial launch, focus on:
- [x] Typing practice with real-time feedback
- [ ] User registration/login (proper auth)
- [ ] 20+ texts in library (various difficulties)
- [ ] Session statistics (WPM, accuracy)
- [ ] Personal statistics dashboard
- [ ] Basic leaderboard

Save for v2:
- Multiplayer competitions
- AI-powered training
- Social features
- Achievements

---

## Questions to Answer

1. What's the target launch date?
2. Is multiplayer essential for MVP or v2?
3. Will this be monetized? (affects infrastructure decisions)
4. Do you need mobile app or web-only?
5. What's the expected user scale?

---

*Last updated: December 2024*
