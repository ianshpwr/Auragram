// server.js — AuraGram Backend Entry Point

import 'dotenv/config';
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';

import env, { validateEnv } from './src/config/env.js';
import connectDB from './src/config/db.js';
import { initSocket } from './src/socket/socketManager.js';
import { startWorker } from './src/workers/auraWorker.js';
import { errorHandler } from './src/middlewares/errorHandler.js';
import { createRateLimiter } from './src/middlewares/rateLimit.js';

// Routes
import authRoutes from './src/routes/auth.js';
import usersRoutes from './src/routes/users.js';
import postsRoutes from './src/routes/posts.js';
import leaderboardRoutes from './src/routes/leaderboard.js';
import eventsRoutes from './src/routes/events.js';
import feedRoutes from './src/routes/feed.js';

// ──────────────────────────────────────────────────────────────
// Validate environment
// ──────────────────────────────────────────────────────────────
validateEnv();

// ──────────────────────────────────────────────────────────────
// App Setup
// ──────────────────────────────────────────────────────────────
const app = express();
const httpServer = createServer(app);

// Parse allowed origins from env — supports comma-separated list.
// The Vercel production URL is always included regardless of what CLIENT_ORIGIN is set to,
// so no manual Render dashboard change is required.
const VERCEL_ORIGIN = 'https://auragram-nu.vercel.app';

const allowedOrigins = [
  ...env.CLIENT_ORIGIN.split(',').map((o) => o.trim()).filter(Boolean),
  VERCEL_ORIGIN,
].filter((v, i, a) => a.indexOf(v) === i); // dedupe

const corsOriginFn = (origin, callback) => {
  // Allow requests with no origin (server-to-server, curl, health checks)
  if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
  // Return a proper 403 — not a thrown error — to avoid 500 responses
  callback(null, false);
};

// Socket.io
const io = new Server(httpServer, {
  cors: {
    origin: corsOriginFn,
    methods: ['GET', 'POST'],
    credentials: true,
  },
  transports: ['websocket', 'polling'],
});

initSocket(io);

// ──────────────────────────────────────────────────────────────
// Middleware
// ──────────────────────────────────────────────────────────────
app.use(helmet({
  contentSecurityPolicy: false, // Allow dev flexibility
}));

app.use(cors({
  origin: corsOriginFn,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

if (env.NODE_ENV !== 'test') {
  app.use(morgan(env.NODE_ENV === 'development' ? 'dev' : 'combined'));
}

// Global rate limiter: 300 req/15min per IP
app.use('/api', createRateLimiter({ max: 300, windowSecs: 900, keyPrefix: 'global' }));

// ──────────────────────────────────────────────────────────────
// Routes
// ──────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/posts', postsRoutes);
app.use('/api/leaderboard', leaderboardRoutes);
app.use('/api/events', eventsRoutes);
app.use('/api/feed', feedRoutes);

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, error: 'Route not found' });
});

// Centralized error handler
app.use(errorHandler);

// ──────────────────────────────────────────────────────────────
// Start Server
// ──────────────────────────────────────────────────────────────
async function start() {
  try {
    await connectDB();

    const PORT = process.env.PORT || 5001;
    httpServer.listen(PORT, () => {
      console.log(`[Server] AuraGram API running on port ${PORT} (${env.NODE_ENV})`);
    });

    // Start BullMQ worker + scheduled jobs
    startWorker();
  } catch (err) {
    console.error('[Server] Failed to start:', err.message);
    process.exit(1);
  }
}

start();

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('[Server] SIGTERM received, shutting down gracefully...');
  httpServer.close(() => {
    console.log('[Server] HTTP server closed');
    process.exit(0);
  });
});

export { app, io };
