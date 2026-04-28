// src/config/redis.js
// ioredis client with connection error handling

import Redis from 'ioredis';
import env from './env.js';

const redisConfig = {
  maxRetriesPerRequest: null, // required for BullMQ
  enableReadyCheck: false,
  retryStrategy(times) {
    if (times > 10) {
      console.error('[Redis] Max retries reached. Giving up.');
      return null;
    }
    const delay = Math.min(times * 200, 3000);
    console.warn(`[Redis] Retrying connection in ${delay}ms (attempt ${times})`);
    return delay;
  },
};

let redisClient;

function createRedisClient() {
  const client = new Redis(env.REDIS_URL, redisConfig);

  client.on('connect', () => console.log('[Redis] Connected'));
  client.on('ready', () => console.log('[Redis] Ready'));
  client.on('error', (err) => console.error('[Redis] Error:', err.message));
  client.on('close', () => console.warn('[Redis] Connection closed'));

  return client;
}

// Singleton client
redisClient = createRedisClient();              // <---- singleton 

// Export connection config for BullMQ (separate connection)
export const bullMQConnection = {
  host: new URL(env.REDIS_URL).hostname,
  port: parseInt(new URL(env.REDIS_URL).port || '6379', 10),
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
};

export { redisConfig };
export default redisClient;
