/**
 * @module postService
 * @description Post management service to replace Firestore with REST API
 */

import apiClient from "./apiClient";

/**
 * Get paginated posts feed
 * @param {number} page - Page number (default: 1)
 * @param {number} limit - Posts per page (default: 10)
 * @returns {Promise<Object>} Posts array with pagination info
 */
export const getPosts = async (page = 1, limit = 10) => {
  const response = await apiClient.get("/posts", {
    params: { page, limit },
  });
  return response;
};

/**
 * Get single post by ID
 * @param {string} postId - Post ID
 * @returns {Promise<Object>} Post object
 */
export const getPostById = async (postId) => {
  const response = await apiClient.get(`/posts/${postId}`);
  return response; // Interceptor already extracts response.data
};

/**
 * Get posts by specific user
 * @param {string} userId - User ID
 * @param {number} page - Page number
 * @param {number} limit - Posts per page
 * @returns {Promise<Object>} Posts array with pagination info
 */
export const getUserPosts = async (userId, page = 1, limit = 10) => {
  const response = await apiClient.get(`/posts/user/${userId}`, {
    params: { page, limit },
  });
  return response;
};

/**
 * Create a new post (text only)
 * @param {string} text - Post text content
 * @returns {Promise<Object>} Created post object
 */
export const createTextPost = async (text) => {
  const response = await apiClient.post("/posts", {
    text,
    mediaType: "none",
  });
  return response; // Interceptor already extracts response.data
};

/**
 * Create a new post with image (base64)
 * @param {string} text - Post text content
 * @param {string} imageBase64 - Base64 encoded image
 * @returns {Promise<Object>} Created post object
 */
export const createPostWithImageBase64 = async (text, imageBase64) => {
  const response = await apiClient.post("/posts", {
    text,
    imageBase64,
  });
  return response; // Interceptor already extracts response.data
};

/**
 * Create a new post with image (file upload)
 * @param {string} text - Post text content
 * @param {File} imageFile - Image file object
 * @returns {Promise<Object>} Created post object
 */
export const createPostWithImage = async (text, imageFile) => {
  const formData = new FormData();
  formData.append("text", text);
  formData.append("image", imageFile);

  const response = await apiClient.post("/posts", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return response; // Interceptor already extracts response.data
};

/**
 * Update an existing post
 * @param {string} postId - Post ID
 * @param {string} text - Updated text content
 * @returns {Promise<Object>} Updated post object
 */
export const updatePost = async (postId, text) => {
  const response = await apiClient.put(`/posts/${postId}`, {
    text,
  });
  return response; // Interceptor already extracts response.data
};

/**
 * Delete a post
 * @param {string} postId - Post ID
 * @returns {Promise<Object>} Success message
 */
export const deletePost = async (postId) => {
  const response = await apiClient.delete(`/posts/${postId}`);
  return response;
};

/**
 * Toggle like on a post (like/unlike) - idempotent operation
 * @param {string} postId - Post ID
 * @param {string} [requestId] - Optional request ID for deduplication and reconciliation
 * @returns {Promise<Object>} Updated post with like status { success, liked, likeCount, post, requestId }
 */
export const toggleLikePost = async (postId, requestId) => {
  // Generate requestId if not provided for request tracking
  const reqId = requestId || `like_${postId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  console.log(`[postService] Calling POST /posts/${postId}/like-toggle`, {
    postId,
    requestId: reqId,
    timestamp: new Date().toISOString(),
  });
  
  const response = await apiClient.post(`/posts/${postId}/like-toggle`, {
    requestId: reqId,
  });
  
  console.log("[postService] Response received:", {
    hasResponse: !!response,
    hasPost: !!response.post,
    hasSuccess: !!response.success,
    liked: response.liked,
    likeCount: response.likeCount,
    requestId: response.requestId,
    timestamp: new Date().toISOString(),
  });
  
  return response; // apiClient interceptor already extracts response.data
};

/**
 * Toggle reaction on a post (LinkedIn-style multi-reactions) - idempotent operation
 * @param {string} postId - Post ID
 * @param {string} reactionType - Type of reaction ('like', 'celebrate', 'support', 'funny', 'love', 'insightful', 'curious')
 * @param {string} [requestId] - Optional request ID for deduplication and reconciliation
 * @returns {Promise<Object>} Updated post with reaction status { success, reacted, reactionType, reactionCount, reactionCounts, post, requestId }
 */
export const toggleReactionPost = async (postId, reactionType, requestId) => {
  // Generate requestId if not provided for request tracking
  const reqId = requestId || `reaction_${postId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  console.log(`[postService] Calling POST /posts/${postId}/react`, {
    postId,
    reactionType,
    requestId: reqId,
    timestamp: new Date().toISOString(),
  });
  
  const response = await apiClient.post(`/posts/${postId}/react`, {
    reactionType,
    requestId: reqId,
  });
  
  console.log("[postService] Response received:", {
    hasResponse: !!response,
    hasPost: !!response.post,
    hasSuccess: !!response.success,
    reacted: response.reacted,
    reactionType: response.reactionType,
    reactionCount: response.reactionCount,
    reactionCounts: response.reactionCounts,
    requestId: response.requestId,
    timestamp: new Date().toISOString(),
  });
  
  return response; // apiClient interceptor already extracts response.data
};

/**
 * Add a comment to a post
 * @param {string} postId - Post ID
 * @param {string} text - Comment text
 * @returns {Promise<Object>} Updated post with new comment
 */
export const addComment = async (postId, text) => {
  const response = await apiClient.post(`/posts/${postId}/comments`, {
    text,
  });
  return response; // Interceptor already extracts response.data
};

/**
 * Delete a comment from a post
 * @param {string} postId - Post ID
 * @param {string} commentId - Comment ID
 * @returns {Promise<Object>} Updated post without the comment
 */
export const deleteComment = async (postId, commentId) => {
  const response = await apiClient.delete(`/posts/${postId}/comments/${commentId}`);
  return response; // Interceptor already extracts response.data
};

/**
 * Upload an image to get URL (standalone upload)
 * @param {File} imageFile - Image file object
 * @returns {Promise<string>} Image URL from Cloudinary
 */
export const uploadImage = async (imageFile) => {
  const formData = new FormData();
  formData.append("image", imageFile);

  const response = await apiClient.post("/uploads", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return response.url;
};

/**
 * Upload image as base64 to get URL
 * @param {string} imageBase64 - Base64 encoded image
 * @returns {Promise<string>} Image URL from Cloudinary
 */
export const uploadImageBase64 = async (imageBase64) => {
  const response = await apiClient.post("/uploads", {
    imageBase64,
  });
  return response.url;
};
