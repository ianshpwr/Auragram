// src/controllers/eventsController.js
import { validationResult } from 'express-validator';
import { checkAbuse } from '../services/abuseGuard.js';
import { createAndEnqueue } from '../services/eventService.js';
import { sendSuccess, sendError } from '../utils/helpers.js';

export async function submitEvent(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

    const { type, targetUserId, postId, metadata } = req.body;
    const actorId = req.user._id;

    // Abuse check
    const abuse = await checkAbuse({ actorId, targetUserId, action: type });
    if (!abuse.allowed) return sendError(res, abuse.reason, 429);

    // Create event and enqueue
    const { events, job } = await createAndEnqueue({
      actorId,
      targetUserId,
      postId,
      type,
      metadata,
    });

    sendSuccess(res, { eventId: events._id, jobId: job.id }, 202);
  } catch (err) {
    next(err);
  }
}
