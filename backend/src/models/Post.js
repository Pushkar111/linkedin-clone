/**
 * Post Model
 * Represents a post/publication in the LinkedIn clone
 */

import mongoose from 'mongoose';

// Comment subdocument schema
const commentSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    text: {
      type: String,
      required: [true, 'Comment text is required'],
      trim: true,
      maxlength: [500, 'Comment cannot exceed 500 characters'],
    },
    // Nested replies (comment replies)
    replies: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
        text: String,
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Main Post schema
const postSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Post must belong to a user'],
      index: true,
    },
    text: {
      type: String,
      required: [true, 'Post text is required'],
      trim: true,
      maxlength: [3000, 'Post cannot exceed 3000 characters'],
    },
    mediaType: {
      type: String,
      enum: ['photo', 'video', 'none'],
      default: 'none',
    },
    mediaURL: {
      type: String,
      default: '',
    },
    // Array of user IDs who liked this post (legacy - kept for backward compatibility)
    likes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    // Reactions with types (LinkedIn-style multi-reactions)
    reactions: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
          required: true,
        },
        type: {
          type: String,
          enum: ['like', 'celebrate', 'support', 'funny', 'love', 'insightful', 'curious'],
          default: 'like',
        },
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    // Embedded comments
    comments: [commentSchema],
    // Hashtags extracted from post text
    hashtags: [
      {
        type: String,
        lowercase: true,
        trim: true,
      },
    ],
    // Counters (for performance - avoid counting arrays every time)
    viewCount: {
      type: Number,
      default: 0,
    },
    active: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes for performance
postSchema.index({ user: 1, createdAt: -1 });
postSchema.index({ createdAt: -1 });
postSchema.index({ active: 1 });
postSchema.index({ hashtags: 1 }); // For hashtag search

// Virtual for like count (legacy - uses reactions array now)
postSchema.virtual('likeCount').get(function () {
  // Count all reactions (any type)
  return this.reactions ? this.reactions.length : this.likes ? this.likes.length : 0;
});

// Virtual for reaction counts by type
postSchema.virtual('reactionCounts').get(function () {
  if (!this.reactions || this.reactions.length === 0) {
    return {};
  }
  
  const counts = {};
  this.reactions.forEach(reaction => {
    counts[reaction.type] = (counts[reaction.type] || 0) + 1;
  });
  
  return counts;
});

// Virtual for total reaction count
postSchema.virtual('reactionCount').get(function () {
  return this.reactions ? this.reactions.length : 0;
});

// Virtual for comment count
postSchema.virtual('commentCount').get(function () {
  return this.comments ? this.comments.length : 0;
});

/**
 * Increment view count
 */
postSchema.methods.incrementView = async function () {
  this.viewCount += 1;
  await this.save();
};

/**
 * Toggle reaction on post (idempotent operation using atomic MongoDB operations)
 * Supports multi-reaction system like LinkedIn
 * @param {ObjectId} userId - User ID
 * @param {string} reactionType - Type of reaction ('like', 'celebrate', 'support', etc.)
 * @param {string} requestId - Optional request ID for logging
 * @returns {Promise<Object>} - { reacted: boolean, reactionType: string|null, reactionCount: number, reactionCounts: Object }
 */
