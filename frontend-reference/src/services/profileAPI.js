/**
 * ============================================================================
 * PROFILE API SERVICE
 * ============================================================================
 * 
 * Centralized API methods for profile-related operations
 * Implements both vanilla Axios and React Query patterns
 * 
 * Endpoints:
 * - GET /api/users/:userId - Get user profile
 * - GET /api/users/:userId/posts - Get user posts (paginated)
 * - POST /api/users/:userId/follow - Follow user
 * - DELETE /api/users/:userId/follow - Unfollow user
 * - GET /api/users/:userId/connections - Get connections
 * 
 * @version 1.0.0
 */

import apiClient from "./apiClient";

/**
 * Get user profile by ID
 * 
 * @param {string} userId - User ID
 * @returns {Promise<Object>} User profile data
 * 
 * Response format:
 * {
 *   _id: string,
 *   name: string,
 *   headline: string,
 *   avatarUrl: string,
 *   bannerUrl: string,
 *   location: string,
 *   bio: string,
 *   followersCount: number,
 *   connectionsCount: number,
 *   postCount: number,
 *   views: number,
 *   reactionsReceived: number,
 *   isFollowedByCurrentUser: boolean,
 *   isOwner: boolean,
 *   experience: Array,
 *   education: Array,
 *   skills: Array
 * }
 */
export const getUserProfile = async (userId) => {
  try {
    const response = await apiClient.get(`/users/${userId}`);
    
    // Backend returns { success: true, user: {...} }
    const user = response.user || response.data || response;
    
    // Transform to frontend format
    return {
      _id: user._id,
      name: user.fullName || user.name || "",
      email: user.email || "",
      headline: user.profile?.headline || user.headline || "",
      avatarUrl: user.profilePicURL || user.avatarUrl || "",
      bannerUrl: user.profile?.bannerUrl || user.profile?.backgroundPicURL || user.bannerUrl || "",
      location: user.profile?.location || user.location || "",
      bio: user.profile?.about || user.bio || "",
      website: user.profile?.website || user.website || "",
      
      // Counts
      followersCount: user.followersCount || 0,
      followingCount: user.followingCount || 0,
      connectionsCount: user.connectionsCount || 0,
      postCount: user.postCount || 0,
      views: user.profileViews || 0,
      reactionsReceived: user.reactionsReceived || 0,
      
      // Flags
      isFollowedByCurrentUser: user.isFollowedByCurrentUser || false,
      isOwner: user.isOwner || false,
      
      // Arrays
      experience: user.profile?.experience || user.experience || [],
      education: user.profile?.education || user.education || [],
      skills: user.profile?.skills || user.skills || [],
      
      // Timestamps
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    };
  } catch (error) {
    console.error("Failed to fetch user profile:", error);
    throw new Error(error.message || "Failed to load profile");
  }
};

/**
 * Get user posts with pagination
 * 
 * @param {string} userId - User ID
 * @param {number} page - Page number (1-indexed)
 * @param {number} limit - Posts per page
 * @returns {Promise<Object>} Posts data with pagination
 * 
 * Response format:
 * {
 *   posts: [{
 *     _id: string,
 *     content: string,
 *     text: string,
 *     mediaURL: string,
 *     attachments: Array,
 *     createdAt: string,
 *     likes: Array,
 *     intReactionCount: number,
 *     commentCount: number,
 *     author: {
 *       _id: string,
 *       name: string,
 *       fullName: string,
 *       profilePicURL: string,
 *       headline: string
 *     }
 *   }],
 *   pagination: {
 *     page: number,
 *     limit: number,
 *     total: number,
 *     hasMore: boolean
 *   }
 * }
 */
export const getUserPosts = async (userId, page = 1, limit = 10) => {
  try {
    // Backend endpoint: GET /api/users/:id/posts
    const response = await apiClient.get(`/users/${userId}/posts`, {
      params: { page, limit }
    });
    
    const posts = response.posts || response.data || [];
    
    return {
      posts: posts.map(post => {
        // Get author data from either 'user' or 'author' field
        const authorData = post.user || post.author;
        const isAuthorObject = typeof authorData === "object" && authorData !== null;
        
        return {
          ...post,
          _id: post._id || post.strPostId,
          content: post.text || post.content,
          text: post.text || post.content,
          mediaURL: post.mediaURL || post.mediaUrl,
          attachments: post.attachments || [],
          hashtags: post.hashtags || [],
          
          // Counts
          commentCount: post.commentCount || post.comments?.length || 0,
          intReactionCount: post.intReactionCount || post.reactions?.length || 0,
          
          // Author info - Only create if we have actual author data
          author: isAuthorObject ? {
            _id: authorData._id,
            name: authorData.fullName || authorData.name || "Unknown User",
            fullName: authorData.fullName || authorData.name || "Unknown User",
            profilePicURL: authorData.profilePicURL || authorData.avatarUrl || "",
            headline: authorData.profile?.headline || authorData.headline || "",
            email: authorData.email || ""
          } : undefined,
          
          // Keep the original user field as fallback
          user: post.user,
          
          // Arrays
          likes: post.likes || [],
          reactions: post.reactions || [],
          comments: post.comments || [],
          
          // Timestamps
          createdAt: post.createdAt,
          updatedAt: post.updatedAt
        };
      }),
      pagination: {
        page: response.page || page,
        limit: response.limit || limit,
        total: response.total || posts.length,
        pages: response.pages || Math.ceil((response.total || posts.length) / limit),
        hasMore: posts.length === limit && (response.page || page) < (response.pages || 1)
      }
    };
  } catch (error) {
    console.error("Failed to fetch user posts:", error);
    throw new Error(error.message || "Failed to load posts");
  }
};

