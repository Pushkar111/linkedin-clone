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
  followUser,
  unfollowUser,
  getUserConnections,
  getSuggestedConnections,
  updateExperience,
  updateEducation,
  updateSkills,
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
 * @route   GET /api/users/suggestions
 * @desc    Get suggested connections for current user
 * @access  Private
 */
router.get('/suggestions', protect, getSuggestedConnections);

/**
 * @route   GET /api/users
 * @desc    Get all users (for suggestions)
 * @access  Public (with optional auth)
 */
router.get('/', optionalAuth, getAllUsers);

/**
 * @route   GET /api/users/:id
 * @desc    Get user profile by ID
 * @access  Public (with optional auth to check if following)
 */
router.get('/:id', optionalAuth, objectIdValidation('id'), validate, getUserProfile);

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

/**
 * @route   POST /api/users/:id/follow
 * @desc    Follow a user
 * @access  Private
 */
router.post(
  '/:id/follow',
  protect,
  objectIdValidation('id'),
  validate,
  followUser
);

/**
 * @route   DELETE /api/users/:id/follow
 * @desc    Unfollow a user
 * @access  Private
 */
router.delete(
  '/:id/follow',
  protect,
  objectIdValidation('id'),
  validate,
  unfollowUser
);

/**
 * @route   GET /api/users/:id/connections
 * @desc    Get user's connections
 * @access  Public
 */
router.get(
  '/:id/connections',
  objectIdValidation('id'),
  validate,
  getUserConnections
);

/**
 * @route   PUT /api/users/:id/profile/experience
 * @desc    Update user experience section
 * @access  Private (owner only)
 */
router.put(
  '/:id/profile/experience',
  protect,
  objectIdValidation('id'),
  validate,
  updateExperience
);

/**
 * @route   PUT /api/users/:id/profile/education
 * @desc    Update user education section
 * @access  Private (owner only)
 */
router.put(
  '/:id/profile/education',
  protect,
  objectIdValidation('id'),
  validate,
  updateEducation
);

/**
 * @route   PUT /api/users/:id/profile/skills
 * @desc    Update user skills section
 * @access  Private (owner only)
 */
router.put(
  '/:id/profile/skills',
  protect,
  objectIdValidation('id'),
  validate,
  updateSkills
);

export default router;
