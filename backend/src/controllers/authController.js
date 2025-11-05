/**
 * Authentication Controller
 * Handle user registration, login, and profile retrieval
 */

import asyncHandler from 'express-async-handler';
import crypto from 'crypto';
import User from '../models/User.js';
import { sendTokenResponse, generateAccessToken, verifyToken } from '../utils/jwt.js';
import { sendPasswordResetEmail, sendWelcomeEmail } from '../utils/emailService.js';

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user (with optional profile picture)
 * @access  Public
 */
export const register = asyncHandler(async (req, res) => {
  const { 
    email, 
    password, 
    fullName, 
    firstName, 
    lastName, 
    headline, 
    countryLoc, 
    postalCodeLoc, 
    authMethod = 'email-password' 
  } = req.body;

  // Manual validation (since express-validator doesn't work well with multipart/form-data)
  if (!email || !password || !fullName) {
    res.status(400);
    throw new Error('Email, password, and full name are required');
  }

  if (password.length < 6) {
    res.status(400);
    throw new Error('Password must be at least 6 characters');
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    res.status(400);
    throw new Error('Please provide a valid email');
  }

  // Check if user already exists
  const userExists = await User.findOne({ email });

  if (userExists) {
    res.status(400);
    throw new Error('User already exists with this email');
  }

  // If firstName and lastName not provided, extract from fullName
  const userFirstName = firstName || fullName.split(' ')[0] || '';
  const userLastName = lastName || fullName.split(' ').slice(1).join(' ') || '';

  // Handle profile picture upload if provided
  let profilePicURL = undefined;
  if (req.file) {
    // Import upload utility dynamically
    const { uploadProfilePicture } = await import('../utils/cloudinaryUpload.js');
    const uploadResult = await uploadProfilePicture(req.file.buffer);
    profilePicURL = uploadResult.url;
  }

  // Create user
  const user = await User.create({
    email,
    password,
    fullName,
    authMethod,
    profilePicURL,
    profile: {
      firstName: userFirstName,
      lastName: userLastName,
      headline: headline || '',
      about: '',
      countryLoc: countryLoc || '',
      postalCodeLoc: postalCodeLoc || '',
    },
  });

  if (user) {
    // Send welcome email (async, don't wait for it)
    sendWelcomeEmail(user.email, user.fullName).catch((err) => {
      console.error('Failed to send welcome email:', err.message);
    });

    // Send token response
    sendTokenResponse(user, 201, res);
  } else {
    res.status(400);
    throw new Error('Invalid user data');
  }
});

/**
 * @route   POST /api/auth/login
 * @desc    Login user and get token
 * @access  Public
 */
export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // Find user by email (include password field)
  const user = await User.findOne({ email }).select('+password');

  if (!user) {
    res.status(401);
    throw new Error('Invalid email or password');
  }

  // Check if user is active
  if (!user.active) {
    res.status(401);
    throw new Error('Account is deactivated');
  }

  // Check password
  const isPasswordMatch = await user.comparePassword(password);

  if (!isPasswordMatch) {
    res.status(401);
    throw new Error('Invalid email or password');
  }

  // Send token response
  sendTokenResponse(user, 200, res);
});

/**
 * @route   POST /api/auth/google
 * @desc    Login/Register with Google
 * @access  Public
 */
export const googleAuth = asyncHandler(async (req, res) => {
  const { email, fullName, profilePicURL, googleId } = req.body;

  if (!email || !fullName) {
    res.status(400);
    throw new Error('Email and full name are required');
  }

  // Check if user exists
  let user = await User.findOne({ email });

  if (user) {
    // User exists - login
    if (!user.active) {
      res.status(401);
      throw new Error('Account is deactivated');
    }

    // Update profile picture if provided
    if (profilePicURL && profilePicURL !== user.profilePicURL) {
      user.profilePicURL = profilePicURL;
      await user.save();
    }
  } else {
    // User doesn't exist - register
    user = await User.create({
      email,
      fullName,
      profilePicURL: profilePicURL || undefined,
      authMethod: 'google',
      profile: {
        firstName: fullName.split(' ')[0] || '',
        lastName: fullName.split(' ').slice(1).join(' ') || '',
        headline: '',
        about: '',
      },
    });
  }

  // Send token response
  sendTokenResponse(user, 200, res);
});

/**
 * @route   POST /api/auth/anonymous
 * @desc    Login as anonymous user (guest)
 * @access  Public
 */
