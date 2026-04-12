// src/controllers/postsController.js
// Post management controller — handles creation, retrieval, and engagement with posts
// 
// This module manages all post-related operations including:
// - Creating new posts and triggering aura score updates
// - Retrieving posts with cursor-based pagination
// - Handling post engagements (likes, comments, shares)
// - Abuse detection and prevention

import { validationResult } from 'express-validator';
import Post from '../models/Post.js';
import redisClient from '../config/redis.js';
import { createAndEnqueue } from '../services/eventService.js';
import { checkAbuse } from '../services/abuseGuard.js';
import { sendSuccess, sendError, buildCursorQuery, encodeCursor } from '../utils/helpers.js';
import { CACHE_TTL } from '../utils/constants.js';

/**
 * Create a new post and enqueue event for aura score calculation.
 * Validates input and triggers the event system to award points to the author.
 */
export async function createPost(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

    const { content, category } = req.body;
    const post = await Post.create({ authorId: req.user._id, content, category });

    // Enqueue post_created event
    await createAndEnqueue({
      actorId: req.user._id,
      targetUserId: req.user._id,
      postId: post._id,
      type: 'post_created',
    });

    sendSuccess(res, post, 201);
  } catch (err) {
    next(err);
  }
}

export async function getFeed(req, res, next) {
  try {
    const { cursor, limit, category } = req.query;
    const { query, limit: parsedLimit } = buildCursorQuery(cursor, limit);

    const filter = { isDeleted: false, ...query };
    if (category) filter.category = category;

    const posts = await Post.find(filter)
      .sort({ _id: -1 })
      .limit(parsedLimit + 1)
      .populate('authorId', 'username tier auraScore category')
      .lean();

    const hasMore = posts.length > parsedLimit;
    const items = hasMore ? posts.slice(0, -1) : posts;
    const nextCursor = hasMore ? encodeCursor(items[items.length - 1]._id) : null;

    sendSuccess(res, { posts: items, nextCursor, hasMore });
  } catch (err) {
    next(err);
  }
}

export async function getPostById(req, res, next) {
  try {
    const { id } = req.params;
    const cacheKey = `cache:post:${id}`;

    const cached = await redisClient.get(cacheKey);
    if (cached) return sendSuccess(res, JSON.parse(cached));

    const post = await Post.findOne({ _id: id, isDeleted: false })
      .populate('authorId', 'username tier auraScore category')
      .lean();

    if (!post) return sendError(res, 'Post not found', 404);

    await redisClient.setex(cacheKey, CACHE_TTL.POST, JSON.stringify(post));
    sendSuccess(res, post);
  } catch (err) {
    next(err);
  }
}

export async function deletePost(req, res, next) {
  try {
    const { id } = req.params;
    const post = await Post.findOne({ _id: id, isDeleted: false });
    if (!post) return sendError(res, 'Post not found', 404);

    if (post.authorId.toString() !== req.user._id.toString()) {
      return sendError(res, 'Forbidden', 403);
    }

    await Post.findByIdAndUpdate(id, { $set: { isDeleted: true } });
    await redisClient.del(`cache:post:${id}`);

    // Emit post_removed event to penalize
    await createAndEnqueue({
      actorId: req.user._id,
      targetUserId: req.user._id,
      postId: post._id,
      type: 'post_removed',
    });

    sendSuccess(res, { message: 'Post deleted' });
  } catch (err) {
    next(err);
  }
}

export async function likePost(req, res, next) {
  try {
    const { id } = req.params;
    const post = await Post.findOne({ _id: id, isDeleted: false });
    if (!post) return sendError(res, 'Post not found', 404);

    const abuse = await checkAbuse({
      actorId: req.user._id,
      targetUserId: post.authorId,
      action: 'post_liked',
    });
    if (!abuse.allowed) return sendError(res, abuse.reason, 429);

    await Post.findByIdAndUpdate(id, { $inc: { 'engagements.likes': 1 } });
    await redisClient.del(`cache:post:${id}`);

    await createAndEnqueue({
      actorId: req.user._id,
      targetUserId: post.authorId,
      postId: post._id,
      type: 'post_liked',
    });

    sendSuccess(res, { message: 'Liked' }, 202);
  } catch (err) {
    next(err);
  }
}

