/**
 * ============================================================================
 * NOTIFICATION ROUTES - API Endpoints
 * ============================================================================
 * 
 * All routes require authentication
 * 
 * @version 1.0.0
 */

import express from 'express';
import {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  clearAllRead,
  getNotificationStats
} from '../controllers/notificationController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

// GET routes
router.get('/', getNotifications);
router.get('/unread-count', getUnreadCount);
router.get('/stats', getNotificationStats);

// POST routes
router.post('/mark-all-read', markAllAsRead);
router.post('/:id/read', markAsRead);

// DELETE routes
router.delete('/clear-all', clearAllRead);
router.delete('/:id', deleteNotification);

export default router;
