/**
 * Connection Controller
 * Handles all connection-related operations (LinkedIn-style connections)
 */

import Connection from "../models/Connection.js";
import ConnectionRequest from "../models/ConnectionRequest.js";
import User from "../models/User.js";
import Notification from "../models/Notification.js";
import mongoose from "mongoose";
import { updateDegreesOnConnect, updateDegreesOnDisconnect } from "../utils/degreeUpdater.js";

/**
 * @desc    Get connection status between current user and target user
 * @route   GET /api/connections/status/:targetUserId
 * @access  Private
 */
export const getConnectionStatus = async (req, res, next) => {
  try {
    const currentUserId = req.user._id;
    const { targetUserId } = req.params;

    // Validate target user exists
    const targetUser = await User.findById(targetUserId);
    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    // Check if viewing own profile
    if (currentUserId.toString() === targetUserId) {
      return res.json({
        status: "OWN_PROFILE",
        connectionId: null,
        requestId: null,
        degree: 0
      });
    }

    // Check for existing connection
    const connection = await Connection.findConnection(currentUserId, targetUserId);
    if (connection) {
      return res.json({
        status: "CONNECTED",
        connectionId: connection._id,
        requestId: null,
        degree: 1,
        connectedAt: connection.connectedAt
      });
    }

    // Check for pending request (sent by current user)
    const sentRequest = await ConnectionRequest.findOne({
      sender: currentUserId,
      receiver: targetUserId,
      status: "pending"
    });

    if (sentRequest) {
      return res.json({
        status: "PENDING_SENT",
        connectionId: null,
        requestId: sentRequest._id,
        degree: 3,
        sentAt: sentRequest.createdAt
      });
    }

    // Check for pending request (received by current user)
    const receivedRequest = await ConnectionRequest.findOne({
      sender: targetUserId,
      receiver: currentUserId,
      status: "pending"
    });

    if (receivedRequest) {
      return res.json({
        status: "PENDING_RECEIVED",
        connectionId: null,
        requestId: receivedRequest._id,
        degree: 3,
        receivedAt: receivedRequest.createdAt
      });
    }

    // Calculate connection degree
    const degree = await Connection.getConnectionDegree(currentUserId, targetUserId);

    // No connection
    res.json({
      status: "NOT_CONNECTED",
      connectionId: null,
      requestId: null,
      degree: degree || 3
    });
  } catch (error) {
    console.error("Error getting connection status:", error);
    next(error);
  }
};

/**
 * @desc    Send connection request
 * @route   POST /api/connections/request
 * @access  Private
 */
export const sendConnectionRequest = async (req, res, next) => {
  try {
    const senderId = req.user._id;
    const { targetUserId, message } = req.body;

    // Validate target user
    if (!targetUserId) {
      return res.status(400).json({
        success: false,
        message: "Target user ID is required"
      });
    }

    // Can"t send to yourself
    if (senderId.toString() === targetUserId.toString()) {
      return res.status(400).json({
        success: false,
        message: "Cannot send connection request to yourself"
      });
    }

    // Check if target user exists
    const targetUser = await User.findById(targetUserId);
    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    // Check if already connected
    const existingConnection = await Connection.findConnection(senderId, targetUserId);
    if (existingConnection) {
      return res.status(400).json({
        success: false,
        message: "Already connected with this user"
      });
    }

    // Check for existing pending request
    const existingRequest = await ConnectionRequest.findPendingRequest(senderId, targetUserId);
    if (existingRequest) {
      return res.status(400).json({
        success: false,
        message: "Connection request already exists",
        requestId: existingRequest._id
      });
    }

    // Create connection request
    const connectionRequest = await ConnectionRequest.create({
      sender: senderId,
      receiver: targetUserId,
      message: message || "",
      status: "pending"
    });

    // Populate sender details
    await connectionRequest.populate("sender", "fullName profilePicURL profile.headline");

    // Create notification for the receiver
    await Notification.createNotification({
      recipient: targetUserId,
      sender: senderId,
      type: "CONNECTION_REQUEST",
      entityId: connectionRequest._id,
      entityType: "ConnectionRequest"
    });

    res.status(201).json({
      success: true,
      message: "Connection request sent successfully",
      request: {
        _id: connectionRequest._id,
        sender: connectionRequest.sender,
        receiver: connectionRequest.receiver,
        message: connectionRequest.message,
        status: connectionRequest.status,
        createdAt: connectionRequest.createdAt
      }
    });
  } catch (error) {
    console.error("Error sending connection request:", error);
    next(error);
  }
};