export async function commentPost(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

    const { id } = req.params;
    const post = await Post.findOne({ _id: id, isDeleted: false });
    if (!post) return sendError(res, 'Post not found', 404);

    const abuse = await checkAbuse({
      actorId: req.user._id,
      targetUserId: post.authorId,
      action: 'post_commented',
    });
    if (!abuse.allowed) return sendError(res, abuse.reason, 429);

    await Post.findByIdAndUpdate(id, { $inc: { 'engagements.comments': 1 } });
    await redisClient.del(`cache:post:${id}`);

    await createAndEnqueue({
      actorId: req.user._id,
      targetUserId: post.authorId,
      postId: post._id,
      type: 'post_commented',
      metadata: { content: req.body.content },
    });

    sendSuccess(res, { message: 'Commented' }, 202);
  } catch (err) {
    next(err);
  }
}

export async function getComments(req, res, next) {
  try {
    const { id } = req.params;
    const { cursor, limit } = req.query;
    const { query, limit: parsedLimit } = buildCursorQuery(cursor, limit);

    // Comments are stored as events with metadata
    const { default: Event } = await import('../models/Event.js');
    const comments = await Event.find({
      postId: id,
      type: 'post_commented',
      ...query,
    })
      .sort({ _id: -1 })
      .limit(parsedLimit + 1)
      .populate('actorId', 'username tier auraScore')
      .lean();

    const hasMore = comments.length > parsedLimit;
    const items = hasMore ? comments.slice(0, -1) : comments;
    const nextCursor = hasMore ? encodeCursor(items[items.length - 1]._id) : null;

    sendSuccess(res, { comments: items, nextCursor, hasMore });
  } catch (err) {
    next(err);
  }
}

export async function sharePost(req, res, next) {
  try {
    const { id } = req.params;
    const post = await Post.findOne({ _id: id, isDeleted: false });
    if (!post) return sendError(res, 'Post not found', 404);

    await Post.findByIdAndUpdate(id, { $inc: { 'engagements.shares': 1 } });
    await redisClient.del(`cache:post:${id}`);

    await createAndEnqueue({
      actorId: req.user._id,
      targetUserId: post.authorId,
      postId: post._id,
      type: 'post_shared',
    });

    sendSuccess(res, { message: 'Shared' }, 202);
  } catch (err) {
    next(err);
  }
}

export async function bookmarkPost(req, res, next) {
  try {
    const { id } = req.params;
    const post = await Post.findOne({ _id: id, isDeleted: false });
    if (!post) return sendError(res, 'Post not found', 404);

    const abuse = await checkAbuse({
      actorId: req.user._id,
      targetUserId: post.authorId,
      action: 'post_bookmarked',
    });
    if (!abuse.allowed) return sendError(res, abuse.reason, 429);

    await Post.findByIdAndUpdate(id, { $inc: { 'engagements.bookmarks': 1 } });
    await redisClient.del(`cache:post:${id}`);

    await createAndEnqueue({
      actorId: req.user._id,
      targetUserId: post.authorId,
      postId: post._id,
      type: 'post_bookmarked',
    });

    sendSuccess(res, { message: 'Bookmarked' }, 202);
  } catch (err) {
    next(err);
  }
}

export async function reportPost(req, res, next) {
  try {
    const { id } = req.params;
    const post = await Post.findOne({ _id: id, isDeleted: false });
    if (!post) return sendError(res, 'Post not found', 404);

    if (post.authorId.toString() === req.user._id.toString()) {
      return sendError(res, 'Cannot report your own post', 400);
    }

    await createAndEnqueue({
      actorId: req.user._id,
      targetUserId: post.authorId,
      postId: post._id,
      type: 'post_reported',
      metadata: { reason: req.body.reason },
    });

    sendSuccess(res, { message: 'Reported' }, 202);
  } catch (err) {
    next(err);
  }
}
