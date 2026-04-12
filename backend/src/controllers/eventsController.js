// src/controllers/eventsController.js
// Event submission and processing endpoints
//
// Handles client-side event submissions with:
// - Input validation using express-validator
// - Abuse detection and prevention checks
// - Asynchronous event queueing via BullMQ
// - HTTP 202 responses indicating accepted for processing

import { validationResult } from 'express-validator';
import { checkAbuse } from '../services/abuseGuard.js';
import { createAndEnqueue } from '../services/eventService.js';
import { sendSuccess, sendError } from '../utils/helpers.js';

/**
 * Submit an event for aura score processing.
 * Client-facing endpoint that validates, checks abuse, and queues the event.
 * Returns 202 Accepted to indicate asynchronous processing.
 * 
 * Flow:
 * 1. Validate request parameters
 * 2. Check abuse signals (velocity, rate limits, self-engagement)
 * 3. Create Event document and enqueue job
 * 4. Return job ID for status tracking
 */
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

    // Abuse protection — check for suspicious patterns
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
