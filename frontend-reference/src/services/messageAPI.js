/**
 * Message API Service
 * Frontend service for messaging operations
 */

import apiClient from "./apiClient";

/**
 * Get all conversations for current user
 */
export const getConversations = async (page = 1, limit = 20) => {
  try {
    const data = await apiClient.get("/messages/conversations", {
      params: { page, limit }
    });
    // apiClient returns response.data directly: { success: true, conversations: [], page: 1, hasMore: false }
    return {
      conversations: data.conversations || [],
      page: data.page || 1,
      hasMore: data.hasMore || false
    };
  } catch (error) {
    console.error("Failed to get conversations:", error);
    throw error;
  }
};

/**
 * Get or create conversation with a user
 */
export const getOrCreateConversation = async (recipientId) => {
  try {
    const data = await apiClient.post("/messages/conversation", {
      recipientId
    });
    // apiClient returns response.data directly: { success: true, conversation: {...} }
    return data.conversation;
  } catch (error) {
    console.error("Failed to get/create conversation:", error);
    throw error;
  }
};

/**
 * Get messages for a conversation
 */
export const getMessages = async (conversationId, page = 1, limit = 50) => {
  try {
    const data = await apiClient.get("/messages/conversation/" + conversationId, {
      params: { page, limit }
    });
    // apiClient returns response.data directly: { success: true, messages: [], page: 1, hasMore: false }
    return {
      messages: data.messages || [],
      page: data.page || 1,
      hasMore: data.hasMore || false
    };
  } catch (error) {
    console.error("Failed to get messages:", error);
    throw error;
  }
};

/**
 * Send a message
 */
export const sendMessage = async (conversationId, content, attachments = []) => {
  try {
    const data = await apiClient.post("/messages/send", {
      conversationId,
      content,
      attachments
    });
    // apiClient returns response.data directly: { success: true, message: {...} }
    return data.message;
  } catch (error) {
    console.error("Failed to send message:", error);
    throw error;
  }
};

/**
 * Mark messages as read
 */
export const markAsRead = async (conversationId) => {
  try {
    const data = await apiClient.post(`/messages/conversation/${conversationId}/read`);
    return data;
  } catch (error) {
    console.error("Failed to mark as read:", error);
    throw error;
  }
};

/**
 * Delete a message
 */
export const deleteMessage = async (messageId) => {
  try {
    const data = await apiClient.delete(`/messages/${messageId}`);
    return data;
  } catch (error) {
    console.error("Failed to delete message:", error);
    throw error;
  }
};

/**
 * Archive a conversation
 */
export const archiveConversation = async (conversationId) => {
  try {
    const data = await apiClient.post(`/messages/conversation/${conversationId}/archive`);
    return data;
  } catch (error) {
    console.error("Failed to archive conversation:", error);
    throw error;
  }
};

/**
 * Get total unread message count (total messages)
 */
export const getUnreadCount = async () => {
  try {
    const data = await apiClient.get("/messages/unread-count");
    // apiClient returns response.data directly: { success: true, count: 0 }
    return {
      success: true,
      count: data.count || 0
    };
  } catch (error) {
    console.error("Failed to get unread count:", error);
    return {
      success: false,
      count: 0
    };
  }
};

/**
 * Get count of conversations with unread messages (number of people with unread)
 */
export const getUnreadConversationsCount = async () => {
  try {
    const data = await apiClient.get("/messages/unread-conversations-count");
    // apiClient returns response.data directly: { success: true, unreadConversations: 0 }
    return {
      success: true,
      unreadConversations: data.unreadConversations || 0
    };
  } catch (error) {
    console.error("Failed to get unread conversations count:", error);
    return {
      success: false,
      unreadConversations: 0
    };
  }
};
