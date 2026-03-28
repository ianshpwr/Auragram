// src/services/leaderboardService.js
// Leaderboard queries from Redis ZSET with MongoDB hydration

import redisClient from '../config/redis.js';
import User from '../models/User.js';
import { CACHE_TTL } from '../utils/constants.js';

/**
 * Get top N users from global leaderboard.
 * @param {number} limit - Max users to return (default 100)
 * @returns {Promise<Array>}
 */
export async function getGlobal(limit = 100) {
  const cacheKey = 'cache:leaderboard:global:top100';

  try {
    const cached = await redisClient.get(cacheKey);
    if (cached) return JSON.parse(cached);
  } catch {
    // Cache miss — continue
  }

  const entries = await redisClient.zrevrange('leaderboard:global', 0, limit - 1, 'WITHSCORES');
  const result = await hydrateLeaderboard(entries);

  try {
    await redisClient.setex(cacheKey, CACHE_TTL.LEADERBOARD, JSON.stringify(result));
  } catch {
    // Non-fatal
  }

  return result;
}

/**
 * Get top N users from a category leaderboard.
 * @param {string} category
 * @param {number} limit
 * @returns {Promise<Array>}
 */
export async function getByCategory(category, limit = 100) {
  const entries = await redisClient.zrevrange(`leaderboard:${category}`, 0, limit - 1, 'WITHSCORES');
  return hydrateLeaderboard(entries);
}

/**
 * Get a user's rank in the global leaderboard.
 * @param {string} userId
 * @returns {Promise<number|null>} - 1-based rank or null if not ranked
 */
export async function getUserRank(userId) {
  const rank = await redisClient.zrevrank('leaderboard:global', userId.toString());
  return rank !== null ? rank + 1 : null;
}

/**
 * Hydrate leaderboard entries (userId + score pairs from Redis ZSET) with user data.
 * @param {string[]} entries - Flat array [userId, score, userId, score, ...]
 * @returns {Promise<Array>}
 */
async function hydrateLeaderboard(entries) {
  if (!entries || entries.length === 0) return [];

  const users = [];
  for (let i = 0; i < entries.length; i += 2) {
    users.push({ userId: entries[i], score: parseFloat(entries[i + 1]) });
  }

  const userIds = users.map((u) => u.userId);
  const userDocs = await User.find({ _id: { $in: userIds } })
    .select('username tier category auraScore scoreHistory')
    .lean();

  const userMap = new Map(userDocs.map((u) => [u._id.toString(), u]));

  return users.map((entry, index) => {
    const user = userMap.get(entry.userId);
    return {
      rank: index + 1,
      userId: entry.userId,
      username: user?.username || '[deleted]',
      tier: user?.tier || 'Dormant',
      category: user?.category,
      auraScore: entry.score,
      // Compute 24h delta from scoreHistory
      delta24h: compute24hDelta(user?.scoreHistory),
    };
  });
}

/**
 * Compute 24-hour score delta from scoreHistory array.
 * @param {Array} scoreHistory
 * @returns {number}
 */
function compute24hDelta(scoreHistory) {
  if (!scoreHistory || scoreHistory.length === 0) return 0;
  const dayAgo = new Date(Date.now() - 86400000);
  const recent = scoreHistory.filter((h) => new Date(h.timestamp) >= dayAgo);
  if (recent.length === 0) return 0;
  const oldest = recent[0].score;
  const newest = scoreHistory[scoreHistory.length - 1].score;
  return newest - oldest;
}

export default { getGlobal, getByCategory, getUserRank };
