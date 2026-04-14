// src/controllers/leaderboardController.js
// Leaderboard endpoints — global and category-specific rankings
//
// Provides APIs for:
// - Global leaderboard with top users across all categories
// - Category-specific leaderboards for topic-focused rankings
// - Individual user rank queries for competitive features
// - Rate limited responses with configurable page sizes

import { sendSuccess, sendError } from '../utils/helpers.js';
import { getGlobal, getByCategory, getUserRank } from '../services/leaderboardService.js';
import { CATEGORIES } from '../utils/constants.js';

/**
 * Get global leaderboard with top users.
 * Returns ranked users across all categories combined.
 * Limit parameter capped at 100 to prevent excessive data transfer.
 */
export async function globalLeaderboard(req, res, next) {
  try {
    const limit = Math.min(parseInt(req.query.limit, 10) || 100, 100);
    const data = await getGlobal(limit);
    sendSuccess(res, { leaderboard: data });
  } catch (err) {
    next(err);
  }
}

export async function categoryLeaderboard(req, res, next) {
  try {
    const { cat } = req.params;
    // Validate category against allowed categories to prevent injection attacks
    if (!CATEGORIES.includes(cat)) return sendError(res, 'Invalid category', 400);

    const limit = Math.min(parseInt(req.query.limit, 10) || 100, 100);
    const data = await getByCategory(cat, limit);
    sendSuccess(res, { leaderboard: data, category: cat });
  } catch (err) {
    next(err);
  }
}

export async function myRank(req, res, next) {
  try {
    // Query authenticated user's rank in global leaderboard
    // Used for profile displays and competitive context
    const rank = await getUserRank(req.user._id);
    sendSuccess(res, { rank, userId: req.user._id });
  } catch (err) {
    next(err);
  }
}
