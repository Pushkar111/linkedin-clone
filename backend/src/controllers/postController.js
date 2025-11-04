/**
 * Post Controller
 * Handle post CRUD operations, likes, and comments
 */

import asyncHandler from 'express-async-handler';
import Post from '../models/Post.js';
import User from '../models/User.js';
import { uploadPostImage, uploadBase64ToCloudinary, deleteFromCloudinary, getPublicIdFromUrl } from '../utils/cloudinaryUpload.js';

/**
 * @route   GET /api/posts
 * @desc    Get all posts (paginated feed)
 * @access  Public (with optional auth to personalize)
 */
export const getAllPosts = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  // Query only active posts
  const query = { active: true };

  // Get total count
  const total = await Post.countDocuments(query);

  // Get posts with populated user data
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
 * @route   GET /api/posts/:id
 * @desc    Get single post by ID
 * @access  Public
 */
export const getPostById = asyncHandler(async (req, res) => {
  const post = await Post.findById(req.params.id)
    .populate('user', 'fullName profilePicURL email profile.headline')
    .populate('comments.user', 'fullName profilePicURL');

  if (!post) {
    res.status(404);
    throw new Error('Post not found');
  }

  if (!post.active) {
    res.status(404);
    throw new Error('Post not found');
  }

  // Increment view count (async, don't await)
  post.incrementView().catch(err => console.error('Failed to increment view:', err));

  res.status(200).json({
    success: true,
    post,
  });
});

/**
 * @route   POST /api/posts
 * @desc    Create a new post
 * @access  Private
 */
export const createPost = asyncHandler(async (req, res) => {
  const { text, mediaType = 'none', mediaURL = '', imageBase64 } = req.body;

  let uploadedImageURL = mediaURL;

  // Handle image upload from file
  if (req.file) {
    const uploadResult = await uploadPostImage(req.file.buffer);
    uploadedImageURL = uploadResult.url;
  }
  // Handle base64 image upload
  else if (imageBase64 && imageBase64.startsWith('data:image')) {
    const uploadResult = await uploadBase64ToCloudinary(imageBase64, 'linkedin-clone/posts');
    uploadedImageURL = uploadResult.url;
  }

  // Determine media type
  const finalMediaType = uploadedImageURL ? 'photo' : 'none';

  // Create post
  const post = await Post.create({
    user: req.user._id,
    text,
    mediaType: finalMediaType,
    mediaURL: uploadedImageURL,
  });

  // Populate user data
  await post.populate('user', 'fullName profilePicURL email profile.headline');

  res.status(201).json({
    success: true,
    post,
  });
});

/**
 * @route   PUT /api/posts/:id
 * @desc    Update a post
 * @access  Private (owner only)
 */
export const updatePost = asyncHandler(async (req, res) => {
  const { text, mediaURL, imageBase64 } = req.body;

  let post = await Post.findById(req.params.id);

  if (!post) {
    res.status(404);
    throw new Error('Post not found');
  }

  // Check if user is post owner
  if (post.user.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error('Not authorized to update this post');
  }

  // Update fields
  if (text !== undefined) post.text = text;

  // Handle image update
  if (imageBase64 && imageBase64.startsWith('data:image')) {
    // Delete old image if exists
    if (post.mediaURL) {
      const publicId = getPublicIdFromUrl(post.mediaURL);
      if (publicId) {
        await deleteFromCloudinary(publicId).catch(err => console.error('Failed to delete old image:', err));
      }
    }

    // Upload new image
    const uploadResult = await uploadBase64ToCloudinary(imageBase64, 'linkedin-clone/posts');
    post.mediaURL = uploadResult.url;
    post.mediaType = 'photo';
  } else if (mediaURL !== undefined) {
    post.mediaURL = mediaURL;
    post.mediaType = mediaURL ? 'photo' : 'none';
  }

  await post.save();

  // Populate user data
  await post.populate('user', 'fullName profilePicURL email profile.headline');

  res.status(200).json({
    success: true,
    post,
  });
});

