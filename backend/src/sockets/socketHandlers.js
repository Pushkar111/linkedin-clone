/**
 * Socket.io Event Handlers
 * Real-time messaging with 1st-degree checks, typing indicators, and presence
 */

import Message from '../models/Message.js';
import Conversation from '../models/Conversation.js';
import Connection from '../models/Connection.js';

// Store online users: userId -> Set of socketIds (for multiple tabs/devices)
const onlineUsers = new Map();

// Store typing states: conversationId -> Set of userIds currently typing
const typingStates = new Map();

/**
 * Initialize all socket event handlers
 */
export const initializeSocketHandlers = (io) => {
  io.on('connection', (socket) => {
    const userId = socket.user._id.toString();
    console.log(`\n🟢 ========== NEW SOCKET CONNECTION ==========`);
    console.log(`✅ User: ${socket.user.fullName} (${userId})`);
    console.log(`🔑 Socket ID: ${socket.id}`);
    console.log(`📊 Total online users before: ${onlineUsers.size}`);

    // Store userId in socket for later cleanup
    socket.userId = userId;

    // Add user to online users (support multiple sockets per user)
    const userSockets = onlineUsers.get(userId) || new Set();
    const wasOffline = userSockets.size === 0;
    userSockets.add(socket.id);
    onlineUsers.set(userId, userSockets);
    
    console.log(`👤 User ${userId} now has ${userSockets.size} active socket(s)`);
    console.log(`📊 Total online users after: ${onlineUsers.size}`);

    // Broadcast user is online (only if transitioning from offline)
    if (wasOffline) {
      io.emit('user:status', { userId, status: 'online', timestamp: Date.now() });
      console.log(`📡 Broadcasted online status for user ${userId}`);
    }

    // Send list of online users to new connection
    const onlineUserIds = Array.from(onlineUsers.keys());
    socket.emit('online_users', { userIds: onlineUserIds });
    console.log(`📋 Sent ${onlineUserIds.length} online users to ${userId}`);

    // Monitor event listener count to detect memory leaks
    socket.onAny((eventName) => {
      const listenerCount = socket.listenerCount(eventName);
      if (listenerCount > 10) {
        console.warn(`⚠️  WARNING: Too many listeners (${listenerCount}) for event "${eventName}" on socket ${socket.id}`);
        console.warn(`⚠️  This may indicate a memory leak!`);
      }
    });

    /**
     * Join a conversation room
     * Note: Using 'once' for one-time events would prevent duplicates,
     * but these events can fire multiple times legitimately, so we use 'on'
     */
    socket.on('join_conversation', async ({ conversationId }) => {
      try {
        console.log(`🔔 join_conversation event received from ${userId} for conversation ${conversationId}`);
        
        // Check if already in room (idempotent operation)
        if (socket.rooms.has(conversationId)) {
          console.log(`ℹ️  User ${userId} already in conversation ${conversationId}`);
          return;
        }
        
        // Verify user is participant
        const conversation = await Conversation.findById(conversationId);
        
        if (!conversation) {
          console.log(`❌ Conversation ${conversationId} not found`);
          return socket.emit('error', { message: 'Conversation not found' });
        }

        const isParticipant = conversation.participants.some(
          p => p.toString() === userId
        );

        if (!isParticipant) {
          console.log(`❌ User ${userId} not authorized for conversation ${conversationId}`);
          return socket.emit('error', { message: 'Not authorized' });
        }

        // Join the room
        socket.join(conversationId);
        const socketsInRoom = io.sockets.adapter.rooms.get(conversationId);
        const clientCount = socketsInRoom ? socketsInRoom.size : 0;
        console.log(`✅ User ${userId} joined conversation ${conversationId}`);
        console.log(`👥 Total clients in room: ${clientCount}`);

        // Mark messages as read
        await conversation.resetUnread(userId);
        
        // Emit updated unread conversations count to this user
        await emitUnreadConversationsUpdate(io, userId);
        
        // Notify others in the room
        socket.to(conversationId).emit('user_joined', { 
          userId,
          conversationId 
        });

      } catch (error) {
        console.error('Error joining conversation:', error);
        socket.emit('error', { message: 'Failed to join conversation' });
      }
    });

    /**
     * Leave a conversation room
     */
    socket.on('leave_conversation', ({ conversationId }) => {
      socket.leave(conversationId);
      console.log(`📤 User ${userId} left conversation ${conversationId}`);
      
      socket.to(conversationId).emit('user_left', { 
        userId,
        conversationId 
      });
    });

    /**
     * Send a message (with 1st-degree connection validation)
     */
    socket.on('send_message', async ({ conversationId, content, tempId }) => {
      try {
        // Verify user is participant
        const conversation = await Conversation.findById(conversationId);
        
        if (!conversation) {
          return socket.emit('message:error', { 
            message: 'Conversation not found',
            tempId 
          });
        }

        const isParticipant = conversation.participants.some(
          p => p.toString() === userId
        );

        if (!isParticipant) {
          return socket.emit('message:error', { 
            message: 'Not authorized',
            tempId 
          });
        }

        // Get other participant
        const otherParticipantId = conversation.participants.find(
          p => p.toString() !== userId
        );

        // Validate 1st-degree connection (server-side enforcement)
        const connection = await Connection.findOne({
          $or: [
            { user1: userId, user2: otherParticipantId, active: true },
            { user1: otherParticipantId, user2: userId, active: true }
          ]
        });

        if (!connection) {
          return socket.emit('message:error', {
            message: 'Messaging is only allowed between 1st-degree connections',
            tempId,
            code: 'NOT_CONNECTED'
          });
        }

        // Create message
        const message = await Message.create({
          conversation: conversationId,
          sender: userId,
          content: content.trim()
        });

        // Populate sender
        await message.populate('sender', 'fullName profilePicURL headline');

        // Update conversation
        conversation.lastMessage = message._id;
        conversation.lastMessageAt = message.createdAt;
        
        // Increment unread for other participants
        conversation.participants.forEach(participantId => {
          const pid = participantId.toString();
          if (pid !== userId) {
            conversation.incrementUnread(pid);
          }
        });

        await conversation.save();

        // Broadcast to all in the conversation room
        io.to(conversationId).emit('new_message', { 
          message,
          conversationId,
          tempId // Send back temp ID for client-side replacement
        });

        // Emit updated unread conversations count to OTHER participants
        conversation.participants.forEach(async (participantId) => {
          const pid = participantId.toString();
          if (pid !== userId) {
            await emitUnreadConversationsUpdate(io, pid);
          }
        });

        console.log(`💬 Message sent in conversation ${conversationId} by user ${userId}`);

      } catch (error) {
        console.error('Error sending message:', error);
        socket.emit('message:error', { 
          message: 'Failed to send message',
          tempId 
        });
      }
    });

    /**
     * Typing indicator (start)
     */
    socket.on('typing:start', ({ conversationId }) => {
      // Track typing state
      const typingUsers = typingStates.get(conversationId) || new Set();
      typingUsers.add(userId);
      typingStates.set(conversationId, typingUsers);

      // Emit to others in conversation
      socket.to(conversationId).emit('typing:show', {
        userId,
        userName: socket.user.fullName,
        conversationId
      });

      console.log(`⌨️  User ${userId} started typing in ${conversationId}`);
    });

    /**
     * Typing indicator (stop)
     */
    socket.on('typing:stop', ({ conversationId }) => {
      // Remove from typing state
      const typingUsers = typingStates.get(conversationId);
      if (typingUsers) {
        typingUsers.delete(userId);
        if (typingUsers.size === 0) {
          typingStates.delete(conversationId);
        } else {
          typingStates.set(conversationId, typingUsers);
        }
      }

      // Emit to others in conversation
      socket.to(conversationId).emit('typing:hide', {
        userId,
        conversationId
      });

      console.log(`⌨️  User ${userId} stopped typing in ${conversationId}`);
    });

    /**
     * Legacy typing indicator support (backward compatible)
     */
    socket.on('typing', ({ conversationId, isTyping }) => {
      if (isTyping) {
        socket.emit('typing:start', { conversationId });
      } else {
        socket.emit('typing:stop', { conversationId });
      }
    });

    /**
     * Handle conversation opened (mark as read)
     */
    socket.on('conversation:opened', async ({ conversationId }) => {
      try {
        const conversation = await Conversation.findById(conversationId);
        
        if (!conversation) {
          return socket.emit('error', { message: 'Conversation not found' });
        }

        const isParticipant = conversation.participants.some(
          p => p.toString() === userId
        );

        if (!isParticipant) {
          return socket.emit('error', { message: 'Not authorized' });
        }

        // Reset unread count for this user
        await conversation.resetUnread(userId);

        // Emit updated unread conversations count
        await emitUnreadConversationsUpdate(io, userId);

        console.log(`📖 Conversation ${conversationId} opened by user ${userId}`);

      } catch (error) {
        console.error('Error handling conversation opened:', error);
      }
    });

    /**
     * Mark messages as read
     */
    socket.on('mark_as_read', async ({ conversationId }) => {
      try {
        const conversation = await Conversation.findById(conversationId);
        
        if (!conversation) {
          return socket.emit('error', { message: 'Conversation not found' });
        }

        // Reset unread count
        await conversation.resetUnread(userId);

        // Mark all unread messages as read
        const messages = await Message.find({
          conversation: conversationId,
          sender: { $ne: userId }
        });

        await Promise.all(
          messages.map(msg => msg.markAsRead(userId))
        );

        // Emit updated unread conversations count to this user
        await emitUnreadConversationsUpdate(io, userId);
        
        // Notify others that messages were read
        socket.to(conversationId).emit('messages_read', {
          userId,
          conversationId
        });

      } catch (error) {
        console.error('Error marking as read:', error);
      }
    });

    /**
     * Handle disconnection (multi-socket cleanup with memory leak prevention)
     */
    socket.on('disconnect', (reason) => {
      console.log(`\n🔴 ========== SOCKET DISCONNECT ==========`);
      console.log(`❌ User disconnecting: ${socket.user.fullName} (${userId})`);
      console.log(`🔌 Socket ID: ${socket.id}`);
      console.log(`📋 Disconnect reason: ${reason}`);
      
      // Remove this specific socket from online users
      const userSockets = onlineUsers.get(userId);
      if (userSockets) {
        userSockets.delete(socket.id);
        console.log(`👤 User ${userId} now has ${userSockets.size} active socket(s)`);
        
        if (userSockets.size === 0) {
          // User completely offline - remove from map
          onlineUsers.delete(userId);
          
          // Broadcast user is offline with last seen
          io.emit('user:status', { 
            userId, 
            status: 'offline', 
            lastSeen: Date.now() 
          });
          console.log(`📡 Broadcasted offline status for user ${userId}`);
          console.log(`📊 Total online users after: ${onlineUsers.size}`);
        } else {
          // Still has other sockets, update the map
          onlineUsers.set(userId, userSockets);
        }
      } else {
        console.warn(`⚠️  Socket ${socket.id} not found in onlineUsers map`);
      }

      // Clean up typing states for this user
      typingStates.forEach((typingUsers, conversationId) => {
        if (typingUsers.has(userId)) {
          typingUsers.delete(userId);
          if (typingUsers.size === 0) {
            typingStates.delete(conversationId);
          } else {
            typingStates.set(conversationId, typingUsers);
          }
          // Notify others that user stopped typing
          socket.to(conversationId).emit('typing:hide', { userId, conversationId });
        }
      });

      // Leave all rooms (defensive cleanup)
      const rooms = Array.from(socket.rooms).filter(room => room !== socket.id);
      rooms.forEach(room => {
        socket.leave(room);
        console.log(`📤 Left room: ${room}`);
      });

      // Remove ALL event listeners to prevent memory leaks
      socket.removeAllListeners();
      console.log(`🧹 Removed all event listeners from socket ${socket.id}`);

      // Clear socket reference
      socket.userId = null;
      
      console.log(`✅ Cleanup complete for socket ${socket.id}`);
      console.log(`🔴 ========== DISCONNECT END ==========\n`);
    });

    /**
     * Handle errors
     */
    socket.on('error', (error) => {
      console.error('Socket error:', error);
    });
  });
};

