// src/controllers/authController.js
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { validationResult } from 'express-validator';
import User from '../models/User.js';
import env from '../config/env.js';
import { sanitizeUser, sendSuccess, sendError } from '../utils/helpers.js';
import redisClient from '../config/redis.js';

function setTokenCookies(res, accessToken, refreshToken) {
  res.cookie('accessToken', accessToken, {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 15 * 60 * 1000,
  });
  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: '/api/auth/refresh',
  });
}

function issueTokens(userId) {
  const accessToken = jwt.sign({ userId }, env.JWT_SECRET, {
    expiresIn: env.JWT_ACCESS_EXPIRES_IN,
  });
  const refreshToken = jwt.sign({ userId }, env.JWT_REFRESH_SECRET, {
    expiresIn: env.JWT_REFRESH_EXPIRES_IN,
  });
  return { accessToken, refreshToken };
}

export async function register(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

    const { username, email, password, category } = req.body;

    const existing = await User.findOne({ $or: [{ email }, { username }] });
    if (existing) {
      const field = existing.email === email ? 'email' : 'username';
      return sendError(res, `${field} already in use`, 409);
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await User.create({ username, email, passwordHash, category });

    const { accessToken, refreshToken } = issueTokens(user._id);
    await User.findByIdAndUpdate(user._id, { refreshToken });

    setTokenCookies(res, accessToken, refreshToken);
    sendSuccess(res, { user: sanitizeUser(user), accessToken }, 201);
  } catch (err) {
    next(err);
  }
}

export async function login(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

    const { email, password } = req.body;
    const user = await User.findOne({ email }).select('+passwordHash');
    if (!user) return sendError(res, 'Invalid credentials', 401);

    if (user.isBanned && user.banExpiresAt > new Date()) {
      return sendError(res, 'Account temporarily suspended', 403);
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) return sendError(res, 'Invalid credentials', 401);

    const { accessToken, refreshToken } = issueTokens(user._id);
    await User.findByIdAndUpdate(user._id, { refreshToken, lastActiveAt: new Date() });

    setTokenCookies(res, accessToken, refreshToken);
    sendSuccess(res, { user: sanitizeUser(user), accessToken });
  } catch (err) {
    next(err);
  }
}

export async function logout(req, res, next) {
  try {
    if (req.user) {
      await User.findByIdAndUpdate(req.user._id, { $unset: { refreshToken: 1 } });
    }
    res.clearCookie('accessToken');
    res.clearCookie('refreshToken', { path: '/api/auth/refresh' });
    sendSuccess(res, { message: 'Logged out successfully' });
  } catch (err) {
    next(err);
  }
}

export async function refresh(req, res, next) {
  try {
    const refreshToken = req.cookies?.refreshToken;
    if (!refreshToken) return sendError(res, 'Refresh token required', 401);

    let decoded;
    try {
      decoded = jwt.verify(refreshToken, env.JWT_REFRESH_SECRET);
    } catch {
      return sendError(res, 'Invalid or expired refresh token', 401);
    }

    const user = await User.findById(decoded.userId).select('+refreshToken');
    if (!user || user.refreshToken !== refreshToken) {
      return sendError(res, 'Token rotation detected', 401);
    }

    const { accessToken, refreshToken: newRefreshToken } = issueTokens(user._id);
    await User.findByIdAndUpdate(user._id, { refreshToken: newRefreshToken });

    setTokenCookies(res, accessToken, newRefreshToken);
    sendSuccess(res, { accessToken });
  } catch (err) {
    next(err);
  }
}

export async function getMe(req, res, next) {
  try {
    // Cache user in Redis
    const cacheKey = `cache:user:${req.user._id}`;
    const cached = await redisClient.get(cacheKey);
    if (cached) return sendSuccess(res, JSON.parse(cached));

    const user = await User.findById(req.user._id).select('-passwordHash -refreshToken');
    if (!user) return sendError(res, 'User not found', 404);

    await redisClient.setex(cacheKey, 300, JSON.stringify(sanitizeUser(user)));
    sendSuccess(res, sanitizeUser(user));
  } catch (err) {
    next(err);
  }
}
