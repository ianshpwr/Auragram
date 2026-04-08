// src/services/eventService.js
// Creates Event documents and enqueues them into BullMQ

import Event from '../models/Event.js';
import { auraQueue } from '../config/queue.js';
import { EVENT_WEIGHTS } from '../utils/constants.js';

/**
 * Create an Event document and enqueue it for async processing.
 * @param {Object} eventData
 * @param {string} eventData.actorId
 * @param {string} [eventData.targetUserId]
 * @param {string} [eventData.postId]
 * @param {string} eventData.type
 * @returns {Promise<{ event: Object, job: Object }>}
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
