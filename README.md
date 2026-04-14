# AuraGram

AuraGram is a full-stack social platform with a gamified reputation system ("Aura").  
Users create and engage with posts, and each interaction is converted into an event that updates user score, tier, and leaderboard position.

The project is designed to demonstrate practical system design in a production-style stack:
- clean module boundaries
- asynchronous event processing
- realtime updates
- caching and ranking
- security and abuse protection

---

## What You Have Built

You built an event-driven social application where:
- users register, authenticate, and maintain sessions using JWT + refresh flow
- users create posts and interact through likes, comments, shares, bookmarks, and reports
- interactions generate immutable events
- events are processed asynchronously by a worker to compute Aura score changes
- score changes update user tiers and Redis leaderboards
- clients receive live updates via Socket.IO

Core outcomes:
- low-latency API responses for write-heavy actions (enqueue now, process async)
- deterministic score logic with audit trail
- scalable read paths for leaderboard via Redis ZSET
- realtime UX for score and leaderboard movement

---

## Tech Stack

### Frontend
- React 18 (`frontend/src`)
- Vite (`frontend/vite.config.js`)
- Redux Toolkit + React Redux (`frontend/src/store`)
- React Router v6 (`frontend/src/App.jsx`)
- Axios with refresh interceptor (`frontend/src/api/axiosInstance.js`)
- Socket.IO client (`frontend/src/context/SocketContext.jsx`)
- Tailwind CSS (`frontend/tailwind.config.js`)

### Backend
- Node.js + Express (`backend/server.js`)
- MongoDB + Mongoose (`backend/src/models`, `backend/src/config/db.js`)
- Redis + ioredis (`backend/src/config/redis.js`)
- BullMQ worker queue (`backend/src/config/queue.js`, `backend/src/workers/auraWorker.js`)
- Socket.IO server (`backend/src/socket/socketManager.js`)
- JWT auth + refresh tokens (`backend/src/controllers/authController.js`, `backend/src/middlewares/auth.js`)
- express-validator (`backend/src/routes/*.js`)
- Helmet, CORS, Morgan, cookie-parser (`backend/server.js`)
- node-cron for scheduled jobs (`backend/src/workers/auraWorker.js`)

### DevOps / Environment
- Docker Compose with Mongo + Redis + app service (`docker-compose.yml`)
- Environment validation (`backend/src/config/env.js`)
- Seed script (`backend/src/seed.js`)

---

## System Design Used (and Where)

This section is the clearest explanation of how system design appears in your codebase.

### 1) Layered Modular Monolith
You split request handling from business logic and persistence.

- Transport/API layer: `backend/src/routes`
- Orchestration layer: `backend/src/controllers`
- Domain/service logic: `backend/src/services`
- Data layer: `backend/src/models`
- Cross-cutting concerns: `backend/src/middlewares`

Why it matters:
- easier maintenance and testing
- lower coupling between HTTP concerns and core logic
- feature-level scalability in one deployable service

### 2) Event-Driven Async Processing
Interactions do not directly run heavy scoring logic in the request thread.

Flow:
- `POST /api/events` in `backend/src/controllers/eventsController.js`
- event persistence + queue enqueue in `backend/src/services/eventService.js`
- async job processing in `backend/src/workers/auraWorker.js`
- score computation and side effects in `backend/src/services/auraEngine.js`

Why it matters:
- faster API responses (`202 Accepted`)
- absorbs bursts through queue buffering
- supports retry/backoff for reliability

### 3) Realtime Publish/Subscribe
Sockets are used for personal and shared channels.

- socket auth + room management: `backend/src/socket/socketManager.js`
- client subscription and Redux updates: `frontend/src/context/SocketContext.jsx`

Room model:
- `user:{userId}` for personal score/tier notifications
- `leaderboard-updates` for broadcast leaderboard updates

Why it matters:
- instant UX without polling
- targeted emits reduce unnecessary traffic

### 4) Cache + Ranking Strategy
Redis is used for fast leaderboard and cached reads.

- leaderboard read/hydration: `backend/src/services/leaderboardService.js`
- leaderboard writes during processing: `backend/src/services/auraEngine.js`
- cache-aside for user profile: `backend/src/controllers/authController.js` (`getMe`)

Why it matters:
- avoids expensive repeated DB ranking queries
- predictable low-latency read path

