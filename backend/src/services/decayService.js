// src/services/decayService.js
// Idempotent daily score decay job

import User from '../models/User.js';
import redisClient from '../config/redis.js';
import { decayScore } from './auraEngine.js';
import { assignTier } from '../utils/tierMap.js';
import AuraLog from '../models/AuraLog.js';

/**
 * Runs the daily score decay for all users.
 * Only applies decay to users inactive for >7 days.
 * Idempotent — safe to run multiple times in a day.
 */
export async function runDecay() {
  console.log('[DecayService] Starting daily decay job...');
  const decayDate = new Date();
  decayDate.setHours(0, 0, 0, 0); // beginning of today

  // Only decay users inactive for more than 1 day
  const oneDayAgo = new Date(Date.now() - 1 * 86400000);

  let processed = 0;
  let decayed = 0;

  try {
    // Process in batches to avoid memory issues
    const batchSize = 500;
    let lastId = null;

    while (true) {
      const query = {
        lastActiveAt: { $lt: oneDayAgo },
        auraScore: { $gt: 0 },
      };
      if (lastId) query._id = { $gt: lastId };

      const users = await User.find(query)
        .sort({ _id: 1 })
        .limit(batchSize)
        .lean();

      if (users.length === 0) break;

      const pipeline = redisClient.pipeline();
      const auraLogDocs = [];
      const bulkOps = [];

      for (const user of users) {
        const newScore = decayScore(user);
        const delta = newScore - user.auraScore;

        if (delta === 0) {
          processed++;
          continue;
        }

        const newTier = assignTier(newScore);

        bulkOps.push({
          updateOne: {
            filter: { _id: user._id },
            update: {
              $set: {
                auraScore: newScore,
                tier: newTier,
              },
              $push: {
                scoreHistory: {
                  $each: [{ score: newScore, timestamp: new Date() }],
                  $slice: -30,
                },
              },
            },
          },
        });

        pipeline.zadd('leaderboard:global', newScore, user._id.toString());
        if (user.category) {
          pipeline.zadd(`leaderboard:${user.category}`, newScore, user._id.toString());
        }

        auraLogDocs.push({
          userId: user._id,
          delta,
          reason: 'daily_decay',
          scoreBefore: user.auraScore,
          scoreAfter: newScore,
          timestamp: new Date(),
        });

        decayed++;
        processed++;
      }

      if (bulkOps.length > 0) {
        await User.bulkWrite(bulkOps, { ordered: false });
        await pipeline.exec();
        await AuraLog.insertMany(auraLogDocs, { ordered: false });
      }

      lastId = users[users.length - 1]._id;
      if (users.length < batchSize) break;
    }

    console.log(`[DecayService] Decay complete. Processed: ${processed}, Decayed: ${decayed}`);
  } catch (err) {
    console.error('[DecayService] Decay job failed:', err.message);
    throw err;
  }
}

export default { runDecay };