/**
 * @desc    Accept connection request
 * @route   POST /api/connections/accept/:requestId
 * @access  Private
 */
export const acceptConnectionRequest = async (req, res, next) => {
  try {
    const currentUserId = req.user._id;
    const { requestId } = req.params;

    // Find request
    const request = await ConnectionRequest.findById(requestId);
    if (!request) {
      return res.status(404).json({
        success: false,
        message: "Connection request not found"
      });
    }

    // Verify current user is the receiver
    if (request.receiver.toString() !== currentUserId.toString()) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to accept this request"
      });
    }

    // Check if already accepted
    if (request.status !== "pending") {
      return res.status(400).json({
        success: false,
        message: `Request already ${request.status}`
      });
    }

    // Skip transactions in development or standalone MongoDB
    const useTransaction = false; // Set to true in production with replica set

    try {
      // Accept the request
      await request.accept();

      // Create connection
      const connectionData = {
        user1: request.sender,
        user2: request.receiver,
        connectedAt: Date.now(),
        active: true
      };
      
      const connection = await Connection.create(connectionData);

      // Update both users" connections arrays
      await User.findByIdAndUpdate(
        request.sender,
        { $addToSet: { connections: request.receiver } }
      );

      await User.findByIdAndUpdate(
        request.receiver,
        { $addToSet: { connections: request.sender } }
      );

      // Update connection degrees for affected users
      await updateDegreesOnConnect(request.sender, request.receiver);

      // Get connection count
      const connectionCount = await Connection.getConnectionCount(currentUserId);

      // Create notification for the sender (person who sent the request)
      await Notification.createNotification({
        recipient: request.sender,
        sender: currentUserId,
        type: "CONNECTION_ACCEPTED",
        entityId: connection._id,
        entityType: "Connection"
      });

      res.json({
        success: true,
        message: "Connection request accepted",
        connection: {
          _id: connection._id,
          connectedAt: connection.connectedAt
        },
        connectionCount
      });
    } catch (error) {
      throw error;
    }
  } catch (error) {
    console.error("Error accepting connection request:", error);
    next(error);
  }
};

/**
 * @desc    Ignore/reject connection request
 * @route   POST /api/connections/ignore/:requestId
 * @access  Private
 */
export const ignoreConnectionRequest = async (req, res, next) => {
  try {
    const currentUserId = req.user._id;
    const { requestId } = req.params;

    // Find request
    const request = await ConnectionRequest.findById(requestId);
    if (!request) {
      return res.status(404).json({
        success: false,
        message: "Connection request not found"
      });
    }

    // Verify current user is the receiver
    if (request.receiver.toString() !== currentUserId.toString()) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to ignore this request"
      });
    }

    // Check if pending
    if (request.status !== "pending") {
      return res.status(400).json({
        success: false,
        message: `Request already ${request.status}`
      });
    }

    // Ignore the request
    await request.ignore();

    res.json({
      success: true,
      message: "Connection request ignored"
    });
  } catch (error) {
    console.error("Error ignoring connection request:", error);
    next(error);
  }
};

/**
 * @desc    Withdraw sent connection request
 * @route   DELETE /api/connections/request/:requestId
 * @access  Private
 */
export const withdrawConnectionRequest = async (req, res, next) => {
  try {
    const currentUserId = req.user._id;
    const { requestId } = req.params;

    // Find request
    const request = await ConnectionRequest.findById(requestId);
    if (!request) {
      return res.status(404).json({
        success: false,
        message: "Connection request not found"
      });
    }

    // Verify current user is the sender
    if (request.sender.toString() !== currentUserId.toString()) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to withdraw this request"
      });
    }

    // Check if pending
    if (request.status !== "pending") {
      return res.status(400).json({
        success: false,
        message: `Request already ${request.status}`
      });
    }

    // Withdraw the request
    await request.withdraw();

    res.json({
      success: true,
      message: "Connection request withdrawn"
    });
  } catch (error) {
    console.error("Error withdrawing connection request:", error);
    next(error);
  }
};