### 5) Consistency + Auditability
Aura processing uses transaction-like behavior with persistent logs.

- transactional score update path: `backend/src/services/auraEngine.js`
- immutable event model: `backend/src/models/Event.js`
- score audit trail: `backend/src/models/AuraLog.js`

Why it matters:
- traceability of score changes
- reduced risk of partial write anomalies

### 6) Security and Abuse Controls
- JWT access + refresh token rotation: `backend/src/controllers/authController.js`
- protected routes + optional auth: `backend/src/middlewares/auth.js`
- input validation: `backend/src/routes/*.js`
- rate limiting middleware: `backend/src/middlewares/rateLimit.js`
- abuse heuristics: `backend/src/services/abuseGuard.js`
- hardening middleware: `backend/server.js` (helmet, cors)

Why it matters:
- protects integrity of score system
- prevents event farming/spam abuse

---

## High-Level Architecture

```text
React Client
  ├─ REST calls (/api/*)
  └─ Socket.IO connection
       ↓
Express API Server
  ├─ Auth / Users / Posts / Feed / Events / Leaderboard routes
  ├─ Controllers + Services
  ├─ MongoDB models
  ├─ Redis cache + leaderboard ZSET
  └─ BullMQ enqueue
       ↓
BullMQ Worker
  ├─ Process event
  ├─ Update MongoDB (User/Event/AuraLog)
  ├─ Update Redis leaderboard
  └─ Emit Socket updates
```

---

## Project Structure

```text
Auragram/
├── backend/
│   ├── server.js
│   └── src/
│       ├── config/        # env, db, redis, queue
│       ├── controllers/   # request orchestration
│       ├── middlewares/   # auth, rate-limit, error handling
│       ├── models/        # User, Post, Event, AuraLog
│       ├── routes/        # API route modules
│       ├── services/      # business/domain logic
│       ├── socket/        # socket lifecycle and emit helpers
│       ├── utils/         # constants, tier mapping, helpers
│       ├── workers/       # BullMQ worker + cron jobs
│       └── seed.js
├── frontend/
│   └── src/
│       ├── api/           # axios instance + endpoint clients
│       ├── components/    # reusable UI
│       ├── context/       # socket + notification providers
│       ├── hooks/         # feature hooks
│       ├── pages/         # routed pages
│       ├── store/         # Redux slices
│       └── utils/
├── docker-compose.yml
└── README.md
```

---

## Data Flow (End-to-End)

### A) Authentication
1. Frontend calls `/api/auth/login` or `/api/auth/register`.
2. Backend validates payload and credentials.
3. Backend issues access + refresh JWT, stores refresh token on user, sets cookies.
4. Frontend stores user/access token in Redux (`authSlice`).
5. Axios interceptor attempts `/api/auth/refresh` on eligible 401 responses.

### B) Engagement to Aura Update
1. User performs action (like/comment/share/etc).
2. Frontend posts event to `/api/events`.
3. Backend validates + abuse-checks, stores `Event`, enqueues BullMQ job.
4. Worker consumes event and executes `processEvent`.
5. Aura engine computes delta, updates `User`, writes `AuraLog`, marks `Event.processed=true`.
6. Redis leaderboard is updated.
7. Socket emits `aura_update` / `tier_change`.
8. Frontend receives event and updates UI state in Redux.

### C) Leaderboard Read
1. Frontend requests `/api/leaderboard/global` or category route.
2. Backend reads Redis ZSET top-N.
3. Service hydrates entries with Mongo user metadata.
4. Response returns ranked rows to frontend.

---

## Data Models

### `User` (`backend/src/models/User.js`)
- identity: `username`, `email`, `passwordHash`
- score and status: `auraScore`, `tier`, `category`
- history: `scoreHistory`, `lastActiveAt`
- auth/session: `refreshToken`
- moderation/abuse: `isBanned`, `banExpiresAt`, `eventCount`, `eventWindowStart`

### `Post` (`backend/src/models/Post.js`)
- `authorId`, `content`, `category`
- score context: `auraImpact`, `qualityScore`
- engagement counters: likes/comments/shares/bookmarks
- moderation: `isDeleted`

### `Event` (`backend/src/models/Event.js`)
- immutable action record: actor, target, post, type, weight, processed, metadata

### `AuraLog` (`backend/src/models/AuraLog.js`)
- append-only score audit: `delta`, `reason`, `scoreBefore`, `scoreAfter`, `eventId`, timestamp

