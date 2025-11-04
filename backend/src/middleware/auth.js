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
