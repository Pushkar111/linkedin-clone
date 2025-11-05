/**
 * Post Routes
 * Handle post-related endpoints
 */

import express from 'express';
import {
  getAllPosts,
  getPostById,
  createPost,
  updatePost,
  deletePost,
  toggleLike,
  toggleReaction,
  addComment,
  updateComment,
  deleteComment,
  getUserPosts,
  getPostsByHashtag,
  getTrendingHashtags,
  toggleCommentReaction,
  getCommentReactions,
  getCommentReactionUsers,
} from '../controllers/postController.js';
import { protect, optionalAuth } from '../middleware/auth.js';
import {
  createPostValidation,
  updatePostValidation,
  createCommentValidation,
  objectIdValidation,
  validate,
} from '../middleware/validation.js';
import upload from '../middleware/upload.js';

const router = express.Router();

/**
 * @route   GET /api/posts
 * @desc    Get all posts (paginated feed)
 * @access  Public (with optional auth)
 */
router.get('/', optionalAuth, getAllPosts);

/**
 * @route   POST /api/posts
 * @desc    Create a new post
 * @access  Private
 */
router.post(
  '/',
  protect,
  upload.single('image'),
  createPostValidation,
  validate,
  createPost
);

/**
 * @route   GET /api/posts/hashtags/trending
 * @desc    Get trending hashtags
 * @access  Public
 */
router.get('/hashtags/trending', getTrendingHashtags);

/**
 * @route   GET /api/posts/hashtag/:tag
 * @desc    Get posts by hashtag
 * @access  Public
 */
router.get('/hashtag/:tag', getPostsByHashtag);

/**
 * @route   GET /api/posts/user/:userId
 * @desc    Get posts by a specific user
 * @access  Public
 */
router.get(
  '/user/:userId',
  objectIdValidation('userId'),
  validate,
  getUserPosts
);

/**
 * @route   GET /api/posts/:id
 * @desc    Get single post by ID
 * @access  Public
 */
router.get('/:id', objectIdValidation('id'), validate, getPostById);

/**
 * @route   PUT /api/posts/:id
 * @desc    Update a post
 * @access  Private (owner only)
 */
router.put(
  '/:id',
  protect,
  objectIdValidation('id'),
  updatePostValidation,
  validate,
  updatePost
);

/**
 * @route   DELETE /api/posts/:id
 * @desc    Delete a post
 * @access  Private (owner only)
 */
router.delete(
  '/:id',
  protect,
  objectIdValidation('id'),
  validate,
  deletePost
);

/**
 * @route   POST /api/posts/:id/like-toggle
 * @desc    Toggle like on a post (idempotent)
 * @access  Private
 */
router.post(
  '/:id/like-toggle',
  protect,
  objectIdValidation('id'),
  validate,
  toggleLike
);

/**
 * @route   POST /api/posts/:id/like (DEPRECATED - use /like-toggle)
 * @desc    Toggle like on a post (backward compatibility)
 * @access  Private
 */
router.post(
  '/:id/like',
  protect,
  objectIdValidation('id'),
  validate,
  toggleLike
);

/**
 * @route   POST /api/posts/:id/react
 * @desc    Toggle reaction on a post (LinkedIn-style multi-reactions)
 * @access  Private
 */
router.post(
  '/:id/react',
  protect,
  objectIdValidation('id'),
  validate,
  toggleReaction
);

/**
 * @route   POST /api/posts/:id/comments
 * @desc    Add a comment to a post
 * @access  Private
 */
router.post(
  '/:id/comments',
  protect,
  objectIdValidation('id'),
  createCommentValidation,
  validate,
  addComment
);

/**
 * @route   PUT /api/posts/:id/comments/:commentId
 * @desc    Update a comment
 * @access  Private (comment owner only)
 */
router.put(
  '/:id/comments/:commentId',
  protect,
  objectIdValidation('id'),
  createCommentValidation,
  validate,
  updateComment
);

/**
 * @route   DELETE /api/posts/:id/comments/:commentId
 * @desc    Delete a comment from a post
 * @access  Private (comment owner or post owner)
 */
router.delete(
  '/:id/comments/:commentId',
  protect,
  objectIdValidation('id'),
  validate,
  deleteComment
);

/**
 * @route   POST /api/posts/:id/comments/:commentId/reactions
 * @desc    Toggle reaction on a comment
 * @access  Private
 */
router.post(
  '/:id/comments/:commentId/reactions',
  protect,
  objectIdValidation('id'),
  validate,
  toggleCommentReaction
);

/**
 * @route   GET /api/posts/:id/comments/:commentId/reactions
 * @desc    Get all reactions for a comment
 * @access  Public (with optional auth)
 */
router.get(
  '/:id/comments/:commentId/reactions',
  optionalAuth,
  objectIdValidation('id'),
  validate,
  getCommentReactions
);

/**
 * @route   GET /api/posts/:id/comments/:commentId/reactions/users
 * @desc    Get users who reacted to a comment
 * @access  Public
 */
router.get(
  '/:id/comments/:commentId/reactions/users',
  objectIdValidation('id'),
  validate,
  getCommentReactionUsers
);

export default router;
