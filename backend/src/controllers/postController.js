/**
 * Post Controller
 * Handle post CRUD operations, likes, and comments
 */

import asyncHandler from 'express-async-handler';
import Post from '../models/Post.js';
import User from '../models/User.js';
import { uploadPostImage, uploadBase64ToCloudinary, deleteFromCloudinary, getPublicIdFromUrl } from '../utils/cloudinaryUpload.js';
import { extractHashtags } from '../utils/hashtags.js';

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

  // Extract hashtags from post text
  const hashtags = extractHashtags(text);

  // Create post
  const post = await Post.create({
    user: req.user._id,
    text,
    mediaType: finalMediaType,
    mediaURL: uploadedImageURL,
    hashtags,
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
  if (text !== undefined) {
    post.text = text;
    // Re-extract hashtags when text is updated
    post.hashtags = extractHashtags(text);
  }

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
 * @route   POST /api/posts/:id/like-toggle
 * @desc    Toggle like on a post (idempotent)
 * @access  Private
 * @body    { requestId?: string }
 * @response { success: true, liked: boolean, likeCount: number, post: Post, requestId?: string }
 */
export const toggleLike = asyncHandler(async (req, res) => {
  // Accept requestId from body, header, or generate one
  const requestId = req.body.requestId || req.headers['x-request-id'] || `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const userId = req.user._id;
  const postId = req.params.id;
  
  console.log(`[Like Toggle ${requestId}] Request received`, {
    postId,
    userId: userId.toString(),
    timestamp: new Date().toISOString(),
    source: req.body.requestId ? 'body' : req.headers['x-request-id'] ? 'header' : 'generated',
  });

  const post = await Post.findById(postId);

  if (!post) {
    console.error(`[Like Toggle ${requestId}] Post not found`, { postId });
    res.status(404);
    throw new Error('Post not found');
  }

  if (!post.active) {
    console.error(`[Like Toggle ${requestId}] Post inactive`, { postId });
    res.status(404);
    throw new Error('Post not found');
  }

  const wasLiked = post.likes.some(id => id.toString() === userId.toString());
  console.log(`[Like Toggle ${requestId}] Current state`, {
    postId,
    wasLiked,
    currentLikeCount: post.likeCount,
  });

  // Toggle like (idempotent operation with transaction)
  const result = await post.toggleLike(userId, requestId);

  console.log(`[Like Toggle ${requestId}] Success`, {
    postId,
    wasLiked,
    isNowLiked: result.liked,
    newLikeCount: result.likeCount,
    action: result.liked ? 'LIKED' : 'UNLIKED',
  });

  // Populate user data
  await post.populate('user', 'fullName profilePicURL email profile.headline');

  // Return canonical state with requestId for client-side reconciliation
  res.status(200).json({
    success: true,
    liked: result.liked,
    likeCount: result.likeCount,
    post,
    requestId,
  });
});

/**
 * @route   POST /api/posts/:id/react
 * @desc    Toggle reaction on a post (LinkedIn-style multi-reactions)
 * @access  Private
 * @body    { reactionType: string, requestId?: string }
 * @response { success: true, reacted: boolean, reactionType: string|null, reactionCount: number, reactionCounts: object, post: Post, requestId?: string }
 */
export const toggleReaction = asyncHandler(async (req, res) => {
  // Accept requestId from body, header, or generate one
  const requestId = req.body.requestId || req.headers['x-request-id'] || `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const userId = req.user._id;
  const postId = req.params.id;
  const { reactionType = 'like' } = req.body;
  
  console.log(`[Reaction Toggle ${requestId}] Request received`, {
    postId,
    userId: userId.toString(),
    reactionType,
    timestamp: new Date().toISOString(),
  });

  // Validate reaction type
  const validTypes = ['like', 'celebrate', 'support', 'funny', 'love', 'insightful', 'curious'];
  if (!validTypes.includes(reactionType)) {
    res.status(400);
    throw new Error(`Invalid reaction type. Must be one of: ${validTypes.join(', ')}`);
  }

  const post = await Post.findById(postId);

  if (!post) {
    console.error(`[Reaction Toggle ${requestId}] Post not found`, { postId });
    res.status(404);
    throw new Error('Post not found');
  }

  if (!post.active) {
    console.error(`[Reaction Toggle ${requestId}] Post inactive`, { postId });
    res.status(404);
    throw new Error('Post not found');
  }

  // Get current user's reaction
  const currentReaction = post.reactions.find(r => r.user.toString() === userId.toString());
  
  console.log(`[Reaction Toggle ${requestId}] Current state`, {
    postId,
    currentReaction: currentReaction ? currentReaction.type : 'none',
    totalReactions: post.reactions.length,
  });

  // Toggle reaction (idempotent operation with transaction)
  const result = await post.toggleReaction(userId, reactionType, requestId);

  console.log(`[Reaction Toggle ${requestId}] Success`, {
    postId,
    reacted: result.reacted,
    reactionType: result.reactionType,
    reactionCount: result.reactionCount,
    reactionCounts: result.reactionCounts,
  });

  // Populate user data
  await post.populate('user', 'fullName profilePicURL email profile.headline');

  // Return canonical state with requestId for client-side reconciliation
  res.status(200).json({
    success: true,
    reacted: result.reacted,
    reactionType: result.reactionType,
    reactionCount: result.reactionCount,
    reactionCounts: result.reactionCounts,
    post,
    requestId,
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

/**
 * @route   GET /api/posts/hashtag/:tag
 * @desc    Get posts by hashtag
 * @access  Public
 */
export const getPostsByHashtag = asyncHandler(async (req, res) => {
  const { tag } = req.params;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  // Normalize hashtag (lowercase, remove # if present)
  const normalizedTag = tag.toLowerCase().replace(/^#/, '');

  const query = { 
    hashtags: normalizedTag,
    active: true 
  };

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
    hashtag: normalizedTag,
    count: posts.length,
    total,
    page,
    pages: Math.ceil(total / limit),
    posts,
  });
});

/**
 * @route   GET /api/posts/hashtags/trending
 * @desc    Get trending hashtags
 * @access  Public
 */
export const getTrendingHashtags = asyncHandler(async (req, res) => {
  const limit = parseInt(req.query.limit) || 10;
  const days = parseInt(req.query.days) || 7; // Last 7 days by default

  // Get posts from last N days
  const dateThreshold = new Date();
  dateThreshold.setDate(dateThreshold.getDate() - days);

  const posts = await Post.find({
    active: true,
    createdAt: { $gte: dateThreshold },
    hashtags: { $exists: true, $ne: [] }
  })
  .select('hashtags')
  .lean();

  // Count hashtag occurrences
  const hashtagCounts = {};
  
  posts.forEach(post => {
    if (post.hashtags && Array.isArray(post.hashtags)) {
      post.hashtags.forEach(tag => {
        hashtagCounts[tag] = (hashtagCounts[tag] || 0) + 1;
      });
    }
  });

  // Convert to array and sort by count
  const trending = Object.entries(hashtagCounts)
    .map(([hashtag, count]) => ({ hashtag, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);

  res.status(200).json({
    success: true,
    count: trending.length,
    trending,
  });
});
