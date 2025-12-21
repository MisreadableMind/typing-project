# TapTapTap - Multiplayer Typing Race

Increase typing accuracy and speed competing with other players.

## Features

- **No Signup Required** - Just enter a username and start racing
- **Real-time Multiplayer** - Race against other players with live progress tracking
- **Multiple Difficulty Levels** - Easy, Medium, Hard texts
- **AI Text Generation** - Generate new texts using OpenAI (optional)
- **Live Statistics** - WPM, accuracy, and rankings

## Tech Stack

### Backend
- NestJS 10
- TypeORM + PostgreSQL
- Socket.io for real-time communication
- JWT authentication
- OpenAI integration

### Frontend
- React 18 + TypeScript
- Vite
- Tailwind CSS
- Zustand for state management
- Socket.io client

## Quick Start

### Prerequisites
- Node.js 18+
- Docker & Docker Compose (for database)

### 1. Start the Database

```bash
docker-compose up db -d
```

### 2. Setup Backend

```bash
cd backend
npm install
cp .env.example .env  # Edit with your settings
npm run start:dev
```

Backend runs at http://localhost:3000
API docs at http://localhost:3000/api/docs

### 3. Setup Frontend

```bash
cd ui
npm install
npm run dev
```

Frontend runs at http://localhost:5173

## Full Docker Setup

Run everything with Docker:

```bash
docker-compose up --build
```

- Frontend: http://localhost:5173
- Backend: http://localhost:3000
- Database: localhost:5533

## Environment Variables

### Backend (.env)

```env
# Database
DB_HOST=localhost
DB_PORT=5533
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_DATABASE=taptaptap

# JWT
JWT_SECRET=your-secret-key

# OpenAI (optional)
OPENAI_API_KEY=sk-...
```

## API Endpoints

### Auth
- `POST /api/auth/login` - Login with username
- `GET /api/auth/me` - Get current user

### Texts
- `GET /api/texts` - List all texts
- `GET /api/texts/random` - Get random text
- `POST /api/texts/generate` - Generate text with AI

### Sessions
- `POST /api/sessions` - Start typing session
- `PUT /api/sessions/:id/complete` - Complete session
- `GET /api/sessions/stats` - Get user stats

### Races
- `GET /api/races` - List active races
- WebSocket `/races` - Real-time race events

## WebSocket Events

### Client -> Server
- `findRace` - Find or create a race
- `ready` - Mark as ready
- `progress` - Update typing progress
- `finish` - Complete the race
- `leaveRace` - Leave current race

### Server -> Client
- `raceState` - Race state update
- `countdown` - Countdown timer
- `raceStart` - Race started
- `playerProgress` - Other player's progress
- `playerFinished` - Player finished
- `raceComplete` - Race completed

## Project Structure

```
typing-project/
├── backend/
│   ├── src/
│   │   ├── auth/          # Authentication
│   │   ├── users/         # User management
│   │   ├── texts/         # Text library + OpenAI
│   │   ├── sessions/      # Typing sessions
│   │   ├── races/         # Multiplayer races
│   │   ├── database/      # Entities
│   │   └── common/        # Guards, decorators
│   └── package.json
├── ui/
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── pages/         # Page components
│   │   ├── hooks/         # Custom hooks
│   │   ├── store/         # Zustand stores
│   │   ├── api/           # API client
│   │   └── types/         # TypeScript types
│   └── package.json
└── docker-compose.yml
```

## License

MIT