Relationships:
- `User 1 -> many Post`
- `User 1 -> many Event (actor)`
- `User 0..1 <- many Event (target)`
- `Event 1 -> 0..1 AuraLog reference`

---

## API Surface (Major Routes)

### Auth (`/api/auth`)
- `POST /register`
- `POST /login`
- `POST /logout` (auth)
- `POST /refresh`
- `GET /me` (auth)

### Users (`/api/users`)
- `GET /:id`
- `GET /:id/posts`
- `GET /:id/aura-log` (auth)
- `PATCH /me` (auth)

### Posts (`/api/posts`)
- `GET /`
- `GET /:id`
- `GET /:id/comments`
- `POST /` (auth)
- `DELETE /:id` (auth)
- `POST /:id/like` (auth)
- `POST /:id/comment` (auth)
- `POST /:id/share` (auth)
- `POST /:id/bookmark` (auth)
- `POST /:id/report` (auth)

### Feed (`/api/feed`)
- `GET /` (optional auth)

### Events (`/api/events`)
- `POST /` (auth, validates event type and IDs)

### Leaderboard (`/api/leaderboard`)
- `GET /global`
- `GET /category/:cat`
- `GET /me/rank` (auth)

Health:
- `GET /health`

---

## Frontend State Management

Redux Toolkit store in `frontend/src/store/index.js`:
- `authSlice`: auth session + user profile + score/tier live updates
- `feedSlice`: feed items + pagination cursor
- `leaderboardSlice`: global/category/rank state
- `uiSlice`: notifications, toasts, panel state

Realtime integration:
- `SocketProvider` listens to backend events and dispatches Redux actions.

---

## Error Handling and Reliability

- request validation at route layer (`express-validator`)
- centralized error middleware (`backend/src/middlewares/errorHandler.js`)
- global API rate limiting (`backend/server.js`)
- abuse throttling and soft-ban logic (`backend/src/services/abuseGuard.js`)
- BullMQ retries with exponential backoff (`backend/src/config/queue.js`)
- DB/Redis reconnect behavior (`backend/src/config/db.js`, `backend/src/config/redis.js`)
- graceful shutdown hooks (`backend/server.js`)

---

## Scheduled Jobs

Defined in `backend/src/workers/auraWorker.js`:
- daily decay job (2:00 UTC) to penalize inactivity
- leaderboard sync every 5 minutes with socket broadcast

---

## Environment Variables

Required by `backend/src/config/env.js`:
- `MONGO_URI`
- `REDIS_URL`
- `JWT_SECRET`
- `JWT_REFRESH_SECRET`

Common optional variables:
- `NODE_ENV`
- `PORT`
- `JWT_ACCESS_EXPIRES_IN`
- `JWT_REFRESH_EXPIRES_IN`
- `CLIENT_ORIGIN`

---

## Run the Project

## 1) Local development (without Docker)

Backend:
```bash
cd backend
npm install
npm run dev
```

Frontend:
```bash
cd frontend
npm install
npm run dev
```

Prerequisites:
- MongoDB running on `mongodb://localhost:27017/auragram`
- Redis running on `redis://localhost:6379`

## 2) Docker Compose

```bash
docker compose up --build
```

This starts:
- MongoDB (`27017`)
- Redis (`6379`)
- backend app (`5000` in compose config)

---

## Known Notes / Design Caveats

- `backend/server.js` currently defaults to port `5001` when `PORT` is not set, while `env.js` default is `5000`; keep this aligned per environment.
- `frontend/vite.config.js` proxies `/api` to `5001` but `/socket.io` to `5000`; verify intended backend port mapping in local/dev.
- Queue + worker are in the same backend runtime; future scaling can split worker to separate process/container.
- No formal test suite is currently documented at root.

---

## Why This Project Is a Good System Design Showcase

This project demonstrates practical system design beyond CRUD:
- event-driven architecture for write-heavy actions
- asynchronous computation for low user-facing latency
- realtime push for UX freshness
- Redis-backed ranking and cache strategy
- security + abuse prevention built into the request lifecycle
- clean boundaries that support future decomposition into services

If you need to defend this in a technical review, the strongest storyline is:
"We modeled social engagement as immutable events, processed those events asynchronously for scalability, persisted an auditable score history, and synchronized realtime client state via sockets while keeping reads fast through Redis leaderboards."

