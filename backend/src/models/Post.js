// src/models/Post.js
import mongoose from 'mongoose';
import { CATEGORIES } from '../utils/constants.js';

const engagementsSchema = new mongoose.Schema(
  {
    likes: { type: Number, default: 0 },
    comments: { type: Number, default: 0 },
    shares: { type: Number, default: 0 },
    bookmarks: { type: Number, default: 0 },
  },
  { _id: false }
);

const postSchema = new mongoose.Schema(
  {
    authorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    content: {
      type: String,
      required: true,
      maxlength: 1000,
      trim: true,
    },
    category: {
      type: String,
      enum: CATEGORIES,
      required: true,
    },
    auraImpact: {
      type: Number,
      default: 0,
    },
    engagements: {
      type: engagementsSchema,
      default: () => ({}),
    },
    qualityScore: {
      type: Number,
      default: 0,
    },
    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Index for feed queries
postSchema.index({ createdAt: -1 });
postSchema.index({ authorId: 1, createdAt: -1 });
postSchema.index({ category: 1, createdAt: -1 });
postSchema.index({ isDeleted: 1, createdAt: -1 });

const Post = mongoose.model('Post', postSchema);

export default Post;
