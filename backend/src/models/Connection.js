/**
 * Connection Model
 * Represents established connections between users (LinkedIn 1st degree)
 */

import mongoose from 'mongoose';

const connectionSchema = new mongoose.Schema(
  {
    user1: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User1 is required'],
      index: true,
    },
    user2: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User2 is required'],
      index: true,
    },
    connectedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    active: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Unique compound index to prevent duplicate connections
connectionSchema.index(
  { user1: 1, user2: 1 },
  { 
    unique: true,
    partialFilterExpression: { active: true }
  }
);

// Compound indexes for bidirectional queries
connectionSchema.index({ user1: 1, active: 1 });
connectionSchema.index({ user2: 1, active: 1 });

/**
 * Pre-save middleware: Ensure user1 < user2 (for consistent storage)
 */
connectionSchema.pre('save', function(next) {
  // Ensure user1 and user2 are different
  if (this.user1.toString() === this.user2.toString()) {
    return next(new Error('Cannot create connection with yourself'));
  }
  
  // Always store smaller ObjectId in user1 for consistency
  const id1 = this.user1.toString();
  const id2 = this.user2.toString();
  
  if (id1 > id2) {
    const temp = this.user1;
    this.user1 = this.user2;
    this.user2 = temp;
  }
  
  next();
});

/**
 * Static method: Check if two users are connected
 */
connectionSchema.statics.areConnected = async function(userId1, userId2) {
  const id1 = userId1.toString();
  const id2 = userId2.toString();
  
  const connection = await this.findOne({
    $or: [
      { user1: userId1, user2: userId2, active: true },
      { user1: userId2, user2: userId1, active: true }
    ]
  });
  
  return !!connection;
};

/**
 * Static method: Find connection between two users
 */
connectionSchema.statics.findConnection = async function(userId1, userId2) {
  return await this.findOne({
    $or: [
      { user1: userId1, user2: userId2, active: true },
      { user1: userId2, user2: userId1, active: true }
    ]
  });
};

/**
 * Static method: Get all connections for a user
 */
connectionSchema.statics.getUserConnections = async function(userId, options = {}) {
  const { page = 1, limit = 20, sort = '-connectedAt' } = options;
  
  const connections = await this.find({
    $or: [
      { user1: userId, active: true },
      { user2: userId, active: true }
    ]
  })
  .sort(sort)
  .skip((page - 1) * limit)
  .limit(limit)
  .populate('user1', 'fullName profilePicURL profile.headline profile.location')
  .populate('user2', 'fullName profilePicURL profile.headline profile.location');
  
  // Return the "other" user in each connection
  const userIdString = userId.toString();
  return connections.map(conn => {
    const isUser1 = conn.user1._id.toString() === userIdString;
    const otherUser = isUser1 ? conn.user2 : conn.user1;
    
    return {
      connectionId: conn._id,
      connectedAt: conn.connectedAt,
      user: otherUser
    };
  });
};

/**
 * Static method: Get connection count for a user
 */
connectionSchema.statics.getConnectionCount = async function(userId) {
  return await this.countDocuments({
    $or: [
      { user1: userId, active: true },
      { user2: userId, active: true }
    ]
  });
};

/**
 * Static method: Calculate connection degree between two users
 * Returns: 1 (direct), 2 (mutual connection), 3 (no connection), null (error)
 */
connectionSchema.statics.getConnectionDegree = async function(userId1, userId2) {
  try {
    // Check if same user
    if (userId1.toString() === userId2.toString()) {
      return 0;
    }
    
    // Check 1st degree (direct connection)
    const directConnection = await this.areConnected(userId1, userId2);
    if (directConnection) {
      return 1;
    }
    
    // Check 2nd degree (mutual connections)
    const user1Connections = await this.find({
      $or: [
        { user1: userId1, active: true },
        { user2: userId1, active: true }
      ]
    }).select('user1 user2');
    
    // Get all user1's connection IDs
    const user1ConnectionIds = user1Connections.map(conn => {
      const id1 = conn.user1.toString();
      const id2 = conn.user2.toString();
      return id1 === userId1.toString() ? id2 : id1;
    });
    
    // Check if any of user1's connections are connected to user2
    const mutualConnection = await this.findOne({
      $or: [
        { user1: userId2, user2: { $in: user1ConnectionIds }, active: true },
        { user2: userId2, user1: { $in: user1ConnectionIds }, active: true }
      ]
    });
    
    if (mutualConnection) {
      return 2;
    }
    
    // 3rd degree or no connection
    return 3;
  } catch (error) {
    console.error('Error calculating connection degree:', error);
    return null;
  }
};

/**
 * Static method: Get mutual connections between two users
 */
connectionSchema.statics.getMutualConnections = async function(userId1, userId2, limit = 10) {
  try {
    // Get all connections for both users
    const [user1Connections, user2Connections] = await Promise.all([
      this.find({
        $or: [{ user1: userId1 }, { user2: userId1 }],
        active: true
      }).select('user1 user2'),
      this.find({
        $or: [{ user1: userId2 }, { user2: userId2 }],
        active: true
      }).select('user1 user2')
    ]);
    
    // Extract connection IDs
    const user1ConnectionIds = user1Connections.map(conn => {
      const id1 = conn.user1.toString();
      const id2 = conn.user2.toString();
      return id1 === userId1.toString() ? id2 : id1;
    });
    
    const user2ConnectionIds = user2Connections.map(conn => {
      const id1 = conn.user1.toString();
      const id2 = conn.user2.toString();
      return id1 === userId2.toString() ? id2 : id1;
    });
    
    // Find intersection
    const mutualIds = user1ConnectionIds.filter(id => user2ConnectionIds.includes(id));
    
    // Populate user details
    const User = mongoose.model('User');
    const mutualUsers = await User.find({
      _id: { $in: mutualIds.slice(0, limit) }
    })
    .select('fullName profilePicURL profile.headline profile.location')
    .limit(limit);
    
    return mutualUsers;
  } catch (error) {
    console.error('Error getting mutual connections:', error);
    return [];
  }
};

/**
 * Instance method: Deactivate connection (soft delete)
 */
connectionSchema.methods.deactivate = async function() {
  this.active = false;
  return await this.save();
};

const Connection = mongoose.model('Connection', connectionSchema);

export default Connection;
