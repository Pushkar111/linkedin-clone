/**
 * ============================================================================
 * NOTIFICATION MODEL - Real-time User Notifications
 * ============================================================================
 * 
 * Handles all notification types:
 * - CONNECTION_REQUEST: Someone sent you a connection request
 * - CONNECTION_ACCEPTED: Your connection request was accepted
 * - POST_LIKE: Someone liked your post
 * - POST_COMMENT: Someone commented on your post
 * - PROFILE_VIEW: Someone viewed your profile
 * - SKILL_ENDORSEMENT: Someone endorsed your skill
 * - MENTION: Someone mentioned you in a post/comment
 * - POST_SHARE: Someone shared your post
 * 
 * @version 1.0.0
 */

import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
  // Recipient of the notification
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },

  // Sender/Actor (who performed the action)
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  // Notification type
  type: {
    type: String,
    required: true,
    enum: [
      'CONNECTION_REQUEST',
      'CONNECTION_ACCEPTED',
      'POST_LIKE',
      'POST_COMMENT',
      'PROFILE_VIEW',
      'SKILL_ENDORSEMENT',
      'MENTION',
      'POST_SHARE',
      'MESSAGE'
    ],
    index: true
  },

  // Notification title (auto-generated or custom)
  title: {
    type: String,
    required: true
  },

  // Notification message/description
  message: {
    type: String,
    required: true
  },

  // Link to navigate to when clicked
  link: {
    type: String,
    required: true
  },

  // Read status
  read: {
    type: Boolean,
    default: false,
    index: true
  },

  // Read timestamp
  readAt: {
    type: Date
  },

  // Related entity ID (post, comment, connection request, etc.)
  entityId: {
    type: mongoose.Schema.Types.ObjectId
  },

  // Related entity type
  entityType: {
    type: String,
    enum: ['Post', 'Comment', 'ConnectionRequest', 'Connection', 'User', 'Skill']
  },

  // Additional metadata (flexible field for extra data)
  metadata: {
    type: mongoose.Schema.Types.Mixed
  }
}, {
  timestamps: true
});

// Compound indexes for efficient queries
notificationSchema.index({ recipient: 1, read: 1, createdAt: -1 });
notificationSchema.index({ recipient: 1, type: 1, createdAt: -1 });
notificationSchema.index({ recipient: 1, createdAt: -1 });

// Auto-delete notifications older than 90 days (optional)
notificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 7776000 }); // 90 days

/**
 * Static method: Create notification with auto-generated content
 */
notificationSchema.statics.createNotification = async function({
  recipient,
  sender,
  type,
  entityId,
  entityType,
  metadata = {}
}) {
  // Generate title and message based on type
  const senderUser = await mongoose.model('User').findById(sender).select('fullName profilePicURL');
  const senderName = senderUser?.fullName || 'Someone';

  let title, message, link;

  switch (type) {
    case 'CONNECTION_REQUEST':
      title = 'New connection request';
      message = `${senderName} sent you a connection request`;
      link = `/linkedin/profile/${sender}`;
      break;

    case 'CONNECTION_ACCEPTED':
      title = 'Connection accepted';
      message = `${senderName} accepted your connection request`;
      link = `/linkedin/profile/${sender}`;
      break;

    case 'POST_LIKE':
      title = 'New like on your post';
      message = `${senderName} liked your post`;
      link = `/linkedin/post/${entityId}`;
      break;

    case 'POST_COMMENT':
      title = 'New comment on your post';
      message = `${senderName} commented on your post`;
      link = `/linkedin/post/${entityId}`;
      break;

    case 'PROFILE_VIEW':
      title = 'Profile view';
      message = `${senderName} viewed your profile`;
      link = `/linkedin/profile/${sender}`;
      break;

    case 'SKILL_ENDORSEMENT':
      title = 'New skill endorsement';
      message = `${senderName} endorsed your skill: ${metadata.skillName || 'a skill'}`;
      link = `/linkedin/profile/${recipient}`;
      break;

    case 'MENTION':
      title = 'You were mentioned';
      message = `${senderName} mentioned you in a ${metadata.mentionType || 'post'}`;
      link = metadata.link || `/linkedin/post/${entityId}`;
      break;

    case 'POST_SHARE':
      title = 'Your post was shared';
      message = `${senderName} shared your post`;
      link = `/linkedin/post/${entityId}`;
      break;

    case 'MESSAGE':
      title = 'New message';
      message = `${senderName} sent you a message`;
      link = `/linkedin/messaging/${sender}`;
      break;

    default:
      title = 'New notification';
      message = `You have a new notification from ${senderName}`;
      link = '/linkedin/notifications';
  }

  // Create the notification
  const notification = await this.create({
    recipient,
    sender,
    type,
    title,
    message,
    link,
    entityId,
    entityType,
    metadata
  });

  return notification.populate('sender', 'fullName profilePicURL');
};

/**
 * Instance method: Mark as read
 */
notificationSchema.methods.markAsRead = async function() {
  this.read = true;
  this.readAt = new Date();
  return this.save();
};

/**
 * Static method: Mark multiple notifications as read
 */
notificationSchema.statics.markManyAsRead = async function(notificationIds, userId) {
  return this.updateMany(
    {
      _id: { $in: notificationIds },
      recipient: userId
    },
    {
      read: true,
      readAt: new Date()
    }
  );
};

/**
 * Static method: Get unread count for user
 */
notificationSchema.statics.getUnreadCount = async function(userId) {
  return this.countDocuments({
    recipient: userId,
    read: false
  });
};

/**
 * Static method: Delete old read notifications (cleanup)
 */
notificationSchema.statics.cleanupOldNotifications = async function(daysOld = 30) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysOld);

  return this.deleteMany({
    read: true,
    readAt: { $lt: cutoffDate }
  });
};

// Virtuals
notificationSchema.virtual('isNew').get(function() {
  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
  return this.createdAt > fiveMinutesAgo;
});

// Ensure virtuals are included in JSON
notificationSchema.set('toJSON', { virtuals: true });
notificationSchema.set('toObject', { virtuals: true });

const Notification = mongoose.model('Notification', notificationSchema);

export default Notification;
