// src/services/abuseGuard.js
// Anti-abuse detection and prevention system
//
// Implements multi-layered abuse prevention:
// - Self-engagement detection: prevents users from artificially boosting their own score
// - Velocity anomaly detection: catches bot-like behavior with high-frequency events
// - Rate limiting: enforces per-action limits to prevent spam
// - Automatic soft-banning: temporarily suspends suspicious accounts
// - Development bypass: disables checks in development for testing

import redisClient from '../config/redis.js';
import Event from '../models/Event.js';
import User from '../models/User.js';
import { RATE_LIMITS, RATE_LIMIT_WINDOW, VELOCITY_LIMIT, BAN_DURATION } from '../utils/constants.js';

/**
 * Run all abuse checks for an incoming event.
 * Implements defense-in-depth approach with multiple validation layers.
 * All checks are performed in sequence; first failure aborts the action.
 * 
 * @param {Object} params - Abuse check parameters
 * @param {string} params.actorId - The user performing the action
 * @param {string} params.targetUserId - The user being acted upon
 * @param {string} params.action - The event type for rate limit lookup
 * @returns {Promise<{ allowed: boolean, reason: string }>} - Check result with reason
 */
export async function checkAbuse({ actorId, targetUserId, action }) {
  // In development, skip all abuse checks
  if (process.env.NODE_ENV === 'development') {
    return { allowed: true, reason: 'dev_bypass' };
  }

  // 1. Self-engagement check
  if (actorId && targetUserId && actorId.toString() === targetUserId.toString()) {
    return { allowed: false, reason: 'self_action' };
  }

  const actorIdStr = actorId.toString();

  // 2. Velocity anomaly check — >200 events per hour → soft ban
  const velocityKey = `session:${actorIdStr}:events`;
  const eventCount = await redisClient.incr(velocityKey);

  if (eventCount === 1) {
    await redisClient.expire(velocityKey, RATE_LIMIT_WINDOW);
  }

  if (eventCount > VELOCITY_LIMIT) {
    // Soft ban the user
    try {
      await User.findByIdAndUpdate(actorId, {
        $set: {
          isBanned: true,
          banExpiresAt: new Date(Date.now() + BAN_DURATION * 1000),
        },
      });
    } catch (err) {
      console.error('[AbuseGuard] Failed to ban user:', err.message);
    }
    return { allowed: false, reason: 'velocity_anomaly' };
  }

  // 3. Action-specific rate limit check
  const limit = RATE_LIMITS[action];
  if (limit !== undefined) {
    const rateLimitKey = `ratelimit:${actorIdStr}:${action}`;
    const pipeline = redisClient.pipeline();
    pipeline.incr(rateLimitKey);
    pipeline.ttl(rateLimitKey);
    const results = await pipeline.exec();

    const count = results[0][1];
    const ttl = results[1][1];

    if (ttl < 0) {
      await redisClient.expire(rateLimitKey, RATE_LIMIT_WINDOW);
    }

    if (count > limit) {
      return { allowed: false, reason: `rate_limit_exceeded:${action}` };
    }
  }

  // 4. Duplicate prevention for follows and bookmarks
  if (action === 'profile_followed' || action === 'post_bookmarked') {
    const filter = {
      actorId,
      type: action,
      processed: true,
    };

    if (action === 'profile_followed' && targetUserId) {
      filter.targetUserId = targetUserId;
    }

    const existingEvent = await Event.findOne(filter).lean();
    if (existingEvent) {
      return { allowed: false, reason: `duplicate:${action}` };
    }
  }

  return { allowed: true, reason: 'ok' };
}

export default { checkAbuse };