/**
 * @desc    Remove connection
 * @route   DELETE /api/connections/:connectionId
 * @access  Private
 */
export const removeConnection = async (req, res, next) => {
  try {
    const currentUserId = req.user._id;
    const { connectionId } = req.params;

    // Find connection
    const connection = await Connection.findById(connectionId);
    if (!connection) {
      return res.status(404).json({
        success: false,
        message: "Connection not found"
      });
    }

    // Verify current user is part of this connection
    const user1Id = connection.user1.toString();
    const user2Id = connection.user2.toString();
    const currentUserIdStr = currentUserId.toString();

    if (user1Id !== currentUserIdStr && user2Id !== currentUserIdStr) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to remove this connection"
      });
    }

    // Skip transactions in development or standalone MongoDB
    const useTransaction = false; // Set to true in production with replica set

    try {
      // Deactivate connection
      await connection.deactivate();

      // Remove from both users" connections arrays
      await User.findByIdAndUpdate(
        connection.user1,
        { $pull: { connections: connection.user2 } }
      );

      await User.findByIdAndUpdate(
        connection.user2,
        { $pull: { connections: connection.user1 } }
      );

      // Update connection degrees for affected users
      await updateDegreesOnDisconnect(connection.user1, connection.user2);

      // Get updated connection count
      const connectionCount = await Connection.getConnectionCount(currentUserId);

      res.json({
        success: true,
        message: "Connection removed successfully",
        connectionCount
      });
    } catch (error) {
      throw error;
    }
  } catch (error) {
    console.error("Error removing connection:", error);
    next(error);
  }
};

/**
 * @desc    Get user"s connections
 * @route   GET /api/connections/user/:userId
 * @access  Public
 */
export const getUserConnections = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;

    // Validate user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    // Get connections
    const connections = await Connection.getUserConnections(userId, { page, limit });

    // Get total count
    const total = await Connection.getConnectionCount(userId);
    const pages = Math.ceil(total / limit);

    res.json({
      success: true,
      connections: connections.map(conn => ({
        connectionId: conn.connectionId,
        connectedAt: conn.connectedAt,
        user: {
          _id: conn.user._id,
          fullName: conn.user.fullName,
          profilePicURL: conn.user.profilePicURL,
          headline: conn.user.profile?.headline || "",
          location: conn.user.profile?.location || ""
        }
      })),
      pagination: {
        total,
        page,
        pages,
        limit
      }
    });
  } catch (error) {
    console.error("Error getting user connections:", error);
    next(error);
  }
};

/**
 * @desc    Get pending connection requests (received by current user)
 * @route   GET /api/connections/requests/pending
 * @access  Private
 */
export const getPendingRequests = async (req, res, next) => {
  try {
    const currentUserId = req.user._id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    const requests = await ConnectionRequest.find({
      receiver: currentUserId,
      status: "pending"
    })
    .sort("-createdAt")
    .skip((page - 1) * limit)
    .limit(limit)
    .populate("sender", "fullName profilePicURL profile.headline profile.location");

    const total = await ConnectionRequest.countDocuments({
      receiver: currentUserId,
      status: "pending"
    });

    const pages = Math.ceil(total / limit);

    res.json({
      success: true,
      requests: requests.map(req => ({
        _id: req._id,
        sender: {
          _id: req.sender._id,
          fullName: req.sender.fullName,
          profilePicURL: req.sender.profilePicURL,
          headline: req.sender.profile?.headline || "",
          location: req.sender.profile?.location || ""
        },
        message: req.message,
        createdAt: req.createdAt
      })),
      pagination: {
        total,
        page,
        pages,
        limit
      }
    });
  } catch (error) {
    console.error("Error getting pending requests:", error);
    next(error);
  }
};

/**
 * @desc    Get sent connection requests
 * @route   GET /api/connections/requests/sent
 * @access  Private
 */