/**
 * @route   DELETE /api/posts/:id
 * @desc    Delete a post (soft delete)
 * @access  Private (owner only)
 */
export const deletePost = asyncHandler(async (req, res) => {
  const post = await Post.findById(req.params.id);

  if (!post) {
    res.status(404);
    throw new Error('Post not found');
  }

  // Check if user is post owner
  if (post.user.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error('Not authorized to delete this post');
  }

  // Soft delete - mark as inactive
  post.active = false;
  await post.save();

  // Optional: Delete image from Cloudinary
  if (post.mediaURL) {
    const publicId = getPublicIdFromUrl(post.mediaURL);
    if (publicId) {
      await deleteFromCloudinary(publicId).catch(err => console.error('Failed to delete image:', err));
    }
  }

  res.status(200).json({
    success: true,
    message: 'Post deleted successfully',
  });
});

/**
 * @route   POST /api/posts/:id/like
 * @desc    Toggle like on a post
 * @access  Private
 */
export const toggleLike = asyncHandler(async (req, res) => {
  const post = await Post.findById(req.params.id);

  if (!post) {
    res.status(404);
    throw new Error('Post not found');
  }

  if (!post.active) {
    res.status(404);
    throw new Error('Post not found');
  }

  // Toggle like
  const isLiked = await post.toggleLike(req.user._id);

  // Populate user data
  await post.populate('user', 'fullName profilePicURL email profile.headline');

  res.status(200).json({
    success: true,
    isLiked,
    likeCount: post.likeCount,
    post,
  });
});

/**
 * @route   POST /api/posts/:id/comments
 * @desc    Add a comment to a post
 * @access  Private
 */
export const addComment = asyncHandler(async (req, res) => {
  const { text } = req.body;

  const post = await Post.findById(req.params.id);

  if (!post) {
    res.status(404);
    throw new Error('Post not found');
  }

  if (!post.active) {
    res.status(404);
    throw new Error('Post not found');
  }

  // Add comment
  const comment = await post.addComment(req.user._id, text);

  // Populate user data
  await post.populate('user', 'fullName profilePicURL email profile.headline');
  await post.populate('comments.user', 'fullName profilePicURL');

  res.status(201).json({
    success: true,
    comment,
    commentCount: post.commentCount,
    post,
  });
});

/**
 * @route   DELETE /api/posts/:id/comments/:commentId
 * @desc    Delete a comment from a post
 * @access  Private (comment owner or post owner)
 */
export const deleteComment = asyncHandler(async (req, res) => {
  const { id: postId, commentId } = req.params;

  const post = await Post.findById(postId);

  if (!post) {
    res.status(404);
    throw new Error('Post not found');
  }

  // Find the comment
  const comment = post.comments.id(commentId);

  if (!comment) {
    res.status(404);
    throw new Error('Comment not found');
  }

  // Check if user is comment owner or post owner
  const isCommentOwner = comment.user.toString() === req.user._id.toString();
  const isPostOwner = post.user.toString() === req.user._id.toString();

  if (!isCommentOwner && !isPostOwner) {
    res.status(403);
    throw new Error('Not authorized to delete this comment');
  }

  // Delete comment
  const success = await post.deleteComment(commentId);

  if (!success) {
    res.status(400);
    throw new Error('Failed to delete comment');
  }

  // Populate user data
  await post.populate('user', 'fullName profilePicURL email profile.headline');
  await post.populate('comments.user', 'fullName profilePicURL');

  res.status(200).json({
    success: true,
    message: 'Comment deleted successfully',
    commentCount: post.commentCount,
    post,
  });
});

/**
 * @route   GET /api/posts/user/:userId
 * @desc    Get posts by a specific user
 * @access  Public
 */
export const getUserPosts = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  // Check if user exists
  const user = await User.findById(userId);
  if (!user) {
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
