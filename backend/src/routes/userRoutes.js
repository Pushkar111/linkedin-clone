/**
 * User Routes
 * Handle user profile and search endpoints
 */

import express from 'express';
import {
  getUserProfile,
  updateUserProfile,
  getUserPosts,
  searchUsers,
  getAllUsers,
  deactivateUser,
} from '../controllers/userController.js';
import { protect, optionalAuth } from '../middleware/auth.js';
import {
  updateProfileValidation,
  objectIdValidation,
  validate,
} from '../middleware/validation.js';
import upload from '../middleware/upload.js';

const router = express.Router();

/**
 * @route   GET /api/users/search
 * @desc    Search users by name or email
 * @access  Public
 */
router.get('/search', searchUsers);

/**
 * @route   GET /api/users
 * @desc    Get all users (for suggestions)
 * @access  Public (with optional auth)
 */
router.get('/', optionalAuth, getAllUsers);

/**
 * @route   GET /api/users/:id
 * @desc    Get user profile by ID
 * @access  Public
 */
router.get('/:id', objectIdValidation('id'), validate, getUserProfile);

/**
 * @route   PUT /api/users/:id
 * @desc    Update user profile
 * @access  Private (owner only)
 */
router.put(
  '/:id',
  protect,
  upload.single('profileImage'),
  objectIdValidation('id'),
  updateProfileValidation,
  validate,
  updateUserProfile
);

/**
 * @route   DELETE /api/users/:id
 * @desc    Deactivate user account
 * @access  Private (owner only)
 */
router.delete(
  '/:id',
  protect,
  objectIdValidation('id'),
  validate,
  deactivateUser
);

/**
 * @route   GET /api/users/:id/posts
 * @desc    Get all posts by a user
 * @access  Public
 */
router.get(
  '/:id/posts',
  objectIdValidation('id'),
  validate,
  getUserPosts
);

export default router;
