/**
 * Message Routes
 * API endpoints for messaging system with 1st-degree connection enforcement
 */

import express from "express";
import { protect } from "../middleware/auth.js";
import { 
  ensureFirstDegree, 
  ensureConversationParticipantConnection 
} from "../middleware/checkConnection.js";
import {
  getConversations,
  getOrCreateConversation,
  getMessages,
  sendMessage,
  markAsRead,
  deleteMessage,
  archiveConversation,
  getUnreadCount,
  getUnreadConversationsCount
} from "../controllers/messageController.js";

const router = express.Router();

// All routes require authentication
router.use(protect);

// Conversation routes (with 1st-degree validation where needed)
router.get("/conversations", getConversations);
router.post("/conversation", ensureFirstDegree, getOrCreateConversation); // Enforce 1st-degree
router.get("/conversation/:conversationId", ensureConversationParticipantConnection, getMessages); // Verify connection
router.post("/conversation/:conversationId/read", markAsRead);
router.post("/conversation/:conversationId/archive", archiveConversation);

// Message routes (with 1st-degree validation)
router.post("/send", sendMessage); // Connection check done in controller for conversation access
router.delete("/:messageId", deleteMessage);

// Unread counts
router.get("/unread-count", getUnreadCount); // Total unread messages
router.get("/unread-conversations-count", getUnreadConversationsCount); // Number of conversations with unread

export default router;
