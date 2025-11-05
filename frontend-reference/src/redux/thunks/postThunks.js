import { createAsyncThunk } from "@reduxjs/toolkit";
import { postAPI, adaptPostsFromAPI, adaptPostFromAPI } from "../../services";
import { toast } from "react-toastify";

/**
 * Fetch paginated posts
 * @param {Object} params - Pagination parameters
 * @param {number} params.page - Page number
 * @param {number} params.limit - Items per page
 */
export const fetchPosts = createAsyncThunk(
  "posts/fetchPosts",
  async ({ page = 1, limit = 10 }, { rejectWithValue }) => {
    try {
      const response = await postAPI.getPosts(page, limit);
      const adaptedPosts = adaptPostsFromAPI(response.posts);
      return {
        posts: adaptedPosts,
        pagination: response.pagination,
      };
    } catch (error) {
      const message = error.response?.data?.message || "Failed to fetch posts";
      return rejectWithValue(message);
    }
  }
);

/**
 * Fetch single post by ID
 * @param {string} postId - Post ID
 */
export const fetchPostById = createAsyncThunk(
  "posts/fetchPostById",
  async (postId, { rejectWithValue }) => {
    try {
      const response = await postAPI.getPostById(postId);
      return adaptPostFromAPI(response.post);
    } catch (error) {
      const message = error.response?.data?.message || "Failed to fetch post";
      return rejectWithValue(message);
    }
  }
);

/**
 * Fetch user's posts
 * @param {Object} params - User and pagination parameters
 * @param {string} params.userId - User ID
 * @param {number} params.page - Page number
 * @param {number} params.limit - Items per page
 */
export const fetchUserPosts = createAsyncThunk(
  "posts/fetchUserPosts",
  async ({ userId, page = 1, limit = 10 }, { rejectWithValue }) => {
    try {
      const response = await postAPI.getUserPosts(userId, page, limit);
      const adaptedPosts = adaptPostsFromAPI(response.posts);
      return {
        posts: adaptedPosts,
        pagination: response.pagination,
      };
    } catch (error) {
      const message = error.response?.data?.message || "Failed to fetch user posts";
      return rejectWithValue(message);
    }
  }
);

/**
 * Create new text-only post
 * @param {string} text - Post text content
 */
export const createTextPost = createAsyncThunk(
  "posts/createTextPost",
  async (text, { rejectWithValue }) => {
    try {
      const response = await postAPI.createTextPost(text);
      toast.success("Post created!");
      return adaptPostFromAPI(response.post);
    } catch (error) {
      const message = error.response?.data?.message || "Failed to create post";
      toast.error(message);
      return rejectWithValue(message);
    }
  }
);

/**
 * Create post with image
 * @param {Object} data - Post data
 * @param {string} data.text - Post text content
 * @param {File} data.imageFile - Image file to upload
 */
export const createPostWithImage = createAsyncThunk(
  "posts/createPostWithImage",
  async ({ text, imageFile }, { rejectWithValue }) => {
    try {
      const response = await postAPI.createPostWithImage(text, imageFile);
      toast.success("Post created!");
      return adaptPostFromAPI(response.post);
    } catch (error) {
      const message = error.response?.data?.message || "Failed to create post";
      toast.error(message);
      return rejectWithValue(message);
    }
  }
);

/**
 * Create post with base64 image
 * @param {Object} data - Post data
 * @param {string} data.text - Post text content
 * @param {string} data.imageBase64 - Base64 encoded image
 */
export const createPostWithImageBase64 = createAsyncThunk(
  "posts/createPostWithImageBase64",
  async ({ text, imageBase64 }, { rejectWithValue }) => {
    try {
      const response = await postAPI.createPostWithImageBase64(text, imageBase64);
      toast.success("Post created!");
      return adaptPostFromAPI(response.post);
    } catch (error) {
      const message = error.response?.data?.message || "Failed to create post";
      toast.error(message);
      return rejectWithValue(message);
    }
  }
);

/**
 * Update existing post
 * @param {Object} data - Update data
 * @param {string} data.postId - Post ID
 * @param {string} data.text - New text content
 */
export const updatePost = createAsyncThunk(
  "posts/updatePost",
  async ({ postId, text }, { rejectWithValue }) => {
    try {
      const response = await postAPI.updatePost(postId, text);
      toast.success("Post updated!");
      return adaptPostFromAPI(response.post);
    } catch (error) {
      const message = error.response?.data?.message || "Failed to update post";
      toast.error(message);
      return rejectWithValue(message);
    }
  }
);

