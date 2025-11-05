/**
 * JWT Utility Functions
 * Generate and verify JSON Web Tokens
 */

import jwt from 'jsonwebtoken';

/**
 * Generate JWT access token
 * @param {string} userId - User ID to encode
 * @returns {string} - JWT token
 */
export const generateAccessToken = (userId) => {
  return jwt.sign(
    { id: userId },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRE || '7d',
    }
  );
};

/**
 * Generate JWT refresh token
 * @param {string} userId - User ID to encode
 * @returns {string} - JWT refresh token
 */
export const generateRefreshToken = (userId) => {
  return jwt.sign(
    { id: userId },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_REFRESH_EXPIRE || '30d',
    }
  );
};

/**
 * Verify JWT token
 * @param {string} token - Token to verify
 * @returns {Object} - Decoded token payload
 */
export const verifyToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    throw new Error('Invalid or expired token');
  }
};

/**
 * Send token in response with cookie
 * @param {Object} user - User object
 * @param {number} statusCode - HTTP status code
 * @param {Object} res - Express response object
 */
export const sendTokenResponse = (user, statusCode, res) => {
  // Generate token
  const token = generateAccessToken(user._id);
  const refreshToken = generateRefreshToken(user._id);

  // Cookie options
  const options = {
    expires: new Date(
      Date.now() + 7 * 24 * 60 * 60 * 1000 // 7 days
    ),
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production', // HTTPS in production
    sameSite: 'strict',
  };

  // Send response with cookie and token
  res.status(statusCode).cookie('token', token, options).json({
    success: true,
    token,
    refreshToken,
    user: user.getPublicProfile ? user.getPublicProfile() : user,
  });
};

/**
 * Extract token from request
 * @param {Object} req - Express request object
 * @returns {string|null} - Token or null
 */
export const extractToken = (req) => {
  let token = null;

  // Check Authorization header
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }
  // Check cookies
  else if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  }

  return token;
};
