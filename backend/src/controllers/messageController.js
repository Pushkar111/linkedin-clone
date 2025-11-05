/**
 * Message Controller
 * Handles all messaging operations
 */

import Message from "../models/Message.js";
import Conversation from "../models/Conversation.js";
import User from "../models/User.js";

/**
 * Get all conversations for current user
 * GET /api/messages/conversations
 */
export const getConversations = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;

    const conversations = await Conversation.getUserConversations(userId, page, limit);

    res.json({
      success: true,
      conversations,
      page,
      hasMore: conversations.length === limit
    });
  } catch (error) {
    console.error("Error getting conversations:", error);
    next(error);
  }
};

/**
 * Get or create conversation with specific user
 * POST /api/messages/conversation
 * Body: { recipientId }
 */
export const getOrCreateConversation = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { recipientId } = req.body;

    if (!recipientId) {
      return res.status(400).json({
        success: false,
        message: "Recipient ID is required"
      });
    }

    // Check if recipient exists
    const recipient = await User.findById(recipientId);
    if (!recipient) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    // Find or create conversation
    const conversation = await Conversation.findOrCreate([userId, recipientId]);

    // Populate participants with full user info
    await conversation.populate("participants", "fullName profilePicURL headline email");
    await conversation.populate({
      path: "lastMessage",
      select: "content sender createdAt",
      populate: {
        path: "sender",
        select: "fullName profilePicURL"
      }
    });

    // Add other participant info
    const conversationObj = conversation.toObject();
    const otherParticipant = conversationObj.participants.find(
      p => p._id.toString() !== userId.toString()
    );
    
    conversationObj.otherParticipant = otherParticipant;
    conversationObj.unreadCountForUser = conversation.getUnreadCount(userId);

    console.log("📩 Backend - Other participant:", JSON.stringify(otherParticipant, null, 2));

    res.json({
      success: true,
      conversation: conversationObj
    });
  } catch (error) {
    console.error("Error getting/creating conversation:", error);
    next(error);
  }
};

/**
 * Get messages for a conversation
 * GET /api/messages/conversation/:conversationId
 */
export const getMessages = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { conversationId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;

    // Verify user is participant
    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: "Conversation not found"
      });
    }

    const isParticipant = conversation.participants.some(
      p => p.toString() === userId.toString()
    );

    if (!isParticipant) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to view this conversation"
      });
    }

    // Get messages
    const messages = await Message.getConversationMessages(
      conversationId,
      userId,
      page,
      limit
    );

    res.json({
      success: true,
      messages,
      page,
      hasMore: messages.length === limit
    });
  } catch (error) {
    console.error("Error getting messages:", error);
    next(error);
  }
};

/**
 * Send a message
 * POST /api/messages/send
 * Body: { conversationId, content, attachments }
 */
export const sendMessage = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { conversationId, content, attachments = [] } = req.body;

    if (!conversationId || !content?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Conversation ID and content are required"
      });
    }

    // Verify user is participant
    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: "Conversation not found"
      });
    }

    const isParticipant = conversation.participants.some(
      p => p.toString() === userId.toString()
    );

    if (!isParticipant) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to send messages in this conversation"
      });
    }

    // Create message
    const message = await Message.create({
      conversation: conversationId,
      sender: userId,
      content: content.trim(),
      attachments,
      readBy: [{ user: userId }] // Sender has read their own message
    });

    // Populate sender info
    await message.populate("sender", "fullName profilePicURL headline");

    // Update conversation
    conversation.lastMessage = message._id;
    conversation.lastMessageAt = message.createdAt;
    await conversation.incrementUnread(userId); // This saves the conversation

    res.status(201).json({
      success: true,
      message
    });

    // Emit socket event for real-time updates
    const io = req.app.get('io');
    if (io) {
      const room = conversationId.toString();
      const socketsInRoom = io.sockets.adapter.rooms.get(room);
      const clientCount = socketsInRoom ? socketsInRoom.size : 0;
      
      console.log(`📨 Socket.io: Emitting new_message to room ${room}`);
      console.log(`👥 Clients in room: ${clientCount}`);
      
      io.to(room).emit('new_message', {
        message,
        conversationId
      });
      
      console.log(`✅ Event emitted with message ID: ${message._id}`);
    } else {
      console.log('⚠️ Socket.io not available on this request');
    }
  } catch (error) {
    console.error("Error sending message:", error);
    next(error);
  }
};

