/**
 * Authentication Middleware
 * Protect routes and verify JWT tokens
 */

import asyncHandler from 'express-async-handler';
import { extractToken, verifyToken } from '../utils/jwt.js';
import User from '../models/User.js';

/**
 * Protect routes - require authentication
 * Verifies JWT and attaches user to request
 */
export const protect = asyncHandler(async (req, res, next) => {
  // Extract token from request
  const token = extractToken(req);

  if (!token) {
    res.status(401);
    throw new Error('Not authorized, no token provided');
  }

  try {
    // Verify token
    const decoded = verifyToken(token);

    // Find user by ID from token
    const user = await User.findById(decoded.id).select('-password');

    if (!user) {
      res.status(401);
      throw new Error('User not found');
    }

    if (!user.active) {
      res.status(401);
      throw new Error('User account is deactivated');
    }

    // Attach user to request
    req.user = user;
    next();
  } catch (error) {
    res.status(401);
    throw new Error('Not authorized, invalid token');
  }
});

/**
 * Optional authentication
 * Attaches user to request if token is present, but doesn't require it
 */
export const optionalAuth = asyncHandler(async (req, res, next) => {
  const token = extractToken(req);

  if (token) {
    try {
      const decoded = verifyToken(token);
      const user = await User.findById(decoded.id).select('-password');
      
      if (user && user.active) {
        req.user = user;
      }
    } catch (error) {
      // Token invalid, but we continue without user
      console.log('Optional auth: Invalid token, continuing without user');
    }
  }

  next();
});

/**
 * Check if user is post owner
 * Must be used after protect middleware
 */
export const isPostOwner = (req, res, next) => {
  if (req.post && req.user && req.post.user.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error('Not authorized to perform this action');
  }
  next();
};

/**
 * Check if user is profile owner
 * Must be used after protect middleware
 */
export const isProfileOwner = (req, res, next) => {
  const userId = req.params.userId || req.params.id;
  
  if (req.user && userId !== req.user._id.toString()) {
    res.status(403);
    throw new Error('Not authorized to modify this profile');
  }
  next();
};

/**
 * Socket.io authentication middleware
 * Verifies JWT from handshake auth or query params
 */
export const authenticateSocket = async (socket, next) => {
  console.log('🔐 Socket.io auth middleware triggered');
  console.log('🔑 Socket ID:', socket.id);
  console.log('📋 Handshake auth:', socket.handshake.auth);
  console.log('📋 Handshake query:', socket.handshake.query);
  
  try {
    // Get token from handshake auth or query
    const token = socket.handshake.auth.token || socket.handshake.query.token;

    if (!token) {
      console.log('❌ No token provided in handshake');
      return next(new Error('Authentication error: No token provided'));
    }

    console.log('✅ Token found, verifying...');
    
    // Verify token
    const decoded = verifyToken(token);
    console.log('✅ Token verified, user ID:', decoded.id);

    // Find user
    const user = await User.findById(decoded.id).select('-password');

    if (!user) {
      console.log('❌ User not found:', decoded.id);
      return next(new Error('Authentication error: User not found'));
    }

    if (!user.active) {
      console.log('❌ User account deactivated:', decoded.id);
      return next(new Error('Authentication error: User account deactivated'));
    }

    console.log('✅ User authenticated:', user.fullName, '(' + user._id + ')');
    
    // Attach user to socket
    socket.user = user;
    next();
  } catch (error) {
    console.error('❌ Socket auth error:', error.message);
    return next(new Error('Authentication error: ' + error.message));
  }
};
