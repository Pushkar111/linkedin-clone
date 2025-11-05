/**
 * Message Model
 * Individual messages within conversations
 */

import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    conversation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Conversation",
      required: true,
      index: true
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    content: {
      type: String,
      required: true,
      trim: true,
      maxlength: 5000
    },
    attachments: [{
      type: {
        type: String,
        enum: ["image", "document", "video"],
        required: true
      },
      url: {
        type: String,
        required: true
      },
      filename: String,
      size: Number,
      mimeType: String
    }],
    readBy: [{
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
      },
      readAt: {
        type: Date,
        default: Date.now
      }
    }],
    deleted: {
      type: Boolean,
      default: false
    },
    deletedBy: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    }]
  },
  {
    timestamps: true
  }
);

// Indexes for performance
messageSchema.index({ conversation: 1, createdAt: -1 });
messageSchema.index({ sender: 1, createdAt: -1 });

// Instance method: Mark as read by user
messageSchema.methods.markAsRead = function(userId) {
  const alreadyRead = this.readBy.some(
    read => read.user.toString() === userId.toString()
  );
  
  if (!alreadyRead) {
    this.readBy.push({ user: userId, readAt: new Date() });
  }
  
  return this.save();
};

// Instance method: Check if read by user
messageSchema.methods.isReadBy = function(userId) {
  return this.readBy.some(
    read => read.user.toString() === userId.toString()
  );
};

// Instance method: Soft delete for user
messageSchema.methods.deleteForUser = function(userId) {
  if (!this.deletedBy.includes(userId)) {
    this.deletedBy.push(userId);
  }
  
  // If all participants deleted, mark as deleted
  return this.save();
};

// Static method: Get messages for conversation
messageSchema.statics.getConversationMessages = async function(
  conversationId,
  userId,
  page = 1,
  limit = 50
) {
  const skip = (page - 1) * limit;
  
  const messages = await this.find({
    conversation: conversationId,
    deletedBy: { $ne: userId }
  })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate("sender", "fullName profilePicURL headline")
    .lean();
  
  return messages.reverse(); // Return in chronological order
};

// Static method: Get unread count for user in conversation
messageSchema.statics.getUnreadCount = async function(conversationId, userId) {
  return await this.countDocuments({
    conversation: conversationId,
    sender: { $ne: userId },
    "readBy.user": { $ne: userId },
    deletedBy: { $ne: userId }
  });
};

const Message = mongoose.model("Message", messageSchema);

export default Message;
