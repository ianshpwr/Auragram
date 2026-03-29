// src/socket/socketManager.js
// Socket.io management with JWT auth and room handling

import jwt from 'jsonwebtoken';
import env from '../config/env.js';

let io = null;

/**
 * Initialize the socket manager with an io instance.
 * @param {import('socket.io').Server} ioInstance
 */
export function initSocket(ioInstance) {
  io = ioInstance;

  // JWT auth middleware on connection
  io.use(async (socket, next) => {
    try {
      // Try cookie first, then handshake auth
      const token =
        socket.handshake.auth?.token ||
        socket.handshake.headers?.cookie
          ?.split(';')
          ?.find((c) => c.trim().startsWith('accessToken='))
          ?.split('=')?.[1];

      if (!token) {
        return next(new Error('Authentication required'));
      }

      const decoded = jwt.verify(token, env.JWT_SECRET);
      socket.userId = decoded.userId.toString();
      return next();
    } catch (err) {
      return next(new Error('Invalid or expired token'));
    }
  });

  io.on('connection', (socket) => {
    const userId = socket.userId;
    console.log(`[Socket] User ${userId} connected (${socket.id})`);

    // Join user's personal room
    socket.join(`user:${userId}`);

    // Handle leaderboard room join/leave
    socket.on('join_leaderboard', () => {
      socket.join('leaderboard-updates');
      console.log(`[Socket] User ${userId} joined leaderboard room`);
    });

    socket.on('leave_leaderboard', () => {
      socket.leave('leaderboard-updates');
      console.log(`[Socket] User ${userId} left leaderboard room`);
    });

    socket.on('disconnect', (reason) => {
      console.log(`[Socket] User ${userId} disconnected: ${reason}`);
    });

    socket.on('error', (err) => {
      console.error(`[Socket] Error for user ${userId}:`, err.message);
    });
  });
}

/**
 * Emit an event to a specific user's room.
 * @param {string} userId
 * @param {string} event
 * @param {any} data
 */
export function emitToUser(userId, event, data) {
  if (!io) {
    console.warn('[Socket] Socket not initialized');
    return;
  }
  io.to(`user:${userId}`).emit(event, data);
}

/**
 * Emit an event to a named room.
 * @param {string} room
 * @param {string} event
 * @param {any} data
 */
export function emitToRoom(room, event, data) {
  if (!io) {
    console.warn('[Socket] Socket not initialized');
    return;
  }
  io.to(room).emit(event, data);
}

/**
 * Get the io instance (for use in controllers if needed).
 * @returns {import('socket.io').Server}
 */
export function getIO() {
  return io;
}

export default { initSocket, emitToUser, emitToRoom, getIO };
