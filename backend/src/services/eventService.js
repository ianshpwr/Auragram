// src/services/eventService.js
// Event creation and BullMQ queue management
//
// This service is the backbone of the aura system. It:
// - Creates immutable Event documents for audit trails
// - Enqueues events into BullMQ for asynchronous processing
// - Implements retry logic with exponential backoff for reliability
// - Logs all events for monitoring and debugging

import Event from '../models/Event.js';
import { auraQueue } from '../config/queue.js';
import { EVENT_WEIGHTS } from '../utils/constants.js';

/**
 * Create an Event document and enqueue it for async processing.
 * This is the main entry point for all aura-scoring events in the system.
 * Events are processed asynchronously by the auraWorker to avoid blocking API responses.
 * 
 * Retry Strategy:
 * - 3 attempts per job with exponential backoff (1s, 2s, 4s)
 * - Ensures reliability even with temporary database or Redis issues
 * 
 * @param {Object} eventData - Event creation parameters
 * @param {string} eventData.actorId - User performing the action
 * @param {string} [eventData.targetUserId] - User being acted upon (e.g., post author)
 * @param {string} [eventData.postId] - Related post ID if applicable
 * @param {string} eventData.type - Event type from EVENT_WEIGHTS constants
 * @param {Object} [eventData.metadata] - Additional context-specific data
 * @returns {Promise<{ event: Object, job: Object }>} - Created event and job objects
 */
export async function createAndEnqueue(eventData) {
  const { actorId, targetUserId, postId, type, metadata = {} } = eventData;

  const weight = EVENT_WEIGHTS[type] ?? 0;

  const event = await Event.create({
    actorId,
    targetUserId,
    postId,
    type,
    weight,
    processed: false,
    metadata,
  });

  const job = await auraQueue.add(
    'process-aura-event',
    { eventId: event._id.toString() },
    {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 1000,
      },
    }
  );

  console.log(`[EventService] Created event ${event._id} (${type}), job ${job.id}`);
  return { event, job };
}

export default { createAndEnqueue };
