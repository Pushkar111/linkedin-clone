/**
 * ============================================================================
 * CONNECTION API SERVICE - LinkedIn-Style Connection System
 * ============================================================================
 * 
 * Handles bi-directional connection requests and degree relationships
 * Supports: 1st, 2nd, 3rd degree connections
 * 
 * Connection States:
 * - NOT_CONNECTED (3rd degree) → Show "Connect" button
 * - PENDING_SENT → Show "Pending" (request sent by current user)
 * - PENDING_RECEIVED → Show "Accept/Ignore" (request received)
 * - CONNECTED (1st degree) → Show "Message" + "Remove Connection"
 * - MUTUAL (2nd degree) → Connected through mutual friend
 * 
 * @version 2.0.0
 */

import apiClient from "./apiClient";

/**
 * Get connection status between current user and target user
 * 
 * @param {string} targetUserId - Target user ID
 * @returns {Promise<Object>} Connection status
 * 
 * Response:
 * {
 *   status: "NOT_CONNECTED" | "PENDING_SENT" | "PENDING_RECEIVED" | "CONNECTED",
 *   degree: 1 | 2 | 3,
 *   mutualConnections: number,
 *   connectionId: string (if connected)
 * }
 */
export const getConnectionStatus = async (targetUserId) => {
  try {
    const response = await apiClient.get(`/connections/status/${targetUserId}`);
    return {
      status: response.status || "NOT_CONNECTED",
      degree: response.degree || 3,
      mutualConnections: response.mutualConnections || 0,
      connectionId: response.connectionId || null,
      requestId: response.requestId || null
    };
  } catch (error) {
    console.error("Failed to fetch connection status:", error);
    return {
      status: "NOT_CONNECTED",
      degree: 3,
      mutualConnections: 0,
      connectionId: null
    };
  }
};

/**
 * Send connection request to user
 * 
 * @param {string} targetUserId - User to connect with
 * @param {string} message - Optional personalized message
 * @returns {Promise<Object>} Request result
 */
export const sendConnectionRequest = async (targetUserId, message = "") => {
  try {
    const response = await apiClient.post("/connections/request", {
      targetUserId,
      message
    });
    
    return {
      success: response.success !== false,
      message: response.message || "Connection request sent",
      requestId: response.requestId,
      status: "PENDING_SENT"
    };
  } catch (error) {
    console.error("Failed to send connection request:", error);
    throw new Error(error.message || "Failed to send request");
  }
};

/**
 * Accept connection request
 * 
 * @param {string} requestId - Connection request ID
 * @returns {Promise<Object>} Accept result
 */
export const acceptConnectionRequest = async (requestId) => {
  try {
    const response = await apiClient.post(`/connections/accept/${requestId}`);
    
    return {
      success: response.success !== false,
      message: response.message || "Connection accepted",
      connectionId: response.connectionId,
      status: "CONNECTED"
    };
  } catch (error) {
    console.error("Failed to accept connection:", error);
    throw new Error(error.message || "Failed to accept connection");
  }
};

/**
 * Ignore/Reject connection request
 * 
 * @param {string} requestId - Connection request ID
 * @returns {Promise<Object>} Rejection result
 */
export const ignoreConnectionRequest = async (requestId) => {
  try {
    const response = await apiClient.post(`/connections/ignore/${requestId}`);
    
    return {
      success: response.success !== false,
      message: response.message || "Request ignored",
      status: "NOT_CONNECTED"
    };
  } catch (error) {
    console.error("Failed to ignore connection:", error);
    throw new Error(error.message || "Failed to ignore request");
  }
};

/**
 * Withdraw sent connection request
 * 
 * @param {string} requestId - Connection request ID
 * @returns {Promise<Object>} Withdrawal result
 */
export const withdrawConnectionRequest = async (requestId) => {
  try {
    const response = await apiClient.delete(`/connections/request/${requestId}`);
    
    return {
      success: response.success !== false,
      message: response.message || "Request withdrawn",
      status: "NOT_CONNECTED"
    };
  } catch (error) {
    console.error("Failed to withdraw request:", error);
    throw new Error(error.message || "Failed to withdraw request");
  }
};

/**
 * Remove existing connection
 * 
 * @param {string} connectionId - Connection ID
 * @returns {Promise<Object>} Removal result
 */
export const removeConnection = async (connectionId) => {
  try {
    const response = await apiClient.delete(`/connections/${connectionId}`);
    
    return {
      success: response.success !== false,
      message: response.message || "Connection removed",
      status: "NOT_CONNECTED"
    };
  } catch (error) {
    console.error("Failed to remove connection:", error);
    throw new Error(error.message || "Failed to remove connection");
  }
};

