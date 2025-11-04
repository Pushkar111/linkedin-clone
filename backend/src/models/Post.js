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
    // Array of user IDs who liked this post
    likes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    // Embedded comments
    comments: [commentSchema],
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

// Virtual for like count
postSchema.virtual('likeCount').get(function () {
  return this.likes ? this.likes.length : 0;
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
 * Toggle like on post
 * @param {ObjectId} userId - User ID
 * @returns {Promise<boolean>} - true if liked, false if unliked
 */
postSchema.methods.toggleLike = async function (userId) {
  const userIdString = userId.toString();
  const index = this.likes.findIndex(
    (id) => id.toString() === userIdString
  );

  if (index > -1) {
    // Unlike - remove user from likes array
    this.likes.splice(index, 1);
    await this.save();
    return false;
  } else {
    // Like - add user to likes array
    this.likes.push(userId);
    await this.save();
    return true;
  }
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
