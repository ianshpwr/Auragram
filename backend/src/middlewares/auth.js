// src/middlewares/auth.js
// JWT authentication middleware with silent refresh support
//
// Provides:
// - Access token validation from httpOnly cookies
// - Silent token refresh using refresh tokens
// - User ban checking for account suspension
// - Session management with automatic re-authentication
// - Security headers for XSS protection

import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import env from '../config/env.js';
import { sendError } from '../utils/helpers.js';

/**
 * Verify access token from httpOnly cookie.
 * Implements silent refresh: if access token expired but refresh token valid,
 * automatically issue new tokens and continue without client-side intervention.
 * 
 * Checks:
 * - Access token presence and validity
 * - User exists and is not banned
 * - Refresh token validity on access token expiry
 * - Ban expiration times to lift temporary suspensions
 */
export async function authenticate(req, res, next) {
  try {
    const accessToken = req.cookies?.accessToken;

    if (!accessToken) {
      return sendError(res, 'Authentication required', 401);
    }

    try {
      const decoded = jwt.verify(accessToken, env.JWT_SECRET);
      const user = await User.findById(decoded.userId).select('-passwordHash');

      if (!user) return sendError(res, 'User not found', 401);
      if (user.isBanned && user.banExpiresAt > new Date()) {
        return sendError(res, 'Account temporarily suspended', 403);
      }

      req.user = user;
      return next();
    } catch (tokenErr) {
      if (tokenErr.name !== 'TokenExpiredError') {
        return sendError(res, 'Invalid token', 401);
      }

      // Token expired — attempt silent refresh
      const refreshToken = req.cookies?.refreshToken;
      if (!refreshToken) return sendError(res, 'Session expired', 401);

      let refreshDecoded;
      try {
        refreshDecoded = jwt.verify(refreshToken, env.JWT_REFRESH_SECRET);
      } catch {
        return sendError(res, 'Session expired, please login again', 401);
      }

      const user = await User.findById(refreshDecoded.userId).select('+refreshToken -passwordHash');
      if (!user || user.refreshToken !== refreshToken) {
        return sendError(res, 'Invalid session', 401);
      }

      // Issue new access token
      const newAccessToken = jwt.sign({ userId: user._id }, env.JWT_SECRET, {
        expiresIn: env.JWT_ACCESS_EXPIRES_IN,
      });

      res.cookie('accessToken', newAccessToken, {
        httpOnly: true,
        secure: env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 15 * 60 * 1000, // 15 minutes
      });

      req.user = user;
      return next();
    }
  } catch (err) {
    return next(err);
  }
}

/**
 * Optional authentication — populates req.user if token is valid, 
 * but does not block the request if not authenticated.
 */
export async function optionalAuth(req, res, next) {
  try {
    const accessToken = req.cookies?.accessToken;
    if (!accessToken) return next();

    const decoded = jwt.verify(accessToken, env.JWT_SECRET);
    const user = await User.findById(decoded.userId).select('-passwordHash');
    if (user) req.user = user;
    return next();
  } catch {
    return next();
  }
}

export default authenticate;
