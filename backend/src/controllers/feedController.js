// src/controllers/feedController.js
import Post from '../models/Post.js';
import { sendSuccess, buildCursorQuery, encodeCursor } from '../utils/helpers.js';

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
