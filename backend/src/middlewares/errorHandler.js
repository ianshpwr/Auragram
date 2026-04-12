// src/middlewares/errorHandler.js
// Centralized error handler for consistent API error responses
//
// Handles:
// - Mongoose validation errors with field-level details
// - Database duplicate key errors (unique constraint violations)
// - Authentication and authorization errors
// - Development vs production error disclosure
// - Standardized error response format
// - Error logging for monitoring and debugging

import env from '../config/env.js';

/**
 * Global error handler middleware.
 * Must be registered LAST in Express middleware chain to catch all errors.
 * Converts various error types into standardized API responses.
 * In development, includes stack traces; in production, hides sensitive details.
 */
export function errorHandler(err, req, res, next) {
  const isDev = env.NODE_ENV === 'development';

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map((e) => e.message);
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: messages,
    });
  }

  // Mongoose duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    return res.status(409).json({
      success: false,
      error: `${field} already exists`,
    });
  }

  // Mongoose cast error (invalid ObjectId)
  if (err.name === 'CastError') {
    return res.status(400).json({
      success: false,
      error: `Invalid ${err.path}: ${err.value}`,
    });
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({ success: false, error: 'Invalid token' });
  }
  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({ success: false, error: 'Token expired' });
  }

  const statusCode = err.statusCode || err.status || 500;
  const message = err.message || 'Internal server error';

  console.error('[Error]', err.message, isDev ? err.stack : '');

  return res.status(statusCode).json({
    success: false,
    error: message,
    ...(isDev && { stack: err.stack }),
  });
}

export default errorHandler;
