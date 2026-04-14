// src/models/AuraLog.js
// Audit trail for all aura score changes
//
// Maintains complete history of aura score modifications:
// - Records before/after scores for verification
// - Links to originating events for traceability
// - Provides transparency to users about score changes
// - Enables score audit and recalculation verification
// - Powers user-facing transaction history/logs

import mongoose from 'mongoose';

// Schema for logging every single aura score change
const auraLogSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    delta: {
      type: Number,
      required: true,
    },
    reason: {
      type: String,
      required: true,
    },
    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Event',
    },
    scoreBefore: {
      type: Number,
      required: true,
    },
    scoreAfter: {
      type: Number,
      required: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    // No timestamps option — we handle it manually via the timestamp field
    versionKey: false,
  }
);

// Index for user audit log queries
auraLogSchema.index({ userId: 1, timestamp: -1 });

const AuraLog = mongoose.model('AuraLog', auraLogSchema);

export default AuraLog;
