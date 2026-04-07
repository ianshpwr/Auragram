// src/utils/helpers.js
// Pagination helpers and response formatters

/**
 * Build cursor-based pagination query.
 * Cursor is the _id of the last document seen.
 * @param {string} cursor - Last document ID (base64 encoded)
 * @param {number} limit
 * @returns {{ query: Object, limit: number }}
 */
export function buildCursorQuery(cursor, limit = 20) {
  const parsedLimit = Math.min(parseInt(limit, 10) || 20, 100);
  const query = {};

  if (cursor) {
    try {
      const decoded = Buffer.from(cursor, 'base64').toString('utf8');
      query._id = { $lt: decoded };
    } catch {
      // ignore invalid cursor
    }
  }

  return { query, limit: parsedLimit };
}

/**
 * Encode an _id as a cursor string.
 * @param {string|Object} id
 * @returns {string}
 */
export function encodeCursor(id) {
  return Buffer.from(id.toString(), 'utf8').toString('base64');
}

/**
 * Standard success response wrapper.
 * @param {Response} res
 * @param {any} data
 * @param {number} statusCode
 */
export function sendSuccess(res, data, statusCode = 200) {
  res.status(statusCode).json({ success: true, data });
}

/**
 * Standard error response wrapper.
 * @param {Response} res
 * @param {string} message
 * @param {number} statusCode
 */
export function sendError(res, message, statusCode = 500) {
  res.status(statusCode).json({ success: false, error: message });
}

/**
 * Sanitize a user object for public consumption (remove sensitive fields).
 * @param {Object} user - Mongoose User document
 * @returns {Object}
 */
export function sanitizeUser(user) {
  const obj = user.toObject ? user.toObject() : { ...user };
  obj._id = obj._id?.toString() || obj.id;
  delete obj.passwordHash;
  delete obj.refreshToken;
  delete obj.__v;
  return obj;
}