export const getSentRequests = async (req, res, next) => {
  try {
    const currentUserId = req.user._id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    const requests = await ConnectionRequest.find({
      sender: currentUserId,
      status: "pending"
    })
    .sort("-createdAt")
    .skip((page - 1) * limit)
    .limit(limit)
    .populate("receiver", "fullName profilePicURL profile.headline profile.location");

    const total = await ConnectionRequest.countDocuments({
      sender: currentUserId,
      status: "pending"
    });

    const pages = Math.ceil(total / limit);

    res.json({
      success: true,
      requests: requests.map(req => ({
        _id: req._id,
        receiver: {
          _id: req.receiver._id,
          fullName: req.receiver.fullName,
          profilePicURL: req.receiver.profilePicURL,
          headline: req.receiver.profile?.headline || "",
          location: req.receiver.profile?.location || ""
        },
        message: req.message,
        createdAt: req.createdAt
      })),
      pagination: {
        total,
        page,
        pages,
        limit
      }
    });
  } catch (error) {
    console.error("Error getting sent requests:", error);
    next(error);
  }
};

/**
 * @desc    Get suggested connections
 * @route   GET /api/connections/suggestions
 * @access  Private
 */
export const getSuggestedConnections = async (req, res, next) => {
  try {
    const currentUserId = req.user._id;
    const limit = parseInt(req.query.limit) || 10;

    // Get current user"s connections
    const userConnections = await Connection.find({
      $or: [
        { user1: currentUserId, active: true },
        { user2: currentUserId, active: true }
      ]
    }).select("user1 user2");

    // Extract connected user IDs
    const connectedUserIds = userConnections.map(conn => {
      const id1 = conn.user1.toString();
      const id2 = conn.user2.toString();
      return id1 === currentUserId.toString() ? id2 : id1;
    });

    // Get 2nd degree connections (friends of friends)
    const secondDegreeConnections = await Connection.find({
      $or: [
        { user1: { $in: connectedUserIds }, active: true },
        { user2: { $in: connectedUserIds }, active: true }
      ]
    }).select("user1 user2");

    // Extract potential connection IDs
    const potentialIds = new Set();
    secondDegreeConnections.forEach(conn => {
      const id1 = conn.user1.toString();
      const id2 = conn.user2.toString();
      
      if (!connectedUserIds.includes(id1) && id1 !== currentUserId.toString()) {
        potentialIds.add(id1);
      }
      if (!connectedUserIds.includes(id2) && id2 !== currentUserId.toString()) {
        potentialIds.add(id2);
      }
    });

    // Get pending request user IDs to exclude
    const pendingRequests = await ConnectionRequest.find({
      $or: [
        { sender: currentUserId, status: "pending" },
        { receiver: currentUserId, status: "pending" }
      ]
    }).select("sender receiver");

    const pendingUserIds = pendingRequests.map(req => {
      const senderId = req.sender.toString();
      const receiverId = req.receiver.toString();
      return senderId === currentUserId.toString() ? receiverId : senderId;
    });

    // Filter out pending requests
    const filteredIds = Array.from(potentialIds).filter(id => !pendingUserIds.includes(id));

    // If we don"t have enough 2nd degree connections, add random users
    if (filteredIds.length < limit) {
      const randomUsers = await User.find({
        _id: { 
          $nin: [...connectedUserIds, ...pendingUserIds, ...filteredIds, currentUserId]
        },
        active: true
      })
      .select("_id")
      .limit(limit - filteredIds.length);

      randomUsers.forEach(user => filteredIds.push(user._id.toString()));
    }

    // Get user details
    const suggestions = await User.find({
      _id: { $in: filteredIds.slice(0, limit) }
    })
    .select("fullName profilePicURL profile.headline profile.location")
    .limit(limit);

    // Calculate mutual connections and degree for each suggestion
    const enrichedSuggestions = await Promise.all(
      suggestions.map(async (user) => {
        const mutuals = await Connection.getMutualConnections(currentUserId, user._id, 3);
        const degree = await Connection.getConnectionDegree(currentUserId, user._id);
        
        return {
          _id: user._id,
          fullName: user.fullName,
          profilePicURL: user.profilePicURL,
          headline: user.profile?.headline || "",
          location: user.profile?.location || "",
          mutualConnections: mutuals.length,
          degree: degree || 3,
          mutualConnectionsPreview: mutuals.slice(0, 3).map(m => ({
            _id: m._id,
            fullName: m.fullName,
            profilePicURL: m.profilePicURL
          }))
        };
      })
    );

    res.json({
      success: true,
      suggestions: enrichedSuggestions
    });
  } catch (error) {
    console.error("Error getting suggested connections:", error);
    next(error);
  }
};

