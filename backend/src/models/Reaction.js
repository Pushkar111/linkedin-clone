/**
 * Reaction Model
 * Stores reactions (like, celebrate, support, etc.) to posts and comments
 */

import mongoose from 'mongoose';

const reactionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    // What is being reacted to
    parentType: {
      type: String,
      enum: ['post', 'post-comment', 'comment-reply'],
      required: true,
    },
    parentId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      refPath: 'parentType', // Dynamic reference
    },
    // Type of reaction
    reactionType: {
      type: String,
      enum: ['like', 'celebrate', 'support', 'funny', 'love', 'insightful', 'curious'],
      default: 'like',
    },
  },
  {
    timestamps: true,
  }
);

// Compound index to ensure one reaction per user per item
reactionSchema.index({ user: 1, parentId: 1, parentType: 1 }, { unique: true });
reactionSchema.index({ parentId: 1, parentType: 1 });

const Reaction = mongoose.model('Reaction', reactionSchema);

export default Reaction;
