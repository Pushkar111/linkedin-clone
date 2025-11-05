/**
 * Connection Routes
 * All routes for LinkedIn-style connection management
 */

import express from 'express';
import {
  getConnectionStatus,
  sendConnectionRequest,
  acceptConnectionRequest,
  ignoreConnectionRequest,
  withdrawConnectionRequest,
  removeConnection,
  getUserConnections,
  getPendingRequests,
  getSentRequests,
  getSuggestedConnections,
  getConnectionDegree,
  getMutualConnections,
  getConnectionStats
} from '../controllers/connectionController.js';
import { protect, optionalAuth } from '../middleware/auth.js';
import { objectIdValidation, validate } from '../middleware/validation.js';
import { body } from 'express-validator';

const router = express.Router();

// ========================================
// Connection Status & Management
// ========================================

/**
 * @route   GET /api/connections/status/:targetUserId
 * @desc    Get connection status between current user and target user
 * @access  Private
 */
router.get(
  '/status/:targetUserId',
  protect,
  objectIdValidation('targetUserId'),
  validate,
  getConnectionStatus
);

/**
 * @route   POST /api/connections/request
 * @desc    Send connection request to another user
 * @access  Private
 */
router.post(
  '/request',
  protect,
  [
    body('targetUserId')
      .notEmpty()
      .withMessage('Target user ID is required')
      .isMongoId()
      .withMessage('Invalid user ID'),
    body('message')
      .optional()
      .isLength({ max: 300 })
      .withMessage('Message cannot exceed 300 characters')
      .trim()
  ],
  validate,
  sendConnectionRequest
);

/**
 * @route   POST /api/connections/accept/:requestId
 * @desc    Accept a connection request
 * @access  Private
 */
router.post(
  '/accept/:requestId',
  protect,
  objectIdValidation('requestId'),
  validate,
  acceptConnectionRequest
);

/**
 * @route   POST /api/connections/ignore/:requestId
 * @desc    Ignore/reject a connection request
 * @access  Private
 */
router.post(
  '/ignore/:requestId',
  protect,
  objectIdValidation('requestId'),
  validate,
  ignoreConnectionRequest
);

/**
 * @route   DELETE /api/connections/request/:requestId
 * @desc    Withdraw a sent connection request
 * @access  Private
 */
router.delete(
  '/request/:requestId',
  protect,
  objectIdValidation('requestId'),
  validate,
  withdrawConnectionRequest
);

/**
 * @route   DELETE /api/connections/:connectionId
 * @desc    Remove an existing connection
 * @access  Private
 */
router.delete(
  '/:connectionId',
  protect,
  objectIdValidation('connectionId'),
  validate,
  removeConnection
);

// ========================================
// Connection Lists & Queries
// ========================================

/**
 * @route   GET /api/connections/user/:userId
 * @desc    Get all connections for a user
 * @access  Public
 */
router.get(
  '/user/:userId',
  objectIdValidation('userId'),
  validate,
  getUserConnections
);

/**
 * @route   GET /api/connections/requests/pending
 * @desc    Get pending connection requests (received by current user)
 * @access  Private
 */
router.get(
  '/requests/pending',
  protect,
  getPendingRequests
);

/**
 * @route   GET /api/connections/requests/sent
 * @desc    Get sent connection requests (by current user)
 * @access  Private
 */
router.get(
  '/requests/sent',
  protect,
  getSentRequests
);

/**
 * @route   GET /api/connections/suggestions
 * @desc    Get suggested connections (2nd/3rd degree)
 * @access  Private
 */
router.get(
  '/suggestions',
  protect,
  getSuggestedConnections
);

// ========================================
// Connection Analytics
// ========================================

/**
 * @route   GET /api/connections/degree/:user1/:user2
 * @desc    Get connection degree between two users (1st, 2nd, 3rd)
 * @access  Public
 */
router.get(
  '/degree/:user1/:user2',
  objectIdValidation('user1'),
  objectIdValidation('user2'),
  validate,
  getConnectionDegree
);

/**
 * @route   GET /api/connections/mutual/:userId1/:userId2
 * @desc    Get mutual connections between two users
 * @access  Public
 */
router.get(
  '/mutual/:userId1/:userId2',
  objectIdValidation('userId1'),
  objectIdValidation('userId2'),
  validate,
  getMutualConnections
);

/**
 * @route   GET /api/connections/stats/:userId
 * @desc    Get connection statistics for a user
 * @access  Private (own stats only)
 */
router.get(
  '/stats/:userId',
  protect,
  objectIdValidation('userId'),
  validate,
  getConnectionStats
);

export default router;
