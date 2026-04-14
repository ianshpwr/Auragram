// src/config/db.js
// MongoDB connection (retry + backoff + reconnect + graceful shutdown)

import mongoose from 'mongoose';
import env from './env.js';

const MAX_RETRIES = 5;
const BASE_DELAY_MS = 3000;

// Validate env
if (!env.MONGO_URI) {
  throw new Error('MONGO_URI is not defined in environment variables');
}

async function connectDB() {
  let attempt = 1;

  while (attempt <= MAX_RETRIES) {
    try {
      await mongoose.connect(env.MONGO_URI, {
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
      });

      console.log('[DB] MongoDB connected successfully');
      return;

    } catch (err) {
      const delay = BASE_DELAY_MS * Math.pow(2, attempt - 1);

      if (attempt === MAX_RETRIES) {
        console.error(`[DB] Failed after ${MAX_RETRIES} attempts:`, err.message);
        process.exit(1);
      }

      console.warn(`[DB] Attempt ${attempt} failed. Retrying in ${delay}ms...`);
      await new Promise(res => setTimeout(res, delay));
      attempt++;
    }
  }
}

/* ---------------- Connection Events ---------------- */

mongoose.connection.on('connected', () => {
  console.log('[DB] Connected');
});

mongoose.connection.on('reconnected', () => {
  console.log('[DB] Reconnected');
});

mongoose.connection.on('disconnected', async () => {
  console.warn('[DB] Disconnected. Attempting reconnect...');
  await connectDB();
});

mongoose.connection.on('error', (err) => {
  console.error('[DB] Error:', err.message);
});

/* ---------------- Graceful Shutdown ---------------- */

['SIGINT', 'SIGTERM', 'SIGQUIT'].forEach(signal => {
  process.on(signal, async () => {
    try {
      await mongoose.connection.close();
      console.log(`[DB] Connection closed due to ${signal}`);
      process.exit(0);
    } catch (err) {
      console.error('[DB] Error during shutdown:', err.message);
      process.exit(1);
    }
  });
});


export default connectDB;
