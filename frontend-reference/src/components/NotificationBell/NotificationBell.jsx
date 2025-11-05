/**
 * ============================================================================
 * NOTIFICATION BELL COMPONENT - Header Icon with Badge
 * ============================================================================
 * 
 * Displays notification bell icon in header with:
 * - Unread count badge
 * - Animated bell on new notifications
 * - Click to toggle dropdown
 * - Real-time updates
 * 
 * @version 1.0.0
 */

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import NotificationDropdown from "./NotificationDropdown";
import { getUnreadCount } from "../../services/notificationAPI";

export default function NotificationBell({ className = "", showLabel = true }) {
  const [unreadCount, setUnreadCount] = useState(0);
  const [showDropdown, setShowDropdown] = useState(false);
  const [hasNewNotification, setHasNewNotification] = useState(false);
  const bellRef = useRef(null);
  const navigate = useNavigate();

  // Fetch unread count on mount and every 30 seconds
  useEffect(() => {
    fetchUnreadCount();
    
    const interval = setInterval(fetchUnreadCount, 30000); // Poll every 30s
    
    return () => clearInterval(interval);
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (bellRef.current && !bellRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };

    if (showDropdown) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showDropdown]);

  const fetchUnreadCount = async () => {
    try {
      const count = await getUnreadCount();
      
      // Check if count increased (new notification)
      if (count > unreadCount) {
        setHasNewNotification(true);
        setTimeout(() => setHasNewNotification(false), 3000);
      }
      
      setUnreadCount(count);
    } catch (error) {
      console.error("Failed to fetch unread count:", error);
    }
  };

  const handleBellClick = () => {
    setShowDropdown(!showDropdown);
  };

  const handleViewAll = () => {
    setShowDropdown(false);
    navigate("/notifications");
  };

  const handleNotificationRead = () => {
    // Decrease count when notification is read
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  return (
    <div ref={bellRef} className={`relative ${className}`}>
      {/* Bell Button */}
      <motion.button
        onClick={handleBellClick}
        className="relative flex flex-col items-center justify-center gap-1 px-2 py-1 min-w-[60px] hover:bg-gray-100 transition-colors focus:outline-none"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        animate={hasNewNotification ? {
          rotate: [0, -15, 15, -15, 15, 0],
          transition: { duration: 0.5 }
        } : {}}
        aria-label={`Notifications ${unreadCount > 0 ? `- ${unreadCount} unread` : ""}`}
      >
        <div className={showLabel ? "relative" : "relative"}>
          {/* LinkedIn-style SVG bell icon */}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            data-supported-dps="24x24"
            fill="currentColor"
            width="24"
            height="24"
            focusable="false"
            className={showDropdown ? "text-color-button-blue" : "text-color-text-darker"}
          >
            <path d="M22 19h-8.28a2 2 0 11-3.44 0H2v-1a4.52 4.52 0 011.17-2.83l1-1.17h15.7l1 1.17A4.42 4.42 0 0122 18zM18.21 7.44A6.27 6.27 0 0012 2a6.27 6.27 0 00-6.21 5.44L5 13h14z"></path>
          </svg>

          {/* Unread Badge */}
        {unreadCount > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-1 -right-1 bg-red-600 text-white text-xs font-bold rounded-full min-w-[20px] h-5 flex items-center justify-center px-1"
          >
            {unreadCount > 99 ? "99+" : unreadCount}
          </motion.span>
        )}

        {/* New Notification Pulse */}
        {hasNewNotification && (
          <motion.span
            className="absolute top-0 right-0 h-3 w-3"
            initial={{ scale: 0 }}
            animate={{ scale: [1, 1.5, 1] }}
            transition={{ repeat: 3, duration: 0.5 }}
          >
            <span className="absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
          </motion.span>
        )}
        </div>

        {/* Label Text - Always visible */}
        <span className={`text-xs whitespace-nowrap ${showDropdown ? "text-color-button-blue font-semibold" : "text-color-text-darker"}`}>
          Notifications
        </span>
      </motion.button>

      {/* Dropdown */}
      <AnimatePresence>
        {showDropdown && (
          <NotificationDropdown
            onClose={() => setShowDropdown(false)}
            onViewAll={handleViewAll}
            onNotificationRead={handleNotificationRead}
            onCountUpdate={setUnreadCount}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
