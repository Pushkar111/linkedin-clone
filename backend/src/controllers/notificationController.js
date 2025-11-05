/**
 * ============================================================================
 * NOTIFICATION CONTROLLER - Handle All Notification Operations
 * ============================================================================
 * 
 * Endpoints:
 * - GET /api/notifications - Get user's notifications (paginated)
 * - GET /api/notifications/unread-count - Get unread count
 * - POST /api/notifications/:id/read - Mark single as read
 * - POST /api/notifications/mark-all-read - Mark all as read
 * - DELETE /api/notifications/:id - Delete single notification
 * - DELETE /api/notifications/clear-all - Clear all read notifications
 * 
 * @version 1.0.0
 */

import Notification from '../models/Notification.js';

/**
 * @desc    Get user's notifications (paginated)
 * @route   GET /api/notifications
 * @access  Private
 */
export const getNotifications = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const type = req.query.type; // Optional filter by type
    const unreadOnly = req.query.unreadOnly === 'true';

    // Build query
    const query = { recipient: req.user._id };
    if (type) query.type = type;
    if (unreadOnly) query.read = false;

    // Get total count
    const total = await Notification.countDocuments(query);

    // Get notifications
    const notifications = await Notification.find(query)
      .populate('sender', 'fullName profilePicURL profile.headline')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    res.status(200).json({
      success: true,
      notifications,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
        hasMore: page * limit < total
      }
    });
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch notifications',
      error: error.message
    });
  }
};

/**
 * @desc    Get unread notification count
 * @route   GET /api/notifications/unread-count
 * @access  Private
 */
export const getUnreadCount = async (req, res) => {
  try {
    const count = await Notification.getUnreadCount(req.user._id);

    res.status(200).json({
      success: true,
      count
    });
  } catch (error) {
    console.error('Get unread count error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get unread count',
      error: error.message
    });
  }
};

/**
 * @desc    Mark single notification as read
 * @route   POST /api/notifications/:id/read
 * @access  Private
 */
export const markAsRead = async (req, res) => {
  try {
    const notification = await Notification.findOne({
      _id: req.params.id,
      recipient: req.user._id
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    if (!notification.read) {
      await notification.markAsRead();
    }

    res.status(200).json({
      success: true,
      message: 'Notification marked as read',
      notification
    });
  } catch (error) {
    console.error('Mark as read error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark notification as read',
      error: error.message
    });
  }
};

/**
 * @desc    Mark all notifications as read
 * @route   POST /api/notifications/mark-all-read
 * @access  Private
 */
export const markAllAsRead = async (req, res) => {
  try {
    const result = await Notification.updateMany(
      {
        recipient: req.user._id,
        read: false
      },
      {
        read: true,
        readAt: new Date()
      }
    );

    res.status(200).json({
      success: true,
      message: 'All notifications marked as read',
      count: result.modifiedCount
    });
  } catch (error) {
    console.error('Mark all as read error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark all notifications as read',
      error: error.message
    });
  }
};

/**
 * @desc    Delete single notification
 * @route   DELETE /api/notifications/:id
 * @access  Private
 */
export const deleteNotification = async (req, res) => {
  try {
    const notification = await Notification.findOneAndDelete({
      _id: req.params.id,
      recipient: req.user._id
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Notification deleted'
    });
  } catch (error) {
    console.error('Delete notification error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete notification',
      error: error.message
    });
  }
};

/**
 * @desc    Clear all read notifications
 * @route   DELETE /api/notifications/clear-all
 * @access  Private
 */
export const clearAllRead = async (req, res) => {
  try {
    const result = await Notification.deleteMany({
      recipient: req.user._id,
      read: true
    });

    res.status(200).json({
      success: true,
      message: 'All read notifications cleared',
      count: result.deletedCount
    });
  } catch (error) {
    console.error('Clear all notifications error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to clear notifications',
      error: error.message
    });
  }
};

/**
 * @desc    Get notification statistics
 * @route   GET /api/notifications/stats
 * @access  Private
 */
export const getNotificationStats = async (req, res) => {
  try {
    const userId = req.user._id;

    const [total, unread, byType] = await Promise.all([
      // Total notifications
      Notification.countDocuments({ recipient: userId }),
      
      // Unread count
      Notification.countDocuments({ recipient: userId, read: false }),
      
      // Count by type
      Notification.aggregate([
        { $match: { recipient: userId } },
        { $group: { _id: '$type', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ])
    ]);

    res.status(200).json({
      success: true,
      stats: {
        total,
        unread,
        read: total - unread,
        byType: byType.reduce((acc, item) => {
          acc[item._id] = item.count;
          return acc;
        }, {})
      }
    });
  } catch (error) {
    console.error('Get notification stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get notification statistics',
      error: error.message
    });
  }
};

/**
 * Helper function to create notification (can be called from other controllers)
 */
/**
 * ============================================================================
 * HELPER FUNCTION - Create Notification (called from other controllers)
 * ============================================================================
 */
export const createNotification = async ({
  recipient,
  sender,
  type,
  entityId,
  entityType,
  metadata = {}
}) => {
  try {
    // Don't send notification to self
    if (recipient.toString() === sender.toString()) {
      return null;
    }

    const notification = await Notification.createNotification({
      recipient,
      sender,
      type,
      entityId,
      entityType,
      metadata
    });

    // TODO: Emit socket.io event here
    // io.to(`user_${recipient}`).emit('new_notification', notification);

    return notification;
  } catch (error) {
    console.error('Create notification error:', error);
    return null;
  }
};
