/**
 * ConnectionRequest Model
 * Represents pending connection requests between users
 */

import mongoose from 'mongoose';

const connectionRequestSchema = new mongoose.Schema(
  {
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Sender is required'],
      index: true,
    },
    receiver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Receiver is required'],
      index: true,
    },
    message: {
      type: String,
      trim: true,
      maxlength: [300, 'Message cannot exceed 300 characters'],
      default: '',
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'ignored', 'withdrawn'],
      default: 'pending',
      index: true,
    },
    respondedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Compound indexes for efficient queries
connectionRequestSchema.index({ sender: 1, receiver: 1 });
connectionRequestSchema.index({ receiver: 1, status: 1, createdAt: -1 });
connectionRequestSchema.index({ sender: 1, status: 1, createdAt: -1 });

// Unique constraint: Only one pending request between two users
connectionRequestSchema.index(
  { sender: 1, receiver: 1, status: 1 },
  { 
    unique: true,
    partialFilterExpression: { status: 'pending' }
  }
);

/**
 * Pre-save validation: Ensure sender and receiver are different
 */
connectionRequestSchema.pre('save', function(next) {
  if (this.sender.toString() === this.receiver.toString()) {
    return next(new Error('Cannot send connection request to yourself'));
  }
  next();
});

/**
 * Static method: Find pending request between two users (bidirectional)
 */
connectionRequestSchema.statics.findPendingRequest = async function(userId1, userId2) {
  return await this.findOne({
    $or: [
      { sender: userId1, receiver: userId2, status: 'pending' },
      { sender: userId2, receiver: userId1, status: 'pending' }
    ]
  });
};

/**
 * Static method: Get pending requests received by a user
 */
connectionRequestSchema.statics.getPendingRequests = async function(userId, options = {}) {
  const { page = 1, limit = 10 } = options;
  
  return await this.find({
    receiver: userId,
    status: 'pending'
  })
  .sort('-createdAt')
  .skip((page - 1) * limit)
  .limit(limit)
  .populate('sender', 'fullName profilePicURL profile.headline profile.location');
};

/**
 * Static method: Get sent requests by a user
 */
connectionRequestSchema.statics.getSentRequests = async function(userId, options = {}) {
  const { page = 1, limit = 10 } = options;
  
  return await this.find({
    sender: userId,
    status: 'pending'
  })
  .sort('-createdAt')
  .skip((page - 1) * limit)
  .limit(limit)
  .populate('receiver', 'fullName profilePicURL profile.headline profile.location');
};

/**
 * Static method: Count pending requests for a user
 */
connectionRequestSchema.statics.countPendingRequests = async function(userId) {
  return await this.countDocuments({
    receiver: userId,
    status: 'pending'
  });
};

/**
 * Instance method: Accept the connection request
 */
connectionRequestSchema.methods.accept = async function() {
  this.status = 'accepted';
  this.respondedAt = new Date();
  return await this.save();
};

/**
 * Instance method: Ignore/reject the connection request
 */
connectionRequestSchema.methods.ignore = async function() {
  this.status = 'ignored';
  this.respondedAt = new Date();
  return await this.save();
};

/**
 * Instance method: Withdraw the connection request (by sender)
 */
connectionRequestSchema.methods.withdraw = async function() {
  this.status = 'withdrawn';
  this.respondedAt = new Date();
  return await this.save();
};

/**
 * Virtual: Check if request is still pending
 */
connectionRequestSchema.virtual('isPending').get(function() {
  return this.status === 'pending';
});

/**
 * Virtual: Time elapsed since request was sent
 */
connectionRequestSchema.virtual('timeElapsed').get(function() {
  const now = new Date();
  const diffMs = now - this.createdAt;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  return `${Math.floor(diffDays / 30)} months ago`;
});

const ConnectionRequest = mongoose.model('ConnectionRequest', connectionRequestSchema);

export default ConnectionRequest;
