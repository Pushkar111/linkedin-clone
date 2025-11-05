/**
 * Middleware: Check 1st-degree connection
 * Ensures users can only message their direct connections
 */

import Connection from '../models/Connection.js';

/**
 * Middleware to ensure messaging is only allowed between 1st-degree connections
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @param {Function} next - Express next middleware
 */
export const ensureFirstDegree = async (req, res, next) => {
  try {
    const currentUserId = req.user._id;
    const { recipientId } = req.body;

    // Can't message yourself
    if (currentUserId.toString() === recipientId?.toString()) {
      return res.status(400).json({
        success: false,
        message: "Cannot message yourself"
      });
    }

    // Check if 1st-degree connection exists
    const connection = await Connection.findOne({
      $or: [
        { user1: currentUserId, user2: recipientId, active: true },
        { user1: recipientId, user2: currentUserId, active: true }
      ]
    });

    if (!connection) {
      return res.status(403).json({
        success: false,
        message: "Messaging is only allowed between 1st-degree connections"
      });
    }

    // Connection exists, proceed
    next();
  } catch (error) {
    console.error('Error checking connection:', error);
    return res.status(500).json({
      success: false,
      message: "Error verifying connection status"
    });
  }
};

/**
 * Check connection before allowing conversation access
 * @param {Request} req - Express request object  
 * @param {Response} res - Express response object
 * @param {Function} next - Express next middleware
 */
export const ensureConversationParticipantConnection = async (req, res, next) => {
  try {
    const currentUserId = req.user._id;
    const { conversationId } = req.params;

    // Get conversation
    const Conversation = (await import('../models/Conversation.js')).default;
    const conversation = await Conversation.findById(conversationId);

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: "Conversation not found"
      });
    }

    // Get other participant
    const otherParticipantId = conversation.participants.find(
      p => p.toString() !== currentUserId.toString()
    );

    if (!otherParticipantId) {
      return res.status(403).json({
        success: false,
        message: "Invalid conversation"
      });
    }

    // Verify 1st-degree connection still exists
    const connection = await Connection.findOne({
      $or: [
        { user1: currentUserId, user2: otherParticipantId, active: true },
        { user1: otherParticipantId, user2: currentUserId, active: true }
      ]
    });

    if (!connection) {
      return res.status(403).json({
        success: false,
        message: "Messaging is only allowed between 1st-degree connections"
      });
    }

    next();
  } catch (error) {
    console.error('Error checking conversation connection:', error);
    return res.status(500).json({
      success: false,
      message: "Error verifying connection status"
    });
  }
};