/**
 * Delete post
 * @param {string} postId - Post ID to delete
 */
export const deletePost = createAsyncThunk(
  "posts/deletePost",
  async (postId, { rejectWithValue }) => {
    try {
      await postAPI.deletePost(postId);
      toast.success("Post deleted!");
      return postId;
    } catch (error) {
      const message = error.response?.data?.message || "Failed to delete post";
      toast.error(message);
      return rejectWithValue(message);
    }
  }
);

// Track in-flight like requests to prevent duplicates and handle race conditions
const inFlightLikeRequests = new Map(); // postId -> { requestId, timestamp, promise }

/**
 * Toggle like on a post with optimistic updates, idempotency, and reconciliation
 * @param {Object} params - Like toggle parameters
 * @param {string} params.postId - Post ID
 * @param {string} params.userId - Current user ID for optimistic update
 * @returns {Promise<Object>} { postId, liked, likeCount, post, requestId }
 */
export const toggleLike = createAsyncThunk(
  "posts/toggleLike",
  async ({ postId, userId }, { rejectWithValue }) => {
    // Generate unique requestId for this specific request
    const requestId = `like_${postId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const requestTimestamp = Date.now();
    
    console.log(`[Like Request ${requestId}] Starting for post ${postId}`, {
      userId,
      timestamp: new Date().toISOString(),
      inFlightRequests: inFlightLikeRequests.size,
    });
    
    // Check for in-flight request for this post
    const existingRequest = inFlightLikeRequests.get(postId);
    if (existingRequest) {
      const timeSinceLastRequest = requestTimestamp - existingRequest.timestamp;
      
      // If request is less than 500ms old, wait for it instead of sending duplicate
      if (timeSinceLastRequest < 500) {
        console.log(`[Like Request ${requestId}] Deduplicating - waiting for existing request`, {
          existingRequestId: existingRequest.requestId,
          timeSinceLastRequest,
        });
        
        try {
          // Wait for existing request to complete
          const result = await existingRequest.promise;
          console.log(`[Like Request ${requestId}] Deduplicated successfully`, result);
          return result;
        } catch (error) {
          console.log(`[Like Request ${requestId}] Existing request failed, will retry`);
          // If existing request failed, continue with new request
        }
      }
    }
    
    // Create promise for this request
    const requestPromise = (async () => {
      try {
        // Call API with requestId for server-side deduplication
        const response = await postAPI.toggleLikePost(postId, requestId);
        
        console.log(`[Like Request ${requestId}] Raw Response:`, {
          hasResponse: !!response,
          hasPost: !!response?.post,
          liked: response?.liked,
          likeCount: response?.likeCount,
          serverRequestId: response?.requestId,
        });
        
        // Validate response structure
        if (!response || !response.post) {
          console.error(`[Like Request ${requestId}] Invalid response structure`, response);
          throw new Error("Invalid response from server - missing post data");
        }
        
        // Verify requestId matches (ignore stale responses)
        if (response.requestId && response.requestId !== requestId) {
          console.warn(`[Like Request ${requestId}] Response requestId mismatch - ignoring stale response`, {
            sentRequestId: requestId,
            receivedRequestId: response.requestId,
          });
          throw new Error("Stale response - requestId mismatch");
        }
        
        console.log(`[Like Request ${requestId}] Success`, {
          liked: response.liked,
          likeCount: response.likeCount,
          timestamp: new Date().toISOString(),
        });
        
        // Adapt the updated post to match frontend format
        const adaptedPost = adaptPostFromAPI(response.post);
        
        if (!adaptedPost) {
          console.error(`[Like Request ${requestId}] Failed to adapt post`, response.post);
          throw new Error("Failed to adapt post data");
        }
        
        // Return canonical server state
        return {
          postId,
          liked: response.liked, // Use 'liked' instead of 'isLiked' for consistency with backend
          likeCount: response.likeCount,
          post: adaptedPost,
          requestId,
        };
      } finally {
        // Clean up in-flight request tracking
        if (inFlightLikeRequests.get(postId)?.requestId === requestId) {
          inFlightLikeRequests.delete(postId);
        }
      }
    })();
    
    // Track this request
    inFlightLikeRequests.set(postId, {
      requestId,
      timestamp: requestTimestamp,
      promise: requestPromise,
    });
    
    try {
      const result = await requestPromise;
      return result;
    } catch (error) {
      console.error(`[Like Request ${requestId}] Failed`, {
        error: error.message,
        response: error.response?.data,
        timestamp: new Date().toISOString(),
      });
      
      // Attempt to reconcile with server canonical state on error
      try {
        console.log(`[Like Request ${requestId}] Fetching canonical state from server`);
        const canonicalPost = await postAPI.getPostById(postId);
        
        if (canonicalPost && canonicalPost.post) {
          const adaptedPost = adaptPostFromAPI(canonicalPost.post);
          
          console.log(`[Like Request ${requestId}] Reconciled with canonical state`, {
            liked: adaptedPost.likes?.includes(userId),
            likeCount: adaptedPost.intReactionCount,
          });
          
          // If server shows the post is liked, don't show error
          // Just reconcile UI to match server state
          return {
            postId,
            liked: adaptedPost.likes?.includes(userId) || false,
            likeCount: adaptedPost.intReactionCount || 0,
            post: adaptedPost,
            requestId,
            reconciled: true,
          };
        }
      } catch (reconcileError) {
        console.error(`[Like Request ${requestId}] Failed to reconcile`, {
          error: reconcileError.message,
        });
      }
      
      // Only show error toast if we couldn't reconcile
      const message = error.response?.data?.message || "Failed to like post";
      toast.error(message);
      
      return rejectWithValue({ message, postId, requestId });
    }
  }
);

/**
 * Add comment to post
 * @param {Object} data - Comment data
 * @param {string} data.postId - Post ID
 * @param {string} data.text - Comment text
 */
export const addComment = createAsyncThunk(
  "posts/addComment",
  async ({ postId, text }, { rejectWithValue }) => {
    try {
      const response = await postAPI.addComment(postId, text);
      toast.success("Comment added!");
      return {
        postId,
        comment: response.comment,
      };
    } catch (error) {
      const message = error.response?.data?.message || "Failed to add comment";
      toast.error(message);
      return rejectWithValue(message);
    }
  }
);

/**
 * Delete comment from post
 * @param {Object} data - Comment data
 * @param {string} data.postId - Post ID
 * @param {string} data.commentId - Comment ID
 */
export const deleteComment = createAsyncThunk(
  "posts/deleteComment",
  async ({ postId, commentId }, { rejectWithValue }) => {
    try {
      await postAPI.deleteComment(postId, commentId);
      toast.success("Comment deleted!");
      return {
        postId,
        commentId,
      };
    } catch (error) {
      const message = error.response?.data?.message || "Failed to delete comment";
      toast.error(message);
      return rejectWithValue(message);
    }
  }
);

// Track in-flight reaction requests to prevent duplicates
const inFlightReactionRequests = new Map(); // postId -> { requestId, timestamp, promise }

/**
 * Toggle reaction on a post (LinkedIn-style multi-reactions)
 * @param {Object} params - Reaction toggle parameters
 * @param {string} params.postId - Post ID
 * @param {string} params.userId - Current user ID for optimistic update
 * @param {string} params.reactionType - Type of reaction ('like', 'celebrate', 'support', etc.)
 * @returns {Promise<Object>} { postId, reacted, reactionType, reactionCount, reactionCounts, post, requestId }
 */
export const toggleReaction = createAsyncThunk(
  "posts/toggleReaction",
  async ({ postId, userId, reactionType = "like" }, { rejectWithValue }) => {
    // Generate unique requestId for this specific request
    const requestId = `reaction_${postId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const requestTimestamp = Date.now();
    
    console.log(`[Reaction Request ${requestId}] Starting for post ${postId}`, {
      userId,
      reactionType,
      timestamp: new Date().toISOString(),
    });
    
    // Check for in-flight request for this post
    const existingRequest = inFlightReactionRequests.get(postId);
    if (existingRequest) {
      const timeSinceLastRequest = requestTimestamp - existingRequest.timestamp;
      
      // If request is less than 500ms old, wait for it instead of sending duplicate
      if (timeSinceLastRequest < 500) {
        console.log(`[Reaction Request ${requestId}] Deduplicating - waiting for existing request`);
        
        try {
          const result = await existingRequest.promise;
          console.log(`[Reaction Request ${requestId}] Deduplicated successfully`, result);
          return result;
        } catch (error) {
          console.log(`[Reaction Request ${requestId}] Existing request failed, will retry`);
        }
      }
    }
    
    // Create promise for this request
    const requestPromise = (async () => {
      try {
        // Call API with requestId for server-side deduplication
        const response = await postAPI.toggleReactionPost(postId, reactionType, requestId);
        
        console.log(`[Reaction Request ${requestId}] Raw Response:`, {
          hasResponse: !!response,
          hasPost: !!response?.post,
          reacted: response?.reacted,
          reactionType: response?.reactionType,
          reactionCount: response?.reactionCount,
          serverRequestId: response?.requestId,
        });
        
        // Validate response structure
        if (!response || !response.post) {
          console.error(`[Reaction Request ${requestId}] Invalid response structure`, response);
          throw new Error("Invalid response from server - missing post data");
        }
        
        // Verify requestId matches (ignore stale responses)
        if (response.requestId && response.requestId !== requestId) {
          console.warn(`[Reaction Request ${requestId}] Response requestId mismatch - ignoring stale response`, {
            sentRequestId: requestId,
            receivedRequestId: response.requestId,
          });
          throw new Error("Stale response - requestId mismatch");
        }
        
        console.log(`[Reaction Request ${requestId}] Success`, {
          reacted: response.reacted,
          reactionType: response.reactionType,
          reactionCount: response.reactionCount,
          reactionCounts: response.reactionCounts,
          timestamp: new Date().toISOString(),
        });
        
        // Adapt the updated post to match frontend format
        const adaptedPost = adaptPostFromAPI(response.post);
        
        if (!adaptedPost) {
          console.error(`[Reaction Request ${requestId}] Failed to adapt post`, response.post);
          throw new Error("Failed to adapt post data");
        }
        
        // Return canonical server state
        return {
          postId,
          reacted: response.reacted,
          reactionType: response.reactionType,
          reactionCount: response.reactionCount,
          reactionCounts: response.reactionCounts || {},
          post: adaptedPost,
          requestId,
        };
      } finally {
        // Clean up in-flight request tracking
        if (inFlightReactionRequests.get(postId)?.requestId === requestId) {
          inFlightReactionRequests.delete(postId);
        }
      }
    })();
    
    // Track this request
    inFlightReactionRequests.set(postId, {
      requestId,
      timestamp: requestTimestamp,
      promise: requestPromise,
    });
    
    try {
      const result = await requestPromise;
      return result;
    } catch (error) {
      console.error(`[Reaction Request ${requestId}] Failed`, {
        error: error.message,
        response: error.response?.data,
        timestamp: new Date().toISOString(),
      });
      
      // Attempt to reconcile with server canonical state on error
      try {
        console.log(`[Reaction Request ${requestId}] Fetching canonical state from server`);
        const canonicalPost = await postAPI.getPostById(postId);
        
        if (canonicalPost && canonicalPost.post) {
          const adaptedPost = adaptPostFromAPI(canonicalPost.post);
          
          // Find user's reaction
          const userReaction = adaptedPost.reactions?.find(r => r.user === userId);
          
          // Calculate reaction counts
          const reactionCounts = {};
          if (adaptedPost.reactions) {
            adaptedPost.reactions.forEach(reaction => {
              const type = reaction.type || "like";
              reactionCounts[type] = (reactionCounts[type] || 0) + 1;
            });
          }
          
          console.log(`[Reaction Request ${requestId}] Reconciled with canonical state`, {
            reacted: !!userReaction,
            reactionType: userReaction ? userReaction.type : null,
            reactionCount: adaptedPost.reactions?.length || 0,
            reactionCounts,
          });
          
          // If server shows user has reacted, don't show error
          // Just reconcile UI to match server state
          return {
            postId,
            reacted: !!userReaction,
            reactionType: userReaction ? userReaction.type : null,
            reactionCount: adaptedPost.reactions?.length || 0,
            reactionCounts,
            post: adaptedPost,
            requestId,
            reconciled: true,
          };
        }
      } catch (reconcileError) {
        console.error(`[Reaction Request ${requestId}] Failed to reconcile`, {
          error: reconcileError.message,
        });
      }
      
      // Only show error toast if we couldn't reconcile
      const message = error.response?.data?.message || "Failed to react to post";
      toast.error(message);
      
      return rejectWithValue({ message, postId, requestId });
    }
  }
);
