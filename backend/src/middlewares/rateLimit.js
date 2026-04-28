// src/middlewares/rateLimit.js
// Redis-backed rate limiter middleware for general API endpoints

import redisClient from '../config/redis.js';
import { sendError } from '../utils/helpers.js';

/**
 * Creates a Redis-backed rate limiter middleware.
 * @param {Object} options
 * @param {number} options.max - Maximum requests per window
 * @param {number} options.windowSecs - Window size in seconds
 * @param {string} [options.keyPrefix] - Redis key prefix
 */
export function createRateLimiter({ max = 100, windowSecs = 900, keyPrefix = 'api' }) {     //<------ Factory 
  // In development, skip rate limiting entirely
  if (process.env.NODE_ENV === 'development') {
    return (_req, _res, next) => next();
  }

  return async (req, res, next) => {
    try {
      const identifier = req.user?._id?.toString() || req.ip;
      const key = `ratelimit:${keyPrefix}:${identifier}`;

      const pipeline = redisClient.pipeline();
      pipeline.incr(key);
      pipeline.ttl(key);
      const results = await pipeline.exec();

      const count = results[0][1];
      const ttl = results[1][1];

      // Set TTL only on first request
      if (ttl < 0) {
        await redisClient.expire(key, windowSecs);
      }

      res.setHeader('X-RateLimit-Limit', max);
      res.setHeader('X-RateLimit-Remaining', Math.max(0, max - count));
      res.setHeader('X-RateLimit-Reset', Math.ceil(Date.now() / 1000) + (ttl > 0 ? ttl : windowSecs));

      if (count > max) {
        return sendError(res, 'Too many requests, please slow down', 429);
      }

      return next();
    } catch (err) {
      // Fail open — don't block requests if Redis is down
      console.error('[RateLimit] Redis error, failing open:', err.message);
      return next();
    }
  };
}

export default createRateLimiter;