postSchema.methods.toggleReaction = async function (userId, reactionType = 'like', requestId = '') {
  const userIdString = userId.toString();
  
  // Validate reaction type
  const validTypes = ['like', 'celebrate', 'support', 'funny', 'love', 'insightful', 'curious'];
  if (!validTypes.includes(reactionType)) {
    throw new Error(`Invalid reaction type: ${reactionType}`);
  }
  
  // Check current state
  const existingReaction = this.reactions.find(
    (r) => r.user.toString() === userIdString
  );
  
  let updatedPost;
  
  if (existingReaction) {
    if (existingReaction.type === reactionType) {
      // Same reaction - remove it (unreact)
      if (requestId) {
        console.log(`[Post.toggleReaction ${requestId}] Removing reaction`, {
          postId: this._id.toString(),
          userId: userIdString,
          reactionType,
          currentReactionCount: this.reactions.length,
        });
      }
      
      updatedPost = await mongoose.model('Post').findByIdAndUpdate(
        this._id,
        { $pull: { reactions: { user: userId } } },
        { new: true }
      );
      
      // Also sync with legacy likes array
      await mongoose.model('Post').findByIdAndUpdate(
        this._id,
        { $pull: { likes: userId } }
      );
    } else {
      // Different reaction - update it
      if (requestId) {
        console.log(`[Post.toggleReaction ${requestId}] Changing reaction`, {
          postId: this._id.toString(),
          userId: userIdString,
          from: existingReaction.type,
          to: reactionType,
        });
      }
      
      updatedPost = await mongoose.model('Post').findByIdAndUpdate(
        this._id,
        {
          $pull: { reactions: { user: userId } },
        },
        { new: true }
      );
      
      updatedPost = await mongoose.model('Post').findByIdAndUpdate(
        this._id,
        {
          $push: {
            reactions: {
              user: userId,
              type: reactionType,
              createdAt: new Date(),
            },
          },
        },
        { new: true }
      );
    }
  } else {
    // No existing reaction - add new one
    if (requestId) {
      console.log(`[Post.toggleReaction ${requestId}] Adding new reaction`, {
        postId: this._id.toString(),
        userId: userIdString,
        reactionType,
        currentReactionCount: this.reactions.length,
      });
    }
    
    updatedPost = await mongoose.model('Post').findByIdAndUpdate(
      this._id,
      {
        $push: {
          reactions: {
            user: userId,
            type: reactionType,
            createdAt: new Date(),
          },
        },
      },
      { new: true }
    );
    
    // Also sync with legacy likes array
    await mongoose.model('Post').findByIdAndUpdate(
      this._id,
      { $addToSet: { likes: userId } }
    );
  }
  
  if (!updatedPost) {
    throw new Error('Post not found during reaction toggle');
  }
  
  // Update current document instance
  this.reactions = updatedPost.reactions;
  this.likes = updatedPost.likes;
  
  // Get final state
  const finalReaction = updatedPost.reactions.find(
    (r) => r.user.toString() === userIdString
  );
  
  // Calculate reaction counts
  const reactionCounts = {};
  updatedPost.reactions.forEach(reaction => {
    reactionCounts[reaction.type] = (reactionCounts[reaction.type] || 0) + 1;
  });
  
  if (requestId) {
    console.log(`[Post.toggleReaction ${requestId}] Success`, {
      postId: this._id.toString(),
      reacted: !!finalReaction,
      reactionType: finalReaction ? finalReaction.type : null,
      reactionCount: updatedPost.reactions.length,
      reactionCounts,
    });
  }
  
  // Return canonical state
  return {
    reacted: !!finalReaction,
    reactionType: finalReaction ? finalReaction.type : null,
    reactionCount: updatedPost.reactions.length,
    reactionCounts,
  };
};

/**
 * Toggle like on post (legacy method - now uses reactions)
 * Kept for backward compatibility
 * @param {ObjectId} userId - User ID
 * @param {string} requestId - Optional request ID for logging
 * @returns {Promise<Object>} - { liked: boolean, likeCount: number }
 */
postSchema.methods.toggleLike = async function (userId, requestId = '') {
  // Delegate to toggleReaction with 'like' type
  const result = await this.toggleReaction(userId, 'like', requestId);
  
  return {
    liked: result.reacted && result.reactionType === 'like',
    likeCount: result.reactionCount,
  };
};

/**
 * Add comment to post
 * @param {ObjectId} userId - User ID
 * @param {string} text - Comment text
 * @returns {Promise<Object>} - Created comment
 */
postSchema.methods.addComment = async function (userId, text) {
  this.comments.push({ user: userId, text });
  await this.save();
  return this.comments[this.comments.length - 1];
};

/**
 * Delete comment from post
 * @param {ObjectId} commentId - Comment ID
 * @returns {Promise<boolean>} - Success status
 */
postSchema.methods.deleteComment = async function (commentId) {
  const commentIndex = this.comments.findIndex(
    (comment) => comment._id.toString() === commentId.toString()
  );

  if (commentIndex > -1) {
    this.comments.splice(commentIndex, 1);
    await this.save();
    return true;
  }
  return false;
};

const Post = mongoose.model('Post', postSchema);

export default Post;