/**
 * Follow a user
 * 
 * @param {string} userId - User ID to follow
 * @returns {Promise<Object>} Follow result
 * 
 * Response format:
 * {
 *   success: boolean,
 *   message: string,
 *   followersCount: number
 * }
 */
export const followUser = async (userId) => {
  try {
    const response = await apiClient.post(`/users/${userId}/follow`);
    return {
      success: response.success !== false,
      message: response.message || "Successfully followed user",
      followersCount: response.followersCount || response.data?.followersCount
    };
  } catch (error) {
    console.error("Failed to follow user:", error);
    throw new Error(error.message || error.error?.message || "Failed to follow user");
  }
};

/**
 * Unfollow a user
 * 
 * @param {string} userId - User ID to unfollow
 * @returns {Promise<Object>} Unfollow result
 * 
 * Response format:
 * {
 *   success: boolean,
 *   message: string,
 *   followersCount: number
 * }
 */
export const unfollowUser = async (userId) => {
  try {
    const response = await apiClient.delete(`/users/${userId}/follow`);
    return {
      success: response.success !== false,
      message: response.message || "Successfully unfollowed user",
      followersCount: response.followersCount || response.data?.followersCount
    };
  } catch (error) {
    console.error("Failed to unfollow user:", error);
    throw new Error(error.message || error.error?.message || "Failed to unfollow user");
  }
};

/**
 * Get user connections
 * 
 * @param {string} userId - User ID
 * @param {number} limit - Number of connections to fetch
 * @returns {Promise<Array>} Array of connections
 * 
 * Response format:
 * [{
 *   _id: string,
 *   name: string,
 *   headline: string,
 *   avatarUrl: string,
 *   mutualConnections: number
 * }]
 */
export const getUserConnections = async (userId, limit = 20) => {
  try {
    const response = await apiClient.get(`/users/${userId}/connections`, {
      params: { limit }
    });
    
    const connections = response.connections || response.data || [];
    
    // Transform connections to consistent format
    return connections.map(conn => ({
      _id: conn._id,
      name: conn.fullName || conn.name,
      fullName: conn.fullName || conn.name,
      headline: conn.profile?.headline || conn.headline || "",
      avatarUrl: conn.profilePicURL || conn.avatarUrl || "",
      profilePicURL: conn.profilePicURL || conn.avatarUrl || "",
      mutualConnections: conn.mutualConnections || 0,
      isConnected: conn.isConnected !== false
    }));
  } catch (error) {
    console.error("Failed to fetch connections:", error);
    return [];
  }
};

/**
 * Get suggested connections for user
 * 
 * @param {number} limit - Number of suggestions
 * @returns {Promise<Array>} Array of suggested users
 */
export const getSuggestedConnections = async (limit = 5) => {
  try {
    const response = await apiClient.get("/users/suggestions", {
      params: { limit }
    });
    
    const suggestions = response.suggestions || response.data || [];
    
    // Transform suggestions to consistent format
    return suggestions.map(user => ({
      _id: user._id,
      name: user.fullName || user.name,
      fullName: user.fullName || user.name,
      headline: user.profile?.headline || user.headline || "",
      avatarUrl: user.profilePicURL || user.avatarUrl || "",
      profilePicURL: user.profilePicURL || user.avatarUrl || "",
      mutualConnections: user.mutualConnections || 0,
      reason: user.reason || ""
    }));
  } catch (error) {
    console.error("Failed to fetch suggestions:", error);
    return [];
  }
};

/* ============================================================================
 * REACT QUERY HOOKS (Optional - for use with @tanstack/react-query)
 * ============================================================================
 * 
 * Install: npm install @tanstack/react-query
 * 
 * Usage in components:
 * 
 * import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
 * import { getUserProfile, followUser, unfollowUser } from "./profileAPI";
 * 
 * // In component:
 * const { data: profile, isLoading, error } = useQuery({
 *   queryKey: ["profile", userId],
 *   queryFn: () => getUserProfile(userId),
 *   staleTime: 1000 * 60 * 5 // 5 minutes
 * });
 * 
 * const queryClient = useQueryClient();
 * 
 * const followMutation = useMutation({
 *   mutationFn: followUser,
 *   onMutate: async (userId) => {
 *     // Optimistic update
 *     await queryClient.cancelQueries(["profile", userId]);
 *     const previousProfile = queryClient.getQueryData(["profile", userId]);
 *     
 *     queryClient.setQueryData(["profile", userId], (old) => ({
 *       ...old,
 *       isFollowedByCurrentUser: true,
 *       followersCount: (old?.followersCount || 0) + 1
 *     }));
 *     
 *     return { previousProfile };
 *   },
 *   onError: (err, userId, context) => {
 *     // Rollback on error
 *     queryClient.setQueryData(["profile", userId], context.previousProfile);
 *   },
 *   onSettled: (data, error, userId) => {
 *     // Refetch to sync with server
 *     queryClient.invalidateQueries(["profile", userId]);
 *   }
 * });
 * 
 * // Usage:
 * <button onClick={() => followMutation.mutate(userId)}>
 *   {followMutation.isLoading ? "Following..." : "Follow"}
 * </button>
 */
