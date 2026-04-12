// src/services/auraEngine.js
// Core aura score computation engine — deterministic math only
//
// This module handles all aura score calculations and updates. It applies
// event-based deltas, quality multipliers for engagement, and time-based decay.
// All operations are transactional and logged for audit purposes.

import mongoose from 'mongoose';
import User from '../models/User.js';
import Post from '../models/Post.js';
import AuraLog from '../models/AuraLog.js';
import Event from '../models/Event.js';
import redisClient from '../config/redis.js';
import { assignTier } from '../utils/tierMap.js';
import { EVENT_WEIGHTS } from '../utils/constants.js';
import { emitToUser } from '../socket/socketManager.js';

/**
 * Compute a quality multiplier based on post engagement totals.
 * Posts with more engagement (likes, comments, shares) receive higher multipliers
 * to incentivize creation of valuable community content.
 * 
 * @param {Object} post - Mongoose Post document
 * @returns {number} - Multiplier between 1.0 and 2.0
 */
function qualityMultiplier(post) {
  const base =
    (post.engagements?.likes || 0) * 0.4 +
    (post.engagements?.comments || 0) * 0.8 +
    (post.engagements?.shares || 0) * 1.2;
  if (base > 100) return 2.0;
  if (base > 50) return 1.5;
  if (base > 20) return 1.2;
  return 1.0;
}

/**
 * Apply time-based score decay for inactive users.
 * Users who don't engage with the platform lose aura points gradually
 * to encourage consistent participation and keep the leaderboard dynamic.
 * 
 * @param {Object} user - Mongoose User document
 * @returns {number} - Decayed score
 */
export function decayScore(user) {
  if (!user.lastActiveAt) return user.auraScore;
  const days = Math.floor((Date.now() - new Date(user.lastActiveAt).getTime()) / 86400000);
  if (days <= 7) return user.auraScore;
  return Math.max(0, Math.floor(user.auraScore * Math.pow(0.98, days - 7)));
}

/**
 * Main event processing function.
 * Called by the BullMQ worker for each queued event.
 * Handles transactional updates to ensure data consistency and logs all changes.
 * 
 * @param {Object} eventDoc - Mongoose Event document
 */
export async function processEvent(eventDoc) {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Step 1: Get base weight
    let delta = EVENT_WEIGHTS[eventDoc.type] ?? 0;

    // Step 2: If post_created, apply quality multiplier
    if (eventDoc.type === 'post_created' && eventDoc.postId) {
      const post = await Post.findById(eventDoc.postId).session(session);
      if (post) {
        delta = Math.round(delta * qualityMultiplier(post));
      }
    }

    // Step 3: Anti-farming check — same actor→target, same action, >3 times in last hour
    if (delta > 0 && eventDoc.actorId && eventDoc.targetUserId) {
      const oneHourAgo = new Date(Date.now() - 3600000);
      const recentCount = await Event.countDocuments({
        actorId: eventDoc.actorId,
        targetUserId: eventDoc.targetUserId,
        type: eventDoc.type,
        createdAt: { $gte: oneHourAgo },
        _id: { $ne: eventDoc._id },
        processed: true,
      }).session(session);

      if (recentCount >= 3) {
        delta = 0; // Anti-farming: zero out the delta
      }
    }

    // Step 4: Atomically update user score + lastActiveAt + scoreHistory
    const targetUserId = eventDoc.targetUserId || eventDoc.actorId;
    const userBefore = await User.findById(targetUserId).session(session);

    if (!userBefore) {
      await session.abortTransaction();
      console.warn(`[AuraEngine] Target user not found: ${targetUserId}`);
      return;
    }

    const scoreBefore = userBefore.auraScore;
    const newScore = Math.max(0, scoreBefore + delta);

    const updatedUser = await User.findByIdAndUpdate(
      targetUserId,
      {
        $inc: { auraScore: delta },
        $set: { lastActiveAt: new Date() },
        $push: {
          scoreHistory: {
            $each: [{ score: newScore, timestamp: new Date() }],
            $slice: -30,
          },
        },
      },
      { new: true, session }
    );

    // Step 5: Reassign tier, emit tier_change if changed
    const newTier = assignTier(Math.max(0, newScore));
    if (newTier !== userBefore.tier) {
      await User.findByIdAndUpdate(targetUserId, { $set: { tier: newTier } }, { session });
      try {
        emitToUser(targetUserId.toString(), 'tier_change', {
          userId: targetUserId.toString(),
          oldTier: userBefore.tier,
          newTier,
          newScore: Math.max(0, newScore),
        });
      } catch (socketErr) {
        console.warn('[AuraEngine] Socket emit failed (non-fatal):', socketErr.message);
      }
    }

    // Emit aura_update event
    try {
      emitToUser(targetUserId.toString(), 'aura_update', {
        userId: targetUserId.toString(),
        delta,
        newScore: Math.max(0, newScore),
        tier: newTier,
        reason: eventDoc.type,
      });
    } catch (socketErr) {
      console.warn('[AuraEngine] Socket emit failed (non-fatal):', socketErr.message);
    }

    // Step 6: Update Redis leaderboards using pipeline
    const finalScore = Math.max(0, newScore);
    const pipeline = redisClient.pipeline();
    pipeline.zadd('leaderboard:global', finalScore, targetUserId.toString());
    if (updatedUser?.category) {
      pipeline.zadd(`leaderboard:${updatedUser.category}`, finalScore, targetUserId.toString());
    }
    if (userBefore.category && userBefore.category !== updatedUser?.category) {
      pipeline.zaddBuffer(`leaderboard:${userBefore.category}`, finalScore, targetUserId.toString());
    }
    await pipeline.exec();

    // Step 7: Write AuraLog
    await AuraLog.create(
      [
        {
          userId: targetUserId,
          delta,
          reason: eventDoc.type,
          eventId: eventDoc._id,
          scoreBefore,
          scoreAfter: finalScore,
          timestamp: new Date(),
        },
      ],
      { session }
    );

    // Step 8: Mark event as processed
    await Event.findByIdAndUpdate(eventDoc._id, { $set: { processed: true } }, { session });

    await session.commitTransaction();
    console.log(`[AuraEngine] Processed event ${eventDoc._id} (${eventDoc.type}), delta: ${delta}`);
  } catch (err) {
    await session.abortTransaction();
    console.error('[AuraEngine] Transaction failed:', err.message);
    throw err; // Re-throw so BullMQ retries
  } finally {
    session.endSession();
  }
}

export default { processEvent, decayScore };
