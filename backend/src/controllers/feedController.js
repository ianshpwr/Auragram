// src/controllers/feedController.js
// Feed endpoints for browsing posts
//
// Provides paginated feed of posts with support for:
// - Cursor-based pagination for scalability
// - Category filtering for topic-specific feeds
// - User context enrichment with author aura score and tier
// - Efficient querying with lean() for performance

import Post from '../models/Post.js';
import { sendSuccess, buildCursorQuery, encodeCursor } from '../utils/helpers.js';

/**
 * Get paginated feed of posts.
 * Implements cursor-based pagination for infinite scrolling.
 * Optionally filters by category.
 * Excludes deleted posts and populates author data.
 */
// async function
export async function getFeed(req, res, next) {
  try {
    const { cursor, limit, category } = req.query;
    const { query, limit: parsedLimit } = buildCursorQuery(cursor, limit);

    const filter = { isDeleted: false, ...query };
    if (category) filter.category = category;

    const posts = await Post.find(filter)
      .sort({ _id: -1 })
      .limit(parsedLimit + 1)
      .populate('authorId', 'username tier auraScore category scoreHistory')
      .lean();

    const hasMore = posts.length > parsedLimit;
    const items = hasMore ? posts.slice(0, -1) : posts;
    const nextCursor = hasMore ? encodeCursor(items[items.length - 1]._id) : null;

    sendSuccess(res, { posts: items, nextCursor, hasMore });
  } catch (err) {
    next(err);
  }
}
