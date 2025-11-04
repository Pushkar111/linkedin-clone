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
  addComment,
  deleteComment,
  getUserPosts,
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
 * @route   POST /api/posts/:id/like
 * @desc    Toggle like on a post
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

export default router;
