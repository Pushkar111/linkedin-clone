/**
 * ============================================================================
 * NOTIFICATION API SERVICE - Frontend API Calls
 * ============================================================================
 * 
 * All notification-related API calls
 * 
 * @version 1.0.0
 */

import apiClient from "./apiClient";

/**
 * Get notifications (paginated)
 * @param {Object} options - Query options
 * @param {number} options.page - Page number
 * @param {number} options.limit - Items per page
 * @param {string} options.type - Filter by notification type
 * @param {boolean} options.unreadOnly - Only get unread notifications
 * @returns {Promise<Object>} Notifications with pagination
 */
export const getNotifications = async ({ page = 1, limit = 20, type, unreadOnly = false } = {}) => {
  try {
    const params = new URLSearchParams({ page, limit });
    if (type) params.append("type", type);
    if (unreadOnly) params.append("unreadOnly", "true");

    const response = await apiClient.get(`/notifications?${params}`);
    // apiClient interceptor already extracts response.data, so just return response
    return response;
  } catch (error) {
    console.error("Get notifications error:", error);
    throw error.response?.data || error;
  }
};

/**
 * Get unread notification count
 * @returns {Promise<number>} Unread count
 */
export const getUnreadCount = async () => {
  try {
    const response = await apiClient.get("/notifications/unread-count");
    // apiClient interceptor already extracts response.data
    return response.count;
  } catch (error) {
    console.error("Get unread count error:", error);
    return 0; // Return 0 on error to avoid breaking UI
  }
};

/**
 * Mark notification as read
 * @param {string} notificationId - Notification ID
 * @returns {Promise<Object>} Updated notification
 */
export const markNotificationAsRead = async (notificationId) => {
  try {
    const response = await apiClient.post(`/notifications/${notificationId}/read`);
    return response;
  } catch (error) {
    console.error("Mark as read error:", error);
    throw error.response?.data || error;
  }
};

/**
 * Mark all notifications as read
 * @returns {Promise<Object>} Result with count
 */
export const markAllNotificationsAsRead = async () => {
  try {
    const response = await apiClient.post("/notifications/mark-all-read");
    return response;
  } catch (error) {
    console.error("Mark all as read error:", error);
    throw error.response?.data || error;
  }
};

/**
 * Delete single notification
 * @param {string} notificationId - Notification ID
 * @returns {Promise<Object>} Success message
 */
export const deleteNotification = async (notificationId) => {
  try {
    const response = await apiClient.delete(`/notifications/${notificationId}`);
    return response;
  } catch (error) {
    console.error("Delete notification error:", error);
    throw error.response?.data || error;
  }
};

/**
 * Clear all read notifications
 * @returns {Promise<Object>} Result with count
 */
export const clearAllReadNotifications = async () => {
  try {
    const response = await apiClient.delete("/notifications/clear-all");
    return response;
  } catch (error) {
    console.error("Clear all notifications error:", error);
    throw error.response?.data || error;
  }
};

/**
 * Get notification statistics
 * @returns {Promise<Object>} Notification stats
 */
export const getNotificationStats = async () => {
  try {
    const response = await apiClient.get("/notifications/stats");
    return response.data.stats;
  } catch (error) {
    console.error("Get notification stats error:", error);
    throw error.response?.data || error;
  }
};

/**
 * Get notification icon based on type
 * @param {string} type - Notification type
 * @returns {string} Font Awesome icon class
 */
export const getNotificationIcon = (type) => {
  const icons = {
    CONNECTION_REQUEST: "fa-user-plus",
    CONNECTION_ACCEPTED: "fa-user-check",
    POST_LIKE: "fa-heart",
    POST_COMMENT: "fa-comment",
    PROFILE_VIEW: "fa-eye",
    SKILL_ENDORSEMENT: "fa-star",
    MENTION: "fa-at",
    POST_SHARE: "fa-share",
    MESSAGE: "fa-envelope"
  };
  return icons[type] || "fa-bell";
};

/**
 * Get notification color based on type
 * @param {string} type - Notification type
 * @returns {string} Tailwind color class
 */
export const getNotificationColor = (type) => {
  const colors = {
    CONNECTION_REQUEST: "text-blue-600",
    CONNECTION_ACCEPTED: "text-green-600",
    POST_LIKE: "text-red-600",
    POST_COMMENT: "text-purple-600",
    PROFILE_VIEW: "text-gray-600",
    SKILL_ENDORSEMENT: "text-yellow-600",
    MENTION: "text-indigo-600",
    POST_SHARE: "text-teal-600",
    MESSAGE: "text-blue-500"
  };
  return colors[type] || "text-gray-600";
};

/**
 * Format notification time (relative)
 * @param {string|Date} timestamp - Notification timestamp
 * @returns {string} Formatted time (e.g., "2m ago", "5h ago")
 */
export const formatNotificationTime = (timestamp) => {
  const now = new Date();
  const time = new Date(timestamp);
  const diff = Math.floor((now - time) / 1000); // seconds

  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  if (diff < 2592000) return `${Math.floor(diff / 604800)}w ago`;
  
  return time.toLocaleDateString("en-US", { month: "short", day: "numeric" });
};

// Export all functions as default object
export default {
  getNotifications,
  getUnreadCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  clearAllReadNotifications,
  getNotificationStats,
  getNotificationIcon,
  getNotificationColor,
  formatNotificationTime
};