/**
 * Get user"s connections (1st degree)
 * 
 * @param {string} userId - User ID
 * @param {number} page - Page number
 * @param {number} limit - Results per page
 * @returns {Promise<Object>} Connections list
 */
export const getUserConnections = async (userId, page = 1, limit = 20) => {
  try {
    const response = await apiClient.get(`/connections/user/${userId}`, {
      params: { page, limit }
    });
    
    const connections = response.connections || response.data || [];
    
    return {
      connections: connections.map(conn => ({
        _id: conn._id,
        userId: conn.userId || conn._id,
        name: conn.fullName || conn.name,
        fullName: conn.fullName || conn.name,
        headline: conn.profile?.headline || conn.headline || "",
        avatarUrl: conn.profilePicURL || conn.avatarUrl || "",
        profilePicURL: conn.profilePicURL || conn.avatarUrl || "",
        mutualConnections: conn.mutualConnections || 0,
        connectedAt: conn.connectedAt,
        degree: 1 // All direct connections are 1st degree
      })),
      pagination: {
        page: response.page || page,
        limit: response.limit || limit,
        total: response.total || connections.length,
        pages: response.pages || Math.ceil((response.total || connections.length) / limit)
      }
    };
  } catch (error) {
    console.error("Failed to fetch connections:", error);
    return { connections: [], pagination: { page: 1, limit, total: 0, pages: 0 } };
  }
};

/**
 * Get pending connection requests (received)
 * 
 * @param {number} page - Page number
 * @param {number} limit - Results per page
 * @returns {Promise<Object>} Pending requests
 */
export const getPendingRequests = async (page = 1, limit = 10) => {
  try {
    const response = await apiClient.get("/connections/requests/pending", {
      params: { page, limit }
    });
    
    const requests = response.requests || response.data || [];
    
    return {
      requests: requests.map(req => ({
        _id: req._id,
        requestId: req._id,
        userId: req.sender?._id || req.senderId,
        name: req.sender?.fullName || req.sender?.name,
        fullName: req.sender?.fullName || req.sender?.name,
        headline: req.sender?.profile?.headline || req.sender?.headline || "",
        avatarUrl: req.sender?.profilePicURL || req.sender?.avatarUrl || "",
        profilePicURL: req.sender?.profilePicURL || req.sender?.avatarUrl || "",
        message: req.message || "",
        mutualConnections: req.mutualConnections || 0,
        createdAt: req.createdAt
      })),
      pagination: {
        page: response.page || page,
        limit: response.limit || limit,
        total: response.total || requests.length,
        pages: response.pages || Math.ceil((response.total || requests.length) / limit)
      }
    };
  } catch (error) {
    console.error("Failed to fetch pending requests:", error);
    return { requests: [], pagination: { page: 1, limit, total: 0, pages: 0 } };
  }
};

/**
 * Get sent connection requests (not yet accepted)
 * 
 * @param {number} page - Page number
 * @param {number} limit - Results per page
 * @returns {Promise<Object>} Sent requests
 */
export const getSentRequests = async (page = 1, limit = 10) => {
  try {
    const response = await apiClient.get("/connections/requests/sent", {
      params: { page, limit }
    });
    
    const requests = response.requests || response.data || [];
    
    return {
      requests: requests.map(req => ({
        _id: req._id,
        requestId: req._id,
        userId: req.receiver?._id || req.receiverId,
        name: req.receiver?.fullName || req.receiver?.name,
        fullName: req.receiver?.fullName || req.receiver?.name,
        headline: req.receiver?.profile?.headline || req.receiver?.headline || "",
        avatarUrl: req.receiver?.profilePicURL || req.receiver?.avatarUrl || "",
        profilePicURL: req.receiver?.profilePicURL || req.receiver?.avatarUrl || "",
        message: req.message || "",
        createdAt: req.createdAt
      })),
      pagination: {
        page: response.page || page,
        limit: response.limit || limit,
        total: response.total || requests.length,
        pages: response.pages || Math.ceil((response.total || requests.length) / limit)
      }
    };
  } catch (error) {
    console.error("Failed to fetch sent requests:", error);
    return { requests: [], pagination: { page: 1, limit, total: 0, pages: 0 } };
  }
};

/**
 * Get suggested connections (2nd & 3rd degree)
 * 
 * @param {number} limit - Number of suggestions
 * @returns {Promise<Array>} Suggested users
 */
export const getSuggestedConnections = async (limit = 10) => {
  try {
    const response = await apiClient.get("/connections/suggestions", {
      params: { limit }
    });
    
    const suggestions = response.suggestions || response.data || [];
    
    return suggestions.map(user => ({
      _id: user._id,
      userId: user._id,
      name: user.fullName || user.name,
      fullName: user.fullName || user.name,
      headline: user.profile?.headline || user.headline || "",
      avatarUrl: user.profilePicURL || user.avatarUrl || "",
      profilePicURL: user.profilePicURL || user.avatarUrl || "",
      mutualConnections: user.mutualConnections || 0,
      degree: user.degree || 2, // Typically 2nd or 3rd degree
      reason: user.reason || `${user.mutualConnections || 0} mutual connections`,
      status: user.connectionStatus || "NOT_CONNECTED"
    }));
  } catch (error) {
    console.error("Failed to fetch suggestions:", error);
    return [];
  }
};

