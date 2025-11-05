/**
 * Conversation Model
 * Chat conversations between users
 */

import mongoose from "mongoose";

const conversationSchema = new mongoose.Schema(
  {
    participants: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    }],
    isGroup: {
      type: Boolean,
      default: false
    },
    groupName: {
      type: String,
      trim: true,
      maxlength: 100
    },
    groupPhoto: {
      type: String
    },
    lastMessage: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Message"
    },
    lastMessageAt: {
      type: Date,
      default: Date.now,
      index: true
    },
    unreadCount: {
      type: Map,
      of: Number,
      default: {}
    },
    archived: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    }],
    muted: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    }]
  },
  {
    timestamps: true
  }
);

// Indexes for performance
conversationSchema.index({ participants: 1, lastMessageAt: -1 });
conversationSchema.index({ isGroup: 1, participants: 1 });

// Validation: At least 2 participants
conversationSchema.pre("save", function(next) {
  if (this.participants.length < 2) {
    next(new Error("Conversation must have at least 2 participants"));
  } else {
    next();
  }
});

// Instance method: Add participant
conversationSchema.methods.addParticipant = function(userId) {
  if (!this.participants.includes(userId)) {
    this.participants.push(userId);
    this.unreadCount.set(userId.toString(), 0);
  }
  return this.save();
};

// Instance method: Remove participant
conversationSchema.methods.removeParticipant = function(userId) {
  this.participants = this.participants.filter(
    id => id.toString() !== userId.toString()
  );
  this.unreadCount.delete(userId.toString());
  return this.save();
};

// Instance method: Increment unread count for users except sender
conversationSchema.methods.incrementUnread = function(senderId) {
  this.participants.forEach(participantId => {
    const participantIdStr = participantId.toString();
    const senderIdStr = senderId.toString();
    
    if (participantIdStr !== senderIdStr) {
      const currentCount = this.unreadCount.get(participantIdStr) || 0;
      this.unreadCount.set(participantIdStr, currentCount + 1);
    }
  });
  
  return this.save();
};

// Instance method: Reset unread count for user
conversationSchema.methods.resetUnread = function(userId) {
  this.unreadCount.set(userId.toString(), 0);
  return this.save();
};

// Instance method: Get unread count for user
conversationSchema.methods.getUnreadCount = function(userId) {
  return this.unreadCount.get(userId.toString()) || 0;
};

// Instance method: Archive for user
conversationSchema.methods.archiveForUser = function(userId) {
  if (!this.archived.includes(userId)) {
    this.archived.push(userId);
  }
  return this.save();
};

// Instance method: Unarchive for user
conversationSchema.methods.unarchiveForUser = function(userId) {
  this.archived = this.archived.filter(
    id => id.toString() !== userId.toString()
  );
  return this.save();
};

// Instance method: Mute for user
conversationSchema.methods.muteForUser = function(userId) {
  if (!this.muted.includes(userId)) {
    this.muted.push(userId);
  }
  return this.save();
};

// Instance method: Unmute for user
conversationSchema.methods.unmuteForUser = function(userId) {
  this.muted = this.muted.filter(
    id => id.toString() !== userId.toString()
  );
  return this.save();
};

// Static method: Find or create conversation between users
conversationSchema.statics.findOrCreate = async function(participantIds) {
  // Sort participant IDs for consistent lookup
  const sortedIds = participantIds.sort();
  
  // Look for existing conversation with these exact participants
  let conversation = await this.findOne({
    participants: { $all: sortedIds, $size: sortedIds.length },
    isGroup: false
  });
  
  if (!conversation) {
    // Create new conversation
    conversation = await this.create({
      participants: sortedIds,
      isGroup: false
    });
    
    // Initialize unread counts
    sortedIds.forEach(id => {
      conversation.unreadCount.set(id.toString(), 0);
    });
    
    await conversation.save();
  }
  
  return conversation;
};

// Static method: Get conversations for user
conversationSchema.statics.getUserConversations = async function(
  userId,
  page = 1,
  limit = 20
) {
  const skip = (page - 1) * limit;
  
  const conversations = await this.find({
    participants: userId,
    archived: { $ne: userId }
  })
    .sort({ lastMessageAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate("participants", "fullName profilePicURL headline")
    .populate({
      path: "lastMessage",
      select: "content sender createdAt",
      populate: {
        path: "sender",
        select: "fullName"
      }
    })
    .lean();
  
  // Add other participant info for 1-on-1 chats
  conversations.forEach(conv => {
    if (!conv.isGroup) {
      conv.otherParticipant = conv.participants.find(
        p => p._id.toString() !== userId.toString()
      );
    }
    
    // Add unread count for this user
    conv.unreadCountForUser = conv.unreadCount?.[userId.toString()] || 0;
  });
  
  return conversations;
};

const Conversation = mongoose.model("Conversation", conversationSchema);

export default Conversation;
