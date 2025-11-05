/**
 * MessagingIcon Component
 * Displays messaging icon with unread message count badge
 * Integrates with Socket.io for real-time updates
 */

import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useSocket } from "../../contexts/SocketContext";
import { messageAPI } from "../../services";
import { NavigationPaths } from "../../utilities";

export function MessagingIcon() {
  const navigate = useNavigate();
  const location = useLocation();
  const { socket } = useSocket();
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  // Check if we"re on the messaging page
  const isOnMessagingPage = location.pathname.includes(NavigationPaths.MESSAGING);

  /**
   * Fetch initial unread conversations count
   */
  const fetchUnreadCount = async () => {
    try {
      const response = await messageAPI.getUnreadConversationsCount();
      if (response.success) {
        setUnreadCount(response.unreadConversations || 0);
        console.log("📬 Messaging Icon - Fetched unread conversations count:", response.unreadConversations);
      }
    } catch (error) {
      console.error("Error fetching unread conversations count:", error);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Reset unread count (called when user opens messaging page)
   */
  const resetUnreadCount = () => {
    console.log("🔄 Messaging Icon - Resetting unread count to 0");
    setUnreadCount(0);
  };

  // Fetch unread count on mount
  useEffect(() => {
    fetchUnreadCount();
  }, []);

  // Reset count when user is on messaging page
  useEffect(() => {
    if (isOnMessagingPage) {
      resetUnreadCount();
    }
  }, [isOnMessagingPage]);

  // Listen for unread conversations updates via Socket.io
  useEffect(() => {
    if (!socket) {
      console.log("⚠️ Messaging Icon - No socket connection");
      return;
    }

    const handleUnreadUpdate = ({ unreadConversations }) => {
      console.log("� Messaging Icon - Received conversations:unread_update:", unreadConversations);
      setUnreadCount(unreadConversations);
    };

    console.log("👂 Messaging Icon - Setting up socket listener for conversations:unread_update");
    socket.on("conversations:unread_update", handleUnreadUpdate);

    return () => {
      console.log("🧹 Messaging Icon - Cleaning up socket listener");
      socket.off("conversations:unread_update", handleUnreadUpdate);
    };
  }, [socket]);

  /**
   * Handle click on messaging icon
   */
  const handleClick = () => {
    console.log("🖱️ Messaging Icon - Clicked, navigating to messaging page");
    navigate("/" + NavigationPaths.MESSAGING);
    // Count will be reset by the useEffect watching location
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className={`
        relative flex items-center flex-row sm:flex-col gap-1.5 sm:gap-0 
        h-[52px] w-fit sm:w-[80px] sm:min-w-[80px] justify-center 
        sm:border-solid sm:border-b-2 
        ${isOnMessagingPage 
          ? "text-black sm:border-b-black" 
          : "text-color-text-low-emphasis hover:text-black sm:border-b-transparent hover:sm:border-b-color-text-low-emphasis"
        }
        transition-colors duration-200
      `}
      aria-label={`Messaging${unreadCount > 0 ? ` - ${unreadCount} unread` : ""}`}
    >
      {/* Messaging Icon */}
      <span className="flex w-8 sm:w-auto h-fit flex-shrink-0 relative">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          data-supported-dps="24x24"
          fill="currentColor"
          width="24"
          height="24"
          focusable="false"
        >
          <path d="M16 4H8a7 7 0 000 14h4v4l8.16-5.39A6.78 6.78 0 0023 11a7 7 0 00-7-7zm-8 8.25A1.25 1.25 0 119.25 11 1.25 1.25 0 018 12.25zm4 0A1.25 1.25 0 1113.25 11 1.25 1.25 0 0112 12.25zm4 0A1.25 1.25 0 1117.25 11 1.25 1.25 0 0116 12.25z"></path>
        </svg>

        {/* Unread Badge */}
        {!loading && unreadCount > 0 && (
          <span
            className="
              absolute -top-1 -right-1 
              flex items-center justify-center
              min-w-[18px] h-[18px] 
              px-1 
              bg-red-600 
              text-white text-[11px] font-bold 
              rounded-full 
              border-2 border-white
              animate-pulse
            "
            aria-label={`${unreadCount} unread messages`}
          >
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </span>

      {/* Text Label */}
      <span className="flex items-center text-sm font-bold sm:font-normal break-all leading-[18px]">
        Messaging
      </span>
    </button>
  );
}