/**
 * @desc    Get mutual connections between two users
 * @route   GET /api/connections/mutual/:userId1/:userId2
 * @access  Public
 */
export const getMutualConnections = async (req, res, next) => {
  try {
    const { userId1, userId2 } = req.params;
    const limit = parseInt(req.query.limit) || 5;

    // Validate users exist
    const [user1, user2] = await Promise.all([
      User.findById(userId1),
      User.findById(userId2)
    ]);

    if (!user1 || !user2) {
      return res.status(404).json({
        success: false,
        message: "One or both users not found"
      });
    }

    const mutuals = await Connection.getMutualConnections(userId1, userId2, limit);

    res.json({
      success: true,
      mutuals: mutuals.map(user => ({
        _id: user._id,
        fullName: user.fullName,
        profilePicURL: user.profilePicURL,
        headline: user.profile?.headline || "",
        location: user.profile?.location || ""
      })),
      count: mutuals.length
    });
  } catch (error) {
    console.error("Error getting mutual connections:", error);
    next(error);
  }
};

/**
 * @desc    Get connection statistics for a user
 * @route   GET /api/connections/stats/:userId
 * @access  Private
 */
export const getConnectionStats = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user._id;

    // Only allow users to view their own stats
    if (userId !== currentUserId.toString()) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to view these statistics"
      });
    }

    // Get all connections
    const allConnections = await Connection.find({
      $or: [
        { user1: userId, active: true },
        { user2: userId, active: true }
      ]
    }).populate("user1 user2", "profile.location createdAt");

    const total = allConnections.length;

    // Get pending requests counts
    const [pendingReceived, pendingSent] = await Promise.all([
      ConnectionRequest.countDocuments({ receiver: userId, status: "pending" }),
      ConnectionRequest.countDocuments({ sender: userId, status: "pending" })
    ]);

    // Calculate growth (connections in last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const recentConnections = allConnections.filter(
      conn => new Date(conn.connectedAt) > thirtyDaysAgo
    );

    // Top locations
    const locationCounts = {};
    allConnections.forEach(conn => {
      const userIdStr = userId.toString();
      const otherUser = conn.user1._id.toString() === userIdStr ? conn.user2 : conn.user1;
      const location = otherUser.profile?.location;
      
      if (location) {
        locationCounts[location] = (locationCounts[location] || 0) + 1;
      }
    });

    const topLocations = Object.entries(locationCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([location]) => location);

    res.json({
      success: true,
      stats: {
        total,
        pendingReceived,
        pendingSent,
        growth: recentConnections.length,
        growthPercentage: total > 0 ? ((recentConnections.length / total) * 100).toFixed(1) : 0,
        topLocations
      }
    });
  } catch (error) {
    console.error("Error getting connection stats:", error);
    next(error);
  }
};

/**
 * @desc    Get connection degree between two users
 * @route   GET /api/connections/degree/:user1/:user2
 * @access  Private
 */
export const getConnectionDegree = async (req, res, next) => {
  try {
    const { user1, user2 } = req.params;

    // Validate users exist
    const [userOne, userTwo] = await Promise.all([
      User.findById(user1),
      User.findById(user2)
    ]);

    if (!userOne || !userTwo) {
      return res.status(404).json({
        success: false,
        message: "One or both users not found"
      });
    }

    // Calculate degree
    const degree = await Connection.getConnectionDegree(user1, user2);

    res.json({
      success: true,
      degree,
      user1,
      user2
    });
  } catch (error) {
    console.error("Error getting connection degree:", error);
    next(error);
  }
};
