// src/models/User.js
// User schema and model
//
// Represents a user account with:
// - Authentication credentials (username, email, password hash)
// - Aura score for competitive ranking
// - Tier badges based on score milestones
// - Activity tracking (lastActiveAt)
// - Account status (ban flags, suspension times)
// - Score history for analytics and charts
// - Category specialization for topic-focused leaderboards

import mongoose from 'mongoose';
import { TIERS } from '../utils/constants.js';

// Track historical aura scores for visualization and analytics
const scoreHistorySchema = new mongoose.Schema(
  {
    score: { type: Number, required: true },
    timestamp: { type: Date, default: Date.now },
  },
  { _id: false }
);

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      minlength: 3,
      maxlength: 30,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    passwordHash: {
      type: String,
      required: true,
      select: false,
    },
    auraScore: {
      type: Number,
      default: 0,
      index: true,
    },
    tier: {
      type: String,
      enum: TIERS,
      default: 'Dormant',
      index: true,
    },
    category: {
      type: String,
      trim: true,
    },
    scoreHistory: {
      type: [scoreHistorySchema],
      default: [],
    },
    lastActiveAt: {
      type: Date,
      default: Date.now,
    },
    refreshToken: {
      type: String,
      select: false,
    },
    isBanned: {
      type: Boolean,
      default: false,
      index: true,
    },
    banExpiresAt: {
      type: Date,
    },
    eventCount: {
      type: Number,
      default: 0,
    },
    eventWindowStart: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for leaderboard queries
userSchema.index({ auraScore: -1, _id: 1 });
userSchema.index({ tier: 1, auraScore: -1 });

const User = mongoose.model('User', userSchema);

export default User;
