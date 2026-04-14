// src/models/Event.js
// Immutable event record for aura score computation
//
// Event log captures all user actions for:
// - Aura score calculation by the BullMQ worker
// - Audit trails for transparency and debugging
// - Abuse pattern detection
// - Analytics and engagement metrics
// - Replay capability for recalculation
//
// Never modified after creation; immutable by design for data integrity

import mongoose from 'mongoose';

// Complete list of event types triggering aura calculations
const EVENT_TYPES = [
  'post_created',
  'post_liked',
  'post_commented',
  'post_shared',
  'post_bookmarked',
  'comment_liked',
  'profile_followed',
  'post_reported',
  'post_removed',
];

const eventSchema = new mongoose.Schema(
  {
    actorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    targetUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    postId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Post',
      index: true,
    },
    type: {
      type: String,
      enum: EVENT_TYPES,
      required: true,
      index: true,
    },
    weight: {
      type: Number,
      default: 0,
    },
    processed: {
      type: Boolean,
      default: false,
      index: true,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

// Compound index for anti-farming check
eventSchema.index({ actorId: 1, targetUserId: 1, type: 1, createdAt: -1 });
// Index for unprocessed events
eventSchema.index({ processed: 1, createdAt: 1 });

// Prevent updates to immutable fields after creation
eventSchema.pre('save', function (next) {
  if (!this.isNew) {
    // Only allow updating 'processed' and 'weight'
    const allowedUpdates = new Set(['processed', 'weight']);
    const modifiedPaths = this.modifiedPaths();
    const forbidden = modifiedPaths.filter((p) => !allowedUpdates.has(p));
    if (forbidden.length > 0) {
      return next(new Error(`Event is immutable. Cannot modify: ${forbidden.join(', ')}`));
    }
  }
  next();
});

const Event = mongoose.model('Event', eventSchema);

export default Event;