export const anonymousAuth = asyncHandler(async (req, res) => {
  // Generate random name for anonymous user
  const randomId = Math.random().toString(36).substring(7).toUpperCase();
  const email = `guest-${randomId}@linkedin-clone.com`;
  const fullName = `Guest User ${randomId}`;

  // Create anonymous user
  const user = await User.create({
    email,
    fullName,
    authMethod: 'anonymous',
    profile: {
      firstName: 'Guest',
      lastName: `User ${randomId}`,
      headline: 'Anonymous User',
      about: '',
    },
  });

  if (user) {
    sendTokenResponse(user, 201, res);
  } else {
    res.status(400);
    throw new Error('Failed to create anonymous user');
  }
});

/**
 * @route   GET /api/auth/me
 * @desc    Get current logged in user
 * @access  Private
 */
export const getMe = asyncHandler(async (req, res) => {
  // User is already attached to req by protect middleware
  const user = await User.findById(req.user._id);

  res.status(200).json({
    success: true,
    user: user.getPublicProfile(),
  });
});

/**
 * @route   POST /api/auth/logout
 * @desc    Logout user / clear cookie
 * @access  Private
 */
export const logout = asyncHandler(async (req, res) => {
  res.cookie('token', 'none', {
    expires: new Date(Date.now() + 10 * 1000), // 10 seconds
    httpOnly: true,
  });

  res.status(200).json({
    success: true,
    message: 'Logged out successfully',
  });
});

/**
 * @route   POST /api/auth/refresh
 * @desc    Refresh access token
 * @access  Public
 */
export const refreshToken = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    res.status(400);
    throw new Error('Refresh token is required');
  }

  try {
    const decoded = verifyToken(refreshToken);
    const user = await User.findById(decoded.id);

    if (!user || !user.active) {
      res.status(401);
      throw new Error('Invalid refresh token');
    }

    const newAccessToken = generateAccessToken(user._id);

    res.status(200).json({
      success: true,
      token: newAccessToken,
    });
  } catch (error) {
    res.status(401);
    throw new Error('Invalid or expired refresh token');
  }
});

/**
 * @route   POST /api/auth/forgot-password
 * @desc    Request password reset (generates token)
 * @access  Public
 */
export const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;

  if (!email) {
    res.status(400);
    throw new Error('Email is required');
  }

  const user = await User.findOne({ email });

  if (!user) {
    res.status(404);
    throw new Error('No user found with this email');
  }

  // Check if user is using email-password auth
  if (user.authMethod !== 'email-password') {
    res.status(400);
    throw new Error(`This account uses ${user.authMethod} authentication. Password reset is not available.`);
  }

  // Generate reset token
  const resetToken = user.generatePasswordResetToken();
  await user.save({ validateBeforeSave: false });

  // Create reset URL with /linkedin base path
  const resetUrl = `${process.env.FRONTEND_URL}/linkedin/reset-password?token=${resetToken}`;

  try {
    // Send password reset email with professional template
    await sendPasswordResetEmail(user.email, resetUrl, user.fullName);

    res.status(200).json({
      success: true,
      message: 'Password reset link has been sent to your email',
      // For development only - remove in production
      resetToken: process.env.NODE_ENV === 'development' ? resetToken : undefined,
      resetUrl: process.env.NODE_ENV === 'development' ? resetUrl : undefined,
    });
  } catch (error) {
    console.error('Email sending error:', error);
    
    // Reset token fields if email fails
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });

    res.status(500);
    throw new Error('Error sending password reset email. Please try again later.');
  }
});

/**
 * @route   POST /api/auth/reset-password
 * @desc    Reset password with token
 * @access  Public
 */
export const resetPassword = asyncHandler(async (req, res) => {
  const { token, newPassword } = req.body;

  if (!token || !newPassword) {
    res.status(400);
    throw new Error('Token and new password are required');
  }

  if (newPassword.length < 6) {
    res.status(400);
    throw new Error('Password must be at least 6 characters');
  }

  // Hash the token to compare with database (crypto already imported at top)
  const hashedToken = crypto
    .createHash('sha256')
    .update(token)
    .digest('hex');

  // Find user with valid reset token
  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() }, // Token not expired
  }).select('+passwordResetToken +passwordResetExpires');

  if (!user) {
    res.status(400);
    throw new Error('Invalid or expired reset token');
  }

  // Update password
  user.password = newPassword;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save(); // Will trigger password hashing middleware

  // Send new token response
  sendTokenResponse(user, 200, res);
});
