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
  
  // Calculate total reactions received
  const posts = await Post.find({ user: user._id, active: true }).select('reactions');
  const reactionsReceived = posts.reduce((total, post) => {
    return total + (post.reactions ? post.reactions.length : 0);
  }, 0);
  
  // Check if current user is following this profile
  let isFollowedByCurrentUser = false;
  let isOwner = false;
  
  if (req.user) {
    isOwner = req.user._id.toString() === user._id.toString();
    if (!isOwner) {
      isFollowedByCurrentUser = req.user.isFollowing(user._id);
    }
    
    // Increment profile view (but not for own profile)
    if (!isOwner) {
      await user.incrementProfileView();
    }
  }

  res.status(200).json({
    success: true,
    user: {
      ...user.getPublicProfile(),
      postCount,
      reactionsReceived,
      isFollowedByCurrentUser,
      isOwner,
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
  if (profile.location !== undefined) user.profile.location = profile.location;

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
 * @route   PUT /api/users/:id/profile/experience
 * @desc    Update experience section
 * @access  Private (owner only)
 */
export const updateExperience = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  // Check authorization
  if (user._id.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error('Not authorized to update this profile');
  }

  // Replace entire experience array
  if (Array.isArray(req.body.experience)) {
    user.profile.experience = req.body.experience;
  }

  await user.save();

  res.status(200).json({
    success: true,
    experience: user.profile.experience,
  });
});

/**
 * @route   PUT /api/users/:id/profile/education
 * @desc    Update education section
 * @access  Private (owner only)
 */
export const updateEducation = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  // Check authorization
  if (user._id.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error('Not authorized to update this profile');
  }

  // Replace entire education array
  if (Array.isArray(req.body.education)) {
    user.profile.education = req.body.education;
  }

  await user.save();

  res.status(200).json({
    success: true,
    education: user.profile.education,
  });
});

/**
 * @route   PUT /api/users/:id/profile/skills
 * @desc    Update skills section
 * @access  Private (owner only)
 */
export const updateSkills = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  // Check authorization
  if (user._id.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error('Not authorized to update this profile');
  }

  // Replace entire skills array
  if (Array.isArray(req.body.skills)) {
    user.profile.skills = req.body.skills;
  }

  await user.save();

  res.status(200).json({
    success: true,
    skills: user.profile.skills,
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

/**
 * @route   POST /api/users/:id/follow
 * @desc    Follow a user
 * @access  Private
 */
export const followUser = asyncHandler(async (req, res) => {
  const targetUser = await User.findById(req.params.id);

  if (!targetUser || !targetUser.active) {
    res.status(404);
    throw new Error('User not found');
  }

  // Can't follow yourself
  if (targetUser._id.toString() === req.user._id.toString()) {
    res.status(400);
    throw new Error('Cannot follow yourself');
  }

  // Follow the user
  const currentUser = await User.findById(req.user._id);
  const followed = await currentUser.followUser(targetUser._id);

  if (!followed) {
    res.status(400);
    throw new Error('Already following this user');
  }

  // Get updated follower count
  const updatedTargetUser = await User.findById(targetUser._id);

  res.status(200).json({
    success: true,
    message: 'User followed successfully',
    followersCount: updatedTargetUser.followers.length,
  });
});

/**
 * @route   DELETE /api/users/:id/follow
 * @desc    Unfollow a user
 * @access  Private
 */
export const unfollowUser = asyncHandler(async (req, res) => {
  const targetUser = await User.findById(req.params.id);

  if (!targetUser || !targetUser.active) {
    res.status(404);
    throw new Error('User not found');
  }

  // Unfollow the user
  const currentUser = await User.findById(req.user._id);
  const unfollowed = await currentUser.unfollowUser(targetUser._id);

  if (!unfollowed) {
    res.status(400);
    throw new Error('Not following this user');
  }

  // Get updated follower count
  const updatedTargetUser = await User.findById(targetUser._id);

  res.status(200).json({
    success: true,
    message: 'User unfollowed successfully',
    followersCount: updatedTargetUser.followers.length,
  });
});

/**
 * @route   GET /api/users/:id/connections
 * @desc    Get user's connections
 * @access  Public
 */
export const getUserConnections = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);

  if (!user || !user.active) {
    res.status(404);
    throw new Error('User not found');
  }

  const limit = parseInt(req.query.limit) || 20;

  // Get connections (followers who also follow back)
  const connections = await User.find({
    _id: { $in: user.following || [] },
    followers: user._id,
    active: true,
  })
    .select('fullName profilePicURL profile.headline')
    .limit(limit)
    .lean();

  // Calculate mutual connections for each connection
  const connectionsWithMutual = connections.map(connection => ({
    _id: connection._id,
    name: connection.fullName,
    fullName: connection.fullName,
    headline: connection.profile?.headline || '',
    avatarUrl: connection.profilePicURL,
    profilePicURL: connection.profilePicURL,
    mutualConnections: 0, // Would need complex query to calculate
  }));

  res.status(200).json({
    success: true,
    count: connectionsWithMutual.length,
    connections: connectionsWithMutual,
  });
});

/**
 * @route   GET /api/users/suggestions
 * @desc    Get suggested connections for current user
 * @access  Private
 */
export const getSuggestedConnections = asyncHandler(async (req, res) => {
  const limit = parseInt(req.query.limit) || 5;

  // Get users the current user is NOT following and not themselves
  const suggestions = await User.find({
    _id: {
      $ne: req.user._id,
      $nin: req.user.following || [],
    },
    active: true,
  })
    .select('fullName profilePicURL profile.headline')
    .limit(limit)
    .lean();

  const suggestionsFormatted = suggestions.map(user => ({
    _id: user._id,
    name: user.fullName,
    fullName: user.fullName,
    headline: user.profile?.headline || '',
    avatarUrl: user.profilePicURL,
    profilePicURL: user.profilePicURL,
    mutualConnections: 0,
  }));

  res.status(200).json({
    success: true,
    count: suggestionsFormatted.length,
    suggestions: suggestionsFormatted,
  });
});