/**
 * Mark messages as read
 * POST /api/messages/conversation/:conversationId/read
 */
export const markAsRead = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { conversationId } = req.params;

    // Verify conversation exists and user is participant
    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: "Conversation not found"
      });
    }

    const isParticipant = conversation.participants.some(
      p => p.toString() === userId.toString()
    );

    if (!isParticipant) {
      return res.status(403).json({
        success: false,
        message: "Not authorized"
      });
    }

    // Mark all unread messages as read
    const unreadMessages = await Message.find({
      conversation: conversationId,
      sender: { $ne: userId },
      "readBy.user": { $ne: userId },
      deletedBy: { $ne: userId }
    });

    await Promise.all(
      unreadMessages.map(msg => msg.markAsRead(userId))
    );

    // Reset unread count in conversation
    await conversation.resetUnread(userId);

    res.json({
      success: true,
      message: `Marked ${unreadMessages.length} messages as read`
    });
  } catch (error) {
    console.error("Error marking messages as read:", error);
    next(error);
  }
};

/**
 * Delete a message
 * DELETE /api/messages/:messageId
 */
export const deleteMessage = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { messageId } = req.params;

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({
        success: false,
        message: "Message not found"
      });
    }

    // Verify user is sender or participant
    const conversation = await Conversation.findById(message.conversation);
    const isParticipant = conversation.participants.some(
      p => p.toString() === userId.toString()
    );

    if (!isParticipant) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to delete this message"
      });
    }

    // Soft delete for user
    await message.deleteForUser(userId);

    res.json({
      success: true,
      message: "Message deleted"
    });
  } catch (error) {
    console.error("Error deleting message:", error);
    next(error);
  }
};

/**
 * Archive conversation
 * POST /api/messages/conversation/:conversationId/archive
 */
export const archiveConversation = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { conversationId } = req.params;

    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: "Conversation not found"
      });
    }

    await conversation.archiveForUser(userId);

    res.json({
      success: true,
      message: "Conversation archived"
    });
  } catch (error) {
    console.error("Error archiving conversation:", error);
    next(error);
  }
};

/**
 * Get total unread message count (total messages)
 * GET /api/messages/unread-count
 */
export const getUnreadCount = async (req, res, next) => {
  try {
    const userId = req.user._id;

    const conversations = await Conversation.find({
      participants: userId,
      archived: { $ne: userId }
    });

    let totalUnread = 0;
    conversations.forEach(conv => {
      totalUnread += conv.getUnreadCount(userId);
    });

    res.json({
      success: true,
      count: totalUnread
    });
  } catch (error) {
    console.error("Error getting unread count:", error);
    next(error);
  }
};

/**
 * Get count of conversations with unread messages (number of people)
 * GET /api/messages/unread-conversations-count
 */
export const getUnreadConversationsCount = async (req, res, next) => {
  try {
    const userId = req.user._id;

    // Find all conversations where user is a participant and has unread messages
    const conversations = await Conversation.find({
      participants: userId,
      archived: { $ne: userId }
    });

    // Count conversations with unread messages > 0
    let unreadConversationsCount = 0;
    conversations.forEach(conv => {
      const unreadCount = conv.getUnreadCount(userId);
      if (unreadCount > 0) {
        unreadConversationsCount++;
      }
    });

    res.json({
      success: true,
      unreadConversations: unreadConversationsCount
    });
  } catch (error) {
    console.error("Error getting unread conversations count:", error);
    next(error);
  }
};
