/**
 * User/Profile Controller
 * Handle user profile operations and search
 */

import asyncHandler from 'express-async-handler';
import User from '../models/User.js';
import Post from '../models/Post.js';
import { uploadProfilePicture, uploadBase64ToCloudinary, deleteFromCloudinary, getPublicIdFromUrl } from '../utils/cloudinaryUpload.js';

/**
 * @route   GET /api/users/:id
 * @desc    Get user profile by ID
 * @access  Public
 */
export const getUserProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  if (!user.active) {
    res.status(404);
    throw new Error('User not found');
  }

  // Get user's post count
  const postCount = await Post.countDocuments({ user: user._id, active: true });

  res.status(200).json({
    success: true,
    user: {
      ...user.getPublicProfile(),
      postCount,
    },
  });
});

/**
 * @route   PUT /api/users/:id
 * @desc    Update user profile
 * @access  Private (owner only)
 */
export const updateUserProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  // Check if user is updating their own profile
  if (user._id.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error('Not authorized to update this profile');
  }

  const {
    fullName,
    profile = {},
    profileImageBase64,
    backgroundImageBase64,
  } = req.body;

  // Update basic fields
  if (fullName) user.fullName = fullName;

  // Update profile fields
  if (profile.firstName) user.profile.firstName = profile.firstName;
  if (profile.lastName) user.profile.lastName = profile.lastName;
  if (profile.headline !== undefined) user.profile.headline = profile.headline;
  if (profile.about !== undefined) user.profile.about = profile.about;
  if (profile.countryLoc) user.profile.countryLoc = profile.countryLoc;
  if (profile.postalCodeLoc) user.profile.postalCodeLoc = profile.postalCodeLoc;

  // Handle profile picture upload from file
  if (req.file) {
    // Delete old profile picture if exists
    if (user.profilePicURL) {
      const publicId = getPublicIdFromUrl(user.profilePicURL);
      if (publicId) {
        await deleteFromCloudinary(publicId).catch(err => console.error('Failed to delete old image:', err));
      }
    }

    const uploadResult = await uploadProfilePicture(req.file.buffer);
    user.profilePicURL = uploadResult.url;
  }
  // Handle profile picture upload from base64
  else if (profileImageBase64 && profileImageBase64.startsWith('data:image')) {
    // Delete old profile picture if exists
    if (user.profilePicURL) {
      const publicId = getPublicIdFromUrl(user.profilePicURL);
      if (publicId) {
        await deleteFromCloudinary(publicId).catch(err => console.error('Failed to delete old image:', err));
      }
    }

    const uploadResult = await uploadBase64ToCloudinary(profileImageBase64, 'linkedin-clone/profiles');
    user.profilePicURL = uploadResult.url;
  }

  // Handle background image upload
  if (backgroundImageBase64 && backgroundImageBase64.startsWith('data:image')) {
    // Delete old background image if exists
    if (user.profile.backgroundPicURL) {
      const publicId = getPublicIdFromUrl(user.profile.backgroundPicURL);
      if (publicId) {
        await deleteFromCloudinary(publicId).catch(err => console.error('Failed to delete old image:', err));
      }
    }

    const uploadResult = await uploadBase64ToCloudinary(backgroundImageBase64, 'linkedin-clone/backgrounds');
    user.profile.backgroundPicURL = uploadResult.url;
  }

  await user.save();

  res.status(200).json({
    success: true,
    user: user.getPublicProfile(),
  });
});

/**
 * @route   GET /api/users/:id/posts
 * @desc    Get all posts by a user
 * @access  Public
 */
export const getUserPosts = asyncHandler(async (req, res) => {
  const { id: userId } = req.params;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  // Check if user exists
  const user = await User.findById(userId);
  if (!user || !user.active) {
    res.status(404);
    throw new Error('User not found');
  }

  const query = { user: userId, active: true };
  const total = await Post.countDocuments(query);

  const posts = await Post.find(query)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate('user', 'fullName profilePicURL email profile.headline')
    .populate('comments.user', 'fullName profilePicURL')
    .lean();

  res.status(200).json({
    success: true,
    count: posts.length,
    total,
    page,
    pages: Math.ceil(total / limit),
    posts,
  });
});

/**
 * @route   GET /api/users/search
 * @desc    Search users by name or email
 * @access  Public
 */
export const searchUsers = asyncHandler(async (req, res) => {
  const { q, page = 1, limit = 10 } = req.query;

  if (!q || q.trim() === '') {
    res.status(400);
    throw new Error('Search query is required');
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);

  // Search in fullName and email with regex (case-insensitive)
  const searchQuery = {
    active: true,
    $or: [
      { fullName: { $regex: q, $options: 'i' } },
      { email: { $regex: q, $options: 'i' } },
      { 'profile.headline': { $regex: q, $options: 'i' } },
    ],
  };

  const total = await User.countDocuments(searchQuery);

  const users = await User.find(searchQuery)
    .select('fullName email profilePicURL profile.headline profile.firstName profile.lastName')
    .skip(skip)
    .limit(parseInt(limit))
    .lean();

  res.status(200).json({
    success: true,
    count: users.length,
    total,
    page: parseInt(page),
    pages: Math.ceil(total / parseInt(limit)),
    users,
  });
});

/**
 * @route   GET /api/users
 * @desc    Get all users (for suggestions)
 * @access  Public
 */
export const getAllUsers = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const skip = (page - 1) * limit;

  const query = { active: true };

  // Exclude current user if authenticated
  if (req.user) {
    query._id = { $ne: req.user._id };
  }

  const total = await User.countDocuments(query);

  const users = await User.find(query)
    .select('fullName email profilePicURL profile.headline profile.firstName profile.lastName')
    .skip(skip)
    .limit(limit)
    .lean();

  res.status(200).json({
    success: true,
    count: users.length,
    total,
    page,
    pages: Math.ceil(total / limit),
    users,
  });
});

/**
 * @route   DELETE /api/users/:id
 * @desc    Deactivate user account (soft delete)
 * @access  Private (owner only)
 */
export const deactivateUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  // Check if user is deactivating their own account
  if (user._id.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error('Not authorized to deactivate this account');
  }

  user.active = false;
  await user.save();

  // Also deactivate all user's posts
  await Post.updateMany(
    { user: user._id },
    { $set: { active: false } }
  );

  res.status(200).json({
    success: true,
    message: 'Account deactivated successfully',
  });
});
