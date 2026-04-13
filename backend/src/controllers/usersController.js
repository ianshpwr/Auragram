// src/controllers/usersController.js
// User management and profile endpoints
//
// Handles all user-related operations including:
// - Profile retrieval with rank and aura score
// - User post history with cursor pagination
// - Profile updates with cache invalidation
// - Aura score transaction logs for user insights
// - Implements caching strategies for frequently accessed profiles

import { validationResult } from 'express-validator';
import User from '../models/User.js';
import Post from '../models/Post.js';
import AuraLog from '../models/AuraLog.js';
import redisClient from '../config/redis.js';
import { sanitizeUser, sendSuccess, sendError, buildCursorQuery, encodeCursor } from '../utils/helpers.js';
import { getUserRank } from '../services/leaderboardService.js';

/**
 * Get user profile by ID with global rank.
 * Retrieves full user data with caching to reduce database load.
 * Includes global leaderboard rank for competitive context.
 */
export async function getUserById(req, res, next) {
  try {
    const { id } = req.params;
    const cacheKey = `cache:user:${id}`;

    const cached = await redisClient.get(cacheKey);
    if (cached) return sendSuccess(res, JSON.parse(cached));

    const user = await User.findById(id).select('-passwordHash -refreshToken');
    if (!user) return sendError(res, 'User not found', 404);

    const rank = await getUserRank(id);
    const userData = { ...sanitizeUser(user), globalRank: rank };

    await redisClient.setex(cacheKey, 300, JSON.stringify(userData));
    sendSuccess(res, userData);
  } catch (err) {
    next(err);
  }
}

export async function getUserPosts(req, res, next) {
  try {
    // Retrieve user's posts with cursor-based pagination
    // Excludes deleted posts and sorts by creation date (newest first)
    const { cursor, limit } = req.query;
    const { id } = req.params;
    const { query, limit: parsedLimit } = buildCursorQuery(cursor, limit);

    const posts = await Post.find({
      authorId: id,
      isDeleted: false,
      ...query,
    })
      .sort({ _id: -1 })
      .limit(parsedLimit + 1)
      .populate('authorId', 'username tier auraScore')
      .lean();

    const hasMore = posts.length > parsedLimit;
    const items = hasMore ? posts.slice(0, -1) : posts;
    const nextCursor = hasMore ? encodeCursor(items[items.length - 1]._id) : null;

    sendSuccess(res, { posts: items, nextCursor, hasMore });
  } catch (err) {
    next(err);
  }
}

export async function updateMe(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

    // Allow authenticated user to update their profile info
    // Currently supports username and category changes
    const { username, category } = req.body;
    const updates = {};
    if (username) updates.username = username;
    if (category) updates.category = category;

    const user = await User.findByIdAndUpdate(req.user._id, { $set: updates }, { new: true, runValidators: true });

    // Invalidate cache
    await redisClient.del(`cache:user:${req.user._id}`);

    sendSuccess(res, sanitizeUser(user));
  } catch (err) {
    next(err);
  }
}

export async function getUserAuraLog(req, res, next) {
  try {
    const { id } = req.params;
    const { cursor, limit } = req.query;
    const { query, limit: parsedLimit } = buildCursorQuery(cursor, limit);

    const logs = await AuraLog.find({
      userId: id,
      ...(query._id ? { _id: query._id } : {}),
    })
      .sort({ timestamp: -1 })
      .limit(parsedLimit + 1)
      .lean();

    const hasMore = logs.length > parsedLimit;
    const items = hasMore ? logs.slice(0, -1) : logs;
    const nextCursor = hasMore ? encodeCursor(items[items.length - 1]._id) : null;

    sendSuccess(res, { logs: items, nextCursor, hasMore });
  } catch (err) {
    next(err);
  }
}
