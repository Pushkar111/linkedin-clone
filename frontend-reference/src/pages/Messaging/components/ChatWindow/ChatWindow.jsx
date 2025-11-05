/**
 * ChatWindow Component
 * Displays messages and message composer with real-time Socket.io
 */

import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import { messageAPI } from "../../../../services";
import { useSocket } from "../../../../contexts/SocketContext";
import { playNotificationSound, isWindowActive } from "../../../../utilities/notificationSound";
import MessageComposer from "../MessageComposer";
import "./ChatWindow.css";

export default function ChatWindow({
  conversation,
  currentUserId,
  onBack,
  onNewMessage
}) {
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef(null);
  
  // Enhanced socket context with presence and typing
  const { 
    socket, 
    joinConversation, 
    leaveConversation, 
    markAsRead,
    isUserOnline,
    getUserPresence,
    // isTypingInConversation,
    getTypingUser
  } = useSocket();

  const otherUser = conversation.otherParticipant;
  const conversationId = conversation._id;
  
  const handleUserProfileClick = () => {
    if (otherUser?._id) {
      navigate(`/profile/${otherUser._id}`);
    }
  };
  
  // Get real-time presence and typing state
  const otherUserPresence = getUserPresence(otherUser?._id);
  const isOnline = isUserOnline(otherUser?._id);
  const typingUser = getTypingUser(conversationId);
  const isOtherUserTyping = typingUser && typingUser.userId === otherUser?._id;  

  // Load messages when conversation changes
  useEffect(() => {
    const loadMessages = async () => {
      if (!conversation?._id) return;

      try {
        setLoading(true);
        const data = await messageAPI.getMessages(conversation._id);
        setMessages(data.messages || []);
        
        // Mark as read
        await messageAPI.markAsRead(conversation._id);
        
        // Join socket room
        joinConversation(conversation._id);
        
        // Emit conversation:opened to update unread count
        if (socket) {
          socket.emit("conversation:opened", { conversationId: conversation._id });
          console.log("📖 Emitted conversation:opened for:", conversation._id);
        }
      } catch (error) {
        console.error("Failed to load messages:", error);
      } finally {
        setLoading(false);
      }
    };

    loadMessages();

    // Leave socket room on unmount or conversation change
    return () => {
      if (conversation?._id) {
        leaveConversation(conversation._id);
      }
    };
  }, [conversation?._id, joinConversation, leaveConversation, socket]);

  // Socket.io listeners for real-time messages
  useEffect(() => {
    if (!socket || !conversation?._id) {
      console.log("⚠️ Socket listener not set up:", { 
        hasSocket: !!socket, 
        conversationId: conversation?._id 
      });
      return;
    }

    console.log("👂 Setting up socket listener for conversation:", conversation._id);

    // Listen for new messages in this conversation
    const handleNewMessage = ({ message, conversationId }) => {
      console.log("📨 Socket received new_message:", { 
        conversationId, 
        messageId: message._id,
        content: message.content?.substring(0, 20) + "..."
      });

      if (conversationId === conversation._id) {
        // Check if message is from another user (not sent by current user)
        const isFromOtherUser = message.sender?._id !== currentUserId;
        
        setMessages(prev => {
          // Avoid duplicates
          const exists = prev.some(m => m._id === message._id);
          if (exists) {
            console.log("⚠️ Duplicate message ignored:", message._id);
            return prev;
          }
          console.log("✅ Adding new message to state");
          
          // Play notification sound if message is from another user and window is not active
          if (isFromOtherUser && !isWindowActive()) {
            console.log("🔔 Playing notification sound for incoming message");
            playNotificationSound();
          }
          
          return [...prev, message];
        });

        // Mark as read if window is active
        if (isWindowActive()) {
          markAsRead(conversation._id);
        }
      } else {
        console.log("⚠️ Message for different conversation, ignoring");
      }
    };

    socket.on("new_message", handleNewMessage);

    // Cleanup
    return () => {
      console.log("🧹 Cleaning up socket listener for:", conversation._id);
      socket.off("new_message", handleNewMessage);
    };
  }, [socket, conversation?._id, markAsRead]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSendMessage = async (content) => {
    if (!content.trim() || !conversation?._id) return;

    try {
      const newMessage = await messageAPI.sendMessage(conversation._id, content.trim());
      
      // Add to messages list (Socket.io will also send it, but we show optimistically)
      setMessages(prev => [...prev, newMessage]);
      
      // Notify parent
      if (onNewMessage) {
        onNewMessage(newMessage);
      }
    } catch (error) {
      console.error("Failed to send message:", error);
    }
  };

  const groupMessagesByDate = (messages) => {
    const groups = [];
    let currentDate = null;

    messages.forEach(msg => {
      const msgDate = new Date(msg.createdAt).toDateString();
      
      if (msgDate !== currentDate) {
        currentDate = msgDate;
        groups.push({
          type: "date",
          date: new Date(msg.createdAt)
        });
      }
      
      groups.push({
        type: "message",
        data: msg
      });
    });

    return groups;
  };

  const formatDate = (date) => {
    const today = new Date().toDateString();
    const yesterday = new Date(Date.now() - 86400000).toDateString();
    const msgDate = date.toDateString();

    if (msgDate === today) return "Today";
    if (msgDate === yesterday) return "Yesterday";
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  const groupedMessages = groupMessagesByDate(messages);

  return (
    <div className="chat-window">
      {/* Header with online status */}
      <div className="chat-header">
        <button className="back-button" onClick={onBack}>
          <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
            <path d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" />
          </svg>
        </button>
        
        <div className="chat-header-user">
          <div 
            style={{ position: "relative", display: "inline-block", cursor: "pointer" }}
            onClick={handleUserProfileClick}
          >
            <img
              src={otherUser?.profilePicURL || "/default-avatar.png"}
              alt={otherUser?.fullName}
              className="chat-header-avatar"
              style={{ transition: "opacity 0.2s" }}
              onMouseEnter={(e) => e.currentTarget.style.opacity = "0.8"}
              onMouseLeave={(e) => e.currentTarget.style.opacity = "1"}
            />
            {/* Online status indicator */}
            <span 
              className={`status-indicator ${isOnline ? "online" : "offline"}`}
              title={isOnline ? "Online" : `Last seen ${otherUserPresence?.lastSeen ? formatDistanceToNow(otherUserPresence.lastSeen, { addSuffix: true }) : "recently"}`}
              style={{
                position: "absolute",
                bottom: "2px",
                right: "2px",
                width: "12px",
                height: "12px",
                borderRadius: "50%",
                backgroundColor: isOnline ? "#2ecc71" : "#95a5a6",
                border: "2px solid white",
                boxShadow: "0 1px 3px rgba(0,0,0,0.2)"
              }}
            />
          </div>
          <div className="chat-header-info">
            <h3 
              className="chat-header-name" 
              onClick={handleUserProfileClick}
              style={{ cursor: "pointer" }}
            >
              {otherUser?.fullName || "Unknown User"}
            </h3>
            {/* Show typing indicator or headline */}
            {isOtherUserTyping ? (
              <p className="chat-header-typing" style={{ color: "#0a66c2", fontStyle: "italic", fontSize: "13px" }}>
                typing...
              </p>
            ) : otherUser?.headline ? (
              <p className="chat-header-headline">{otherUser.headline}</p>
            ) : (
              <p className="chat-header-status" style={{ color: "#666", fontSize: "13px" }}>
                {isOnline ? "Active now" : `Last seen ${otherUserPresence?.lastSeen ? formatDistanceToNow(otherUserPresence.lastSeen, { addSuffix: true }) : "recently"}`}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="chat-messages">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-500">Loading messages...</p>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-500">No messages yet. Start the conversation!</p>
          </div>
        ) : (
          <>
            {groupedMessages.map((item, index) => {
              if (item.type === "date") {
                return (
                  <div key={`date-${index}`} className="message-date-divider">
                    <span>{formatDate(item.date)}</span>
                  </div>
                );
              }

              const msg = item.data;
              const isOwn = msg.sender?._id === currentUserId || msg.sender === currentUserId;

              return (
                <div
                  key={msg._id}
                  className={`message-bubble ${isOwn ? "own" : "other"}`}
                >
                  {!isOwn && (
                    <img
                      src={otherUser?.profilePicURL || "/default-avatar.png"}
                      alt={otherUser?.fullName}
                      className="message-avatar"
                      onClick={handleUserProfileClick}
                      style={{ cursor: "pointer", transition: "opacity 0.2s" }}
                      onMouseEnter={(e) => e.currentTarget.style.opacity = "0.8"}
                      onMouseLeave={(e) => e.currentTarget.style.opacity = "1"}
                    />
                  )}
                  <div className={`message-content ${isOwn ? "own" : "other"}`}>
                    <p className="message-text">{msg.content}</p>
                    <span className="message-time">
                      {formatDistanceToNow(new Date(msg.createdAt), { addSuffix: true })}
                    </span>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Composer with typing indicators */}
      <MessageComposer 
        onSend={handleSendMessage} 
        conversationId={conversationId}
      />
    </div>
  );
}
