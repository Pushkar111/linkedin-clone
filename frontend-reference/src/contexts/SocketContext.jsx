/**
 * Socket Context
 * Provides Socket.io with real-time presence, typing indicators, and messaging
 */

import React, { createContext, useContext, useEffect, useState, useRef } from "react";
import { io } from "socket.io-client";
import { playNotificationSound, isWindowActive } from "../utilities/notificationSound";

const SocketContext = createContext(null);

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error("useSocket must be used within a SocketProvider");
  }
  return context;
};

export const SocketProvider = ({ children }) => {
  const [connected, setConnected] = useState(false);
  
  // Presence: userId -> { status: "online"|"offline", lastSeen: timestamp }
  const [userPresence, setUserPresence] = useState({});
  
  // Typing: conversationId -> { userId, userName, isTyping: true }
  const [typingStates, setTypingStates] = useState({});
  
  // Legacy support for onlineUsers array
  const [onlineUsers, setOnlineUsers] = useState([]);
  
  const socketRef = useRef(null);

  useEffect(() => {
    console.log("🔍 SocketContext useEffect triggered");
    
    // Get auth token
    const token = localStorage.getItem("token");
    console.log("🔑 Token check:", token ? "Token exists (length: " + token.length + ")" : "No token found");
    
    if (!token) {
      console.log("❌ No token found, socket not initialized");
      return;
    }

    console.log("🔌 Initializing Socket.io connection...");

    // Create socket connection
    // Socket.io connects to the base URL (without /api path)
    // Remove /api suffix if present in REACT_APP_API_URL
    const baseURL = process.env.REACT_APP_API_URL || "http://localhost:5000/api";
    const SOCKET_URL = baseURL.replace(/\/api$/, ""); // Remove trailing /api
    console.log("🌐 Connecting to Socket.io server:", SOCKET_URL);
    console.log("🎫 Auth token (first 20 chars):", token.substring(0, 20) + "...");
    
    const newSocket = io(SOCKET_URL, {
      auth: { token },
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 3,
      transports: ["websocket", "polling"] // Try websocket first, fallback to polling
    });

    console.log("📦 Socket instance created:", newSocket ? "YES" : "NO");
    socketRef.current = newSocket;

    // Connection event handlers
    console.log("🎧 Setting up Socket.io event listeners...");
    
    newSocket.on("connect", () => {
      console.log("✅ Socket connected successfully!");
      console.log("🆔 Socket ID:", newSocket.id);
      console.log("🔗 Connected:", newSocket.connected);
      setConnected(true);
    });

    newSocket.on("disconnect", (reason) => {
      console.log("❌ Socket disconnected");
      console.log("📋 Reason:", reason);
      setConnected(false);
    });

    newSocket.on("connect_error", (error) => {
      console.error("❌ Socket connection error occurred");
      console.error("📋 Error message:", error.message);
      console.error("📋 Full error object:", JSON.stringify(error, Object.getOwnPropertyNames(error)));
      setConnected(false);
      
      // If authentication fails, don"t retry
      if (error.message.includes("Authentication") || error.message.includes("Invalid")) {
        console.log("🔒 Socket authentication failed - messaging will work without real-time updates");
        console.log("🚫 Closing socket connection...");
        newSocket.close();
      }
    });

    // === Presence tracking (new format) ===
    newSocket.on("user:status", ({ userId, status, lastSeen, timestamp }) => {
      console.log(`👤 User status update: ${userId} -> ${status}`);
      setUserPresence(prev => ({
        ...prev,
        [userId]: {
          status,
          lastSeen: lastSeen || timestamp || Date.now(),
          updatedAt: Date.now()
        }
      }));

      // Update legacy onlineUsers array
      setOnlineUsers(prev => {
        if (status === "online" && !prev.includes(userId)) {
          return [...prev, userId];
        } else if (status === "offline") {
          return prev.filter(id => id !== userId);
        }
        return prev;
      });
    });

    // Legacy online users tracking (backward compatible)
    newSocket.on("online_users", ({ userIds }) => {
      console.log(`📋 Received online users list: ${userIds.length} users`);
      setOnlineUsers(userIds);
      
      // Initialize presence for all online users
      const presenceMap = {};
      userIds.forEach(uid => {
        presenceMap[uid] = { status: "online", lastSeen: null, updatedAt: Date.now() };
      });
      setUserPresence(prev => ({ ...prev, ...presenceMap }));
    });

    newSocket.on("user_online", ({ userId }) => {
      console.log(`🟢 User came online: ${userId}`);
      setUserPresence(prev => ({
        ...prev,
        [userId]: { status: "online", lastSeen: null, updatedAt: Date.now() }
      }));
      setOnlineUsers(prev => {
        if (!prev.includes(userId)) {
          return [...prev, userId];
        }
        return prev;
      });
    });

    newSocket.on("user_offline", ({ userId }) => {
      console.log(`🔴 User went offline: ${userId}`);
      setUserPresence(prev => ({
        ...prev,
        [userId]: { status: "offline", lastSeen: Date.now(), updatedAt: Date.now() }
      }));
      setOnlineUsers(prev => prev.filter(id => id !== userId));
    });

    // === Typing indicators ===
    newSocket.on("typing:show", ({ userId, userName, conversationId }) => {
      console.log(`⌨️  ${userName} (${userId}) started typing in ${conversationId}`);
      setTypingStates(prev => ({
        ...prev,
        [conversationId]: { userId, userName, isTyping: true }
      }));
    });

    newSocket.on("typing:hide", ({ userId, conversationId }) => {
      console.log(`⌨️  User ${userId} stopped typing in ${conversationId}`);
      setTypingStates(prev => {
        const updated = { ...prev };
        delete updated[conversationId];
        return updated;
      });
    });

    // Legacy typing support
    newSocket.on("user_typing", ({ userId, userName, conversationId, isTyping }) => {
      if (isTyping) {
        setTypingStates(prev => ({
          ...prev,
          [conversationId]: { userId, userName, isTyping: true }
        }));
      } else {
        setTypingStates(prev => {
          const updated = { ...prev };
          delete updated[conversationId];
          return updated;
        });
      }
    });

    // Global message notification (for when chat window is not in focus)
    newSocket.on("new_message", ({ message }) => {
      // Get current user ID from localStorage to check if message is from another user
      const currentUserString = localStorage.getItem("user");
      if (currentUserString) {
        try {
          const currentUser = JSON.parse(currentUserString);
          const isFromOtherUser = message.sender?._id !== currentUser._id;
          
          // Play sound if message is from another user and window is not active
          if (isFromOtherUser && !isWindowActive()) {
            console.log("🔔 Global: Playing notification sound for incoming message");
            playNotificationSound();
          }
        } catch (error) {
          console.warn("Could not parse current user for notification:", error);
        }
      }
    });

    // Error handling
    newSocket.on("error", ({ message }) => {
      console.error("Socket error:", message);
    });

    // Cleanup on unmount
    return () => {
      console.log("Cleaning up socket connection");
      newSocket.close();
    };
  }, []); // Empty dependency array - only connect once

  const value = {
    socket: socketRef.current,
    connected,
    
    // Presence state
    userPresence,
    onlineUsers, // Legacy array format
    
    // Typing state
    typingStates,
    
    // Helper methods
    isUserOnline: (userId) => {
      const presence = userPresence[userId];
      return presence?.status === "online" || onlineUsers.includes(userId);
    },
    
    getUserPresence: (userId) => userPresence[userId] || { status: "offline", lastSeen: null },
    
    isTypingInConversation: (conversationId) => typingStates[conversationId]?.isTyping || false,
    
    getTypingUser: (conversationId) => typingStates[conversationId] || null,
    
    // Emit events
    joinConversation: (conversationId) => {
      socketRef.current?.emit("join_conversation", { conversationId });
    },
    
    leaveConversation: (conversationId) => {
      socketRef.current?.emit("leave_conversation", { conversationId });
    },
    
    sendMessage: (conversationId, content, tempId) => {
      socketRef.current?.emit("send_message", { conversationId, content, tempId });
    },
    
    startTyping: (conversationId) => {
      socketRef.current?.emit("typing:start", { conversationId });
    },
    
    stopTyping: (conversationId) => {
      socketRef.current?.emit("typing:stop", { conversationId });
    },
    
    // Legacy typing support
    sendTyping: (conversationId, isTyping) => {
      if (isTyping) {
        socketRef.current?.emit("typing:start", { conversationId });
      } else {
        socketRef.current?.emit("typing:stop", { conversationId });
      }
    },
    
    markAsRead: (conversationId) => {
      socketRef.current?.emit("mark_as_read", { conversationId });
    }
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};
