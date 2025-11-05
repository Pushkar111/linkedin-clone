/**
 * ============================================================================
 * NOTIFICATION DROPDOWN COMPONENT - Notification List Popup
 * ============================================================================
 * 
 * Displays recent notifications in a dropdown:
 * - Last 10 notifications
 * - Mark as read on click
 * - Navigate to notification link
 * - "View all" button
 * - "Mark all as read" button
 * - Empty state
 * 
 * @version 1.0.0
 */

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import {
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  getNotificationIcon,
  getNotificationColor,
  formatNotificationTime
} from "../../services/notificationAPI";

export default function NotificationDropdown({ 
  onClose, 
  onViewAll, 
  onNotificationRead,
  onCountUpdate 
}) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const response = await getNotifications({ limit: 10, page: 1 });
      console.log("Notifications response:", response);
      
      // Check if response has the expected structure
      if (response && Array.isArray(response.notifications)) {
        setNotifications(response.notifications);
      } else if (Array.isArray(response)) {
        // In case the API returns notifications array directly
        setNotifications(response);
      } else {
        console.warn("Unexpected notifications response format:", response);
        setNotifications([]);
      }
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
      console.error("Error details:", error.response || error.message);
      toast.error("Failed to load notifications");
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  const handleNotificationClick = async (notification) => {
    try {
      // Mark as read if unread
      if (!notification.read) {
        await markNotificationAsRead(notification._id);
        onNotificationRead();
        
        // Update local state
        setNotifications(prev =>
          prev.map(n => n._id === notification._id ? { ...n, read: true } : n)
        );
      }

      // Navigate to link (remove /linkedin prefix if present since BrowserRouter basename handles it)
      const link = notification.link.replace(/^\/linkedin/, "");
      navigate(link);
      onClose();
    } catch (error) {
      console.error("Failed to mark notification as read:", error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllNotificationsAsRead();
      
      // Update local state
      setNotifications(prev =>
        prev.map(n => ({ ...n, read: true }))
      );
      
      // Update unread count
      onCountUpdate(0);
      
      toast.success("All notifications marked as read");
    } catch (error) {
      console.error("Failed to mark all as read:", error);
      toast.error("Failed to mark all as read");
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -10, scale: 0.95 }}
      transition={{ duration: 0.15 }}
      className="absolute right-0 mt-2 w-96 max-w-[calc(100vw-2rem)] bg-white rounded-lg shadow-xl border border-gray-200 z-50 overflow-hidden"
    >
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between bg-gray-50">
        <h3 className="text-lg font-semibold text-color-text-darker">
          Notifications
        </h3>
        {notifications.some(n => !n.read) && (
          <button
            onClick={handleMarkAllAsRead}
            className="text-sm text-color-button-blue hover:text-color-button-blue-darker font-medium transition-colors"
          >
            Mark all as read
          </button>
        )}
      </div>

      {/* Notifications List */}
      <div className="max-h-[400px] overflow-y-auto">
        {loading ? (
          // Loading skeleton
          <div className="p-4 space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex items-start gap-3 animate-pulse">
                <div className="w-10 h-10 bg-gray-200 rounded-full" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4" />
                  <div className="h-3 bg-gray-200 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : notifications.length === 0 ? (
          // Empty state
          <div className="p-8 text-center">
            <i className="fas fa-bell-slash text-4xl text-gray-300 mb-3" />
            <p className="text-color-text font-medium mb-1">No notifications yet</p>
            <p className="text-sm text-color-text">
              When you get notifications, they will show up here
            </p>
          </div>
        ) : (
          // Notification items
          notifications.map((notification) => (
            <motion.button
              key={notification._id}
              onClick={() => handleNotificationClick(notification)}
              className={`w-full px-4 py-3 flex items-start gap-3 hover:bg-gray-50 transition-colors text-left border-b border-gray-100 last:border-b-0 ${
                !notification.read ? "bg-blue-50" : ""
              }`}
              whileHover={{ x: 2 }}
            >
              {/* Sender Avatar */}
              <div className="flex-shrink-0">
                {notification.sender?.profilePicURL ? (
                  <img
                    src={notification.sender.profilePicURL}
                    alt={notification.sender.fullName}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                    <i className="fas fa-user text-gray-500" />
                  </div>
                )}

                {/* Notification Type Icon Badge */}
                <div
                  className={`w-5 h-5 rounded-full bg-white border-2 border-white flex items-center justify-center -mt-3 ml-6 ${getNotificationColor(
                    notification.type
                  )}`}
                >
                  <i className={`fas ${getNotificationIcon(notification.type)} text-xs`} />
                </div>
              </div>

              {/* Notification Content */}
              <div className="flex-1 min-w-0">
                <p className="text-sm text-color-text-darker font-medium mb-1">
                  {notification.message}
                </p>
                <p className="text-xs text-color-text">
                  {formatNotificationTime(notification.createdAt)}
                </p>
              </div>

              {/* Unread Indicator */}
              {!notification.read && (
                <div className="flex-shrink-0">
                  <span className="inline-block w-2 h-2 bg-color-button-blue rounded-full" />
                </div>
              )}
            </motion.button>
          ))
        )}
      </div>

      {/* Footer */}
      {notifications.length > 0 && (
        <div className="px-4 py-3 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onViewAll}
            className="w-full text-center text-sm font-medium text-color-button-blue hover:text-color-button-blue-darker transition-colors"
          >
            View all notifications
          </button>
        </div>
      )}
    </motion.div>
  );
}