/**
 * Calculate connection degree between two users
 * Used internally to determine relationship
 * 
 * @param {string} userId1 - First user ID
 * @param {string} userId2 - Second user ID
 * @returns {Promise<number>} Degree (1, 2, or 3)
 */
export const getConnectionDegree = async (userId1, userId2) => {
  try {
    const response = await apiClient.get(`/connections/degree/${userId1}/${userId2}`);
    return response.degree || 3;
  } catch (error) {
    console.error("Failed to calculate degree:", error);
    return 3; // Default to 3rd degree
  }
};

/**
 * Get mutual connections between two users
 * 
 * @param {string} userId1 - First user ID
 * @param {string} userId2 - Second user ID
 * @param {number} limit - Max number of mutuals to return
 * @returns {Promise<Array>} Mutual connections
 */
export const getMutualConnections = async (userId1, userId2, limit = 5) => {
  try {
    const response = await apiClient.get(`/connections/mutual/${userId1}/${userId2}`, {
      params: { limit }
    });
    
    const mutuals = response.mutuals || response.data || [];
    
    return mutuals.map(user => ({
      _id: user._id,
      name: user.fullName || user.name,
      fullName: user.fullName || user.name,
      headline: user.profile?.headline || user.headline || "",
      avatarUrl: user.profilePicURL || user.avatarUrl || "",
      profilePicURL: user.profilePicURL || user.avatarUrl || ""
    }));
  } catch (error) {
    console.error("Failed to fetch mutual connections:", error);
    return [];
  }
};

/**
 * Get connection statistics for user
 * 
 * @param {string} userId - User ID
 * @returns {Promise<Object>} Connection stats
 */
export const getConnectionStats = async (userId) => {
  try {
    const response = await apiClient.get(`/connections/stats/${userId}`);
    
    return {
      total: response.total || 0,
      firstDegree: response.firstDegree || 0,
      secondDegree: response.secondDegree || 0,
      pendingReceived: response.pendingReceived || 0,
      pendingSent: response.pendingSent || 0,
      growthThisMonth: response.growthThisMonth || 0,
      topIndustries: response.topIndustries || [],
      topLocations: response.topLocations || []
    };
  } catch (error) {
    console.error("Failed to fetch connection stats:", error);
    return {
      total: 0,
      firstDegree: 0,
      secondDegree: 0,
      pendingReceived: 0,
      pendingSent: 0,
      growthThisMonth: 0,
      topIndustries: [],
      topLocations: []
    };
  }
};

/**
 * Export React Query hooks for connection operations
 * Install: npm install @tanstack/react-query
 */

// Example usage with React Query:
/*
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { sendConnectionRequest, acceptConnectionRequest } from "./connectionAPI";

// In component:
const queryClient = useQueryClient();

// Send connection request with optimistic update
const sendRequestMutation = useMutation({
  mutationFn: (userId) => sendConnectionRequest(userId),
  onMutate: async (userId) => {
    // Cancel outgoing refetches
    await queryClient.cancelQueries(["connectionStatus", userId]);
    
    // Snapshot previous value
    const previous = queryClient.getQueryData(["connectionStatus", userId]);
    
    // Optimistically update
    queryClient.setQueryData(["connectionStatus", userId], {
      ...previous,
      status: "PENDING_SENT"
    });
    
    return { previous };
  },
  onError: (err, userId, context) => {
    // Rollback on error
    queryClient.setQueryData(["connectionStatus", userId], context.previous);
  },
  onSettled: (data, error, userId) => {
    // Refetch to sync with server
    queryClient.invalidateQueries(["connectionStatus", userId]);
    queryClient.invalidateQueries(["suggestions"]);
  }
});

// Accept connection request
const acceptRequestMutation = useMutation({
  mutationFn: (requestId) => acceptConnectionRequest(requestId),
  onSuccess: () => {
    // Refresh connections and pending lists
    queryClient.invalidateQueries(["connections"]);
    queryClient.invalidateQueries(["pendingRequests"]);
    queryClient.invalidateQueries(["suggestions"]);
  }
});

// Usage in JSX:
<button 
  onClick={() => sendRequestMutation.mutate(targetUserId)}
  disabled={sendRequestMutation.isLoading}
>
  {sendRequestMutation.isLoading ? "Sending..." : "Connect"}
</button>
*/