/**
 * Calculate unread conversations count for a user
 */
const getUnreadConversationsCount = async (userId) => {
  try {
    const conversations = await Conversation.find({
      participants: userId,
      archived: { $ne: userId }
    });

    let unreadCount = 0;
    conversations.forEach(conv => {
      if (conv.getUnreadCount(userId) > 0) {
        unreadCount++;
      }
    });

    return unreadCount;
  } catch (error) {
    console.error('Error calculating unread conversations:', error);
    return 0;
  }
};

/**
 * Emit unread conversations update to a specific user
 */
const emitUnreadConversationsUpdate = async (io, userId) => {
  try {
    const unreadConversations = await getUnreadConversationsCount(userId);
    const socketId = onlineUsers.get(userId);
    
    if (socketId) {
      io.to(socketId).emit('conversations:unread_update', { 
        unreadConversations 
      });
      console.log(`📬 Emitted unread update to user ${userId}: ${unreadConversations} conversations`);
    }
  } catch (error) {
    console.error('Error emitting unread update:', error);
  }
};

/**
 * Get online users
 */
export const getOnlineUsers = () => {
  return Array.from(onlineUsers.keys());
};

/**
 * Check if user is online
 */
export const isUserOnline = (userId) => {
  return onlineUsers.has(userId);
};
