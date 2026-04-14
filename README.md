# AuraGram

AuraGram is a full-stack, realtime social media platform built around an interactive "Aura" scoring system. Every engagement—likes, comments, shares, etc.—impacts a user's Aura score, which is calculated in real-time by a robust background engine.

With features like dynamic tier assignments, abuse-guard algorithms, score decay for inactive users, and live leaderboard updates, AuraGram is designed to encourage high-quality interactions and reward active participation.

---

## Key Features

*   **Dynamic Aura Engine**: Centralized scoring system that evaluates user actions with configurable event weights and quality multipliers.
*   **Real-time Updates**: Live score changes, tier updates, and leaderboard rankings powered by Socket.io.
*   **Abuse Guard**: Built-in mechanisms to block spam, self-likes, duplicate actions, and high-velocity engagement anomalies.
*   **Tier System**: Users are grouped into tiers based on their Aura score, reflected visually on their profiles with dynamic, animated badges.
*   **Score Decay**: Nightly automated jobs that smoothly decay scores for users inactive for over 7 days.
*   **Background Processing**: High-performance, asynchronous event queue using **BullMQ** and **Redis**.
*   **Robust Security**: Rate limiting, Helmet, JWT authentication with silent refresh token rotation, and robust CORS policies.

---

## Technology Stack

### Backend
*   **Runtime & Framework**: Node.js, Express.js
*   **Database**: MongoDB (Mongoose)
*   **Caching & Queues**: Redis (ioredis), BullMQ
*   **Realtime Communication**: Socket.io
*   **Security & Auth**: bcryptjs, jsonwebtoken, express-rate-limit, helmet, cors
*   **Task Scheduling**: node-cron

### Frontend
*   **Framework**: React 18, Vite
*   **State Management**: Redux Toolkit, React Context (Socket & Notifications)
*   **Styling & UI**: Tailwind CSS, PostCSS
*   **Animations**: GSAP (GreenSock Animation Platform)
*   **Network & Routing**: Axios, React Router v6

### Infrastructure
*   **Containerization**: Docker, Docker Compose

---

## Project Structure

```text
Auragram/
├── backend/                  # Express API, WebSocket, and Background Workers
│   ├── src/
│   │   ├── config/           # Database, Redis, Queue, and Environment config
│   │   ├── controllers/      # API Controllers
│   │   ├── middlewares/      # Authentication, Error Handling, Rate Limiting
│   │   ├── models/           # Mongoose Data Models (User, Post, Event, AuraLog)
│   │   ├── routes/           # Express Routers
│   │   ├── services/         # Core Business Logic (AuraEngine, AbuseGuard, Leaderboard)
│   │   ├── socket/           # Socket.io connection managers
│   │   ├── utils/            # Helpers and Constants
│   │   └── workers/          # BullMQ worker process handling Aura events
│   ├── Dockerfile
│   ├── package.json
│   └── server.js             # Main backend entry point
│
├── frontend/                 # React Application
│   ├── src/
│   │   ├── api/              # Axios instance and API calls
│   │   ├── components/       # Reusable UI components (Navbar, ScoreWidget, Badges)
│   │   ├── context/          # React Contexts (Socket, Notifications)
│   │   ├── hooks/            # Custom React Hooks
│   │   ├── pages/            # View Pages (Home, Profile, Leaderboard, PostPage, etc.)
│   │   ├── store/            # Redux Slices
│   │   ├── utils/            # Frontend Utilities
│   │   ├── App.jsx           # Root application component
│   │   └── main.jsx          # Frontend entry point
│   ├── package.json
│   ├── tailwind.config.js
│   └── vite.config.js
│
└── docker-compose.yml        # Docker composition for MongoDB, Redis, and Backend
```

---

## Getting Started

### Prerequisites

Ensure you have the following installed on your local machine:
*   [Node.js](https://nodejs.org/) (v20 or higher recommended)
*   [Docker Desktop](https://www.docker.com/products/docker-desktop/) (for local MongoDB and Redis)
*   [Git](https://git-scm.com/)

### 1. Clone the repository

```bash
git clone <repository_url>
cd Auragram
```

### 2. Environment Variables

Create exactly duplicate environment configurations.

**Backend `.env`:**
Navigate to the `backend` folder, duplicate `.env.example` to `.env`, and provide the missing secrets.
```bash
cd backend
cp .env.example .env
```
_Ensure you set a strong `JWT_SECRET` and `JWT_REFRESH_SECRET`._

### 3. Using Docker Compose (Quickest Method)

To bring up MongoDB, Redis, and the Backend API simultaneously:
```bash
# In the root Auragram directory
docker-compose up --build -d
```
_This will start Mongo on port `27017`, Redis on port `6379`, and the Backend server on port `5000`._

### 4. Running the Frontend Locally

With the backend running, start the Vite dev server for the frontend workspace:
```bash
cd frontend
npm install
npm run dev
```
_The frontend will typically run at `http://localhost:5173/`._

### 5. Seeding the Database (Optional)
If you want to generate mock users, posts, and aura events to test the interface out of the box:
```bash
cd backend
npm run seed
```

---

## Architecture Design Highlights

### The Aura Event Pipeline
When a user takes an action (e.g., likes a post):
1.  **Frontend** immediately updates the UI optimistically and triggers a REST API request to `/api/events/ingest`.
2.  **API Route** runs quick checks and queues the event securely using **BullMQ** (via Redis).
3.  **Abuse Guard** evaluates the queue request to reject rapid repeated actions or suspicious activity.
4.  **Aura Worker** asynchronously calculates the score variation based on event type, post quality, and platform weighting.
5.  **Database Commit**: Event model, Aura log model, and User profiles persist the transaction cleanly.
6.  **Socket.io Broadcast**: Realtime event notification gets fired down to the frontend user to trigger animations and ranking updates.

---

## Scripts

*   `backend/npm run start`: Starts the application in production mode.
*   `backend/npm run dev`: Starts the application logic using nodemon for hot-reloading.
*   `backend/npm run seed`: Clears the DB and seeds heavily populated test data.
*   `frontend/npm run dev`: Starts UI using Vite Server.
*   `frontend/npm run build`: Bundles the React application for production.
*   `rebuild.sh / rebuild_fixed.sh`: Bash tools dedicated to atomic commits rewriting Git history for the project scaffold.

---
_AuraGram was built to power rich, immersive, and competitive social networking._

Team Members:
Ansh Pawar, 
Niharika Choudhary, 
Gauri Mehrotra, 
Kush Puri, 
Aadit Vachher