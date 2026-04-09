// src/controllers/eventsController.js

import { validationResult } from 'express-validator';
import { checkAbuse } from '../services/abuseGuard.js';
import { createAndEnqueue } from '../services/eventService.js';
import { sendSuccess, sendError } from '../utils/helpers.js';

export async function submitEvent(req, res, next) {
  try {
    // Validate request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return sendError(res, 'Validation failed', 400, errors.array());
    }

    // Auth check
    const actorId = req.user?._id;
    if (!actorId) {
      return sendError(res, 'Unauthorized', 401);
    }

    // Extract body
    const { type: eventType, targetUserId, postId, metadata } = req.body;

    // Create event and enqueue
    const { events, job } = await createAndEnqueue({
    // Abuse protection
    const abuse = await checkAbuse({
      actorId,
      targetUserId,
      action: eventType,
    });

    if (!abuse.allowed) {
      return sendError(res, abuse.reason || 'Too many requests', 429);
    }

    // Create event + enqueue job
    const { event, job } = await createAndEnqueue({
      actorId,
      targetUserId,
      postId,
      type: eventType,
      metadata,
    });

    sendSuccess(res, { eventId: events._id, jobId: job.id }, 202);
    // Success response
    return sendSuccess(res, {
      message: 'Event accepted for processing',
      eventId: event._id,
      jobId: job.id,
    }, 202);

  } catch (err) {
    next(err);
  }
}
