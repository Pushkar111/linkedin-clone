/**
 * ============================================================================
 * NOTIFICATIONS PAGE - Full Notifications List with Filters
 * ============================================================================
 * 
 * Complete notifications page with:
 * - All notifications (paginated)
 * - Filter by type
 * - Unread/All toggle
 * - Mark all as read
 * - Clear all read
 * - Infinite scroll
 * - Empty states
 * 
 * @version 1.0.0
 */

import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { toast } from "react-toastify";
import {
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  clearAllReadNotifications,
  deleteNotification,
  getNotificationIcon,
  getNotificationColor,
  formatNotificationTime
} from "../../services/notificationAPI";

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [filterType, setFilterType] = useState("all"); // all, unread
  const [selectedCategory, setSelectedCategory] = useState(""); // CONNECTION_REQUEST, POST_LIKE, etc.
  
  const navigate = useNavigate();
  const observer = useRef();
  const lastNotificationRef = useCallback((node) => {
    if (loadingMore) return;
    if (observer.current) observer.current.disconnect();
    
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        setPage(prev => prev + 1);
      }
    });
    
    if (node) observer.current.observe(node);
  }, [loadingMore, hasMore]);

  useEffect(() => {
    fetchNotifications(true);
  }, [filterType, selectedCategory]);

  useEffect(() => {
    if (page > 1) {
      fetchNotifications(false);
    }
  }, [page]);

  const fetchNotifications = async (reset = false) => {
    try {
      if (reset) {
        setLoading(true);
        setPage(1);
      } else {
        setLoadingMore(true);
      }

      const currentPage = reset ? 1 : page;
      const response = await getNotifications({
        page: currentPage,
        limit: 20,
        unreadOnly: filterType === "unread",
        type: selectedCategory || undefined
      });

      if (reset) {
        setNotifications(response.notifications || []);
      } else {
        setNotifications(prev => [...prev, ...(response.notifications || [])]);
      }

      setHasMore(response.pagination?.hasMore || false);
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
      toast.error("Failed to load notifications");
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const handleNotificationClick = async (notification) => {
    try {
      if (!notification.read) {
        await markNotificationAsRead(notification._id);
        setNotifications(prev =>
          prev.map(n => n._id === notification._id ? { ...n, read: true } : n)
        );
      }
      navigate(notification.link);
    } catch (error) {
      console.error("Failed to mark as read:", error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllNotificationsAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      toast.success("All notifications marked as read");
    } catch (error) {
      console.error("Failed to mark all as read:", error);
      toast.error("Failed to mark all as read");
    }
  };

  const handleClearAllRead = async () => {
    if (!window.confirm("Are you sure you want to clear all read notifications?")) return;
    
    try {
      await clearAllReadNotifications();
      setNotifications(prev => prev.filter(n => !n.read));
      toast.success("All read notifications cleared");
    } catch (error) {
      console.error("Failed to clear notifications:", error);
      toast.error("Failed to clear notifications");
    }
  };

  const handleDeleteNotification = async (notificationId, e) => {
    e.stopPropagation();
    
    try {
      await deleteNotification(notificationId);
      setNotifications(prev => prev.filter(n => n._id !== notificationId));
      toast.success("Notification deleted");
    } catch (error) {
      console.error("Failed to delete notification:", error);
      toast.error("Failed to delete notification");
    }
  };

  const notificationTypes = [
    { value: "", label: "All Types" },
    { value: "CONNECTION_REQUEST", label: "Connection Requests" },
    { value: "CONNECTION_ACCEPTED", label: "Connection Accepted" },
    { value: "POST_LIKE", label: "Post Likes" },
    { value: "POST_COMMENT", label: "Comments" },
    { value: "PROFILE_VIEW", label: "Profile Views" },
    { value: "SKILL_ENDORSEMENT", label: "Endorsements" },
    { value: "MENTION", label: "Mentions" },
    { value: "POST_SHARE", label: "Shares" },
  ];

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <>
      <Helmet>
        <title>Notifications | LinkedIn</title>
      </Helmet>

      <div className="min-h-screen bg-gray-100 py-6">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="bg-white rounded-lg shadow-sm p-6 mb-4">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-2xl font-bold text-color-text-darker">
                Notifications
              </h1>
              
              <div className="flex items-center gap-3">
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllAsRead}
                    className="text-sm text-color-button-blue hover:text-color-button-blue-darker font-medium transition-colors"
                  >
                    Mark all as read
                  </button>
                )}
                <button
                  onClick={handleClearAllRead}
                  className="text-sm text-red-600 hover:text-red-700 font-medium transition-colors"
                >
                  Clear read
                </button>
              </div>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap items-center gap-3">
              {/* Unread/All Toggle */}
              <div className="flex bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setFilterType("all")}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    filterType === "all"
                      ? "bg-white text-color-button-blue shadow-sm"
                      : "text-color-text hover:text-color-text-darker"
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setFilterType("unread")}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    filterType === "unread"
                      ? "bg-white text-color-button-blue shadow-sm"
                      : "text-color-text hover:text-color-text-darker"
                  }`}
                >
                  Unread {unreadCount > 0 && `(${unreadCount})`}
                </button>
              </div>

              {/* Category Filter */}
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-color-button-blue focus:border-transparent"
              >
                {notificationTypes.map(type => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Notifications List */}
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            {loading ? (
              // Loading skeleton
              <div className="divide-y divide-gray-100">
                {[1, 2, 3, 4, 5].map(i => (
                  <div key={i} className="p-4 flex items-start gap-4 animate-pulse">
                    <div className="w-12 h-12 bg-gray-200 rounded-full" />
                    <div className="flex-1 space-y-3">
                      <div className="h-4 bg-gray-200 rounded w-3/4" />
                      <div className="h-3 bg-gray-200 rounded w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : notifications.length === 0 ? (
              // Empty state
              <div className="p-12 text-center">
                <i className="fas fa-bell-slash text-6xl text-gray-300 mb-4" />
                <h3 className="text-xl font-semibold text-color-text-darker mb-2">
                  No notifications
                </h3>
                <p className="text-color-text">
                  {filterType === "unread"
                    ? "You're all caught up! No unread notifications."
                    : selectedCategory
                    ? "No notifications of this type."
                    : "When you get notifications, they'll show up here."}
                </p>
              </div>
            ) : (
              // Notification items
              <div className="divide-y divide-gray-100">
                {notifications.map((notification, index) => (
                  <motion.div
                    key={notification._id}
                    ref={index === notifications.length - 1 ? lastNotificationRef : null}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    onClick={() => handleNotificationClick(notification)}
                    className={`p-4 flex items-start gap-4 hover:bg-gray-50 cursor-pointer transition-colors group ${
                      !notification.read ? "bg-blue-50" : ""
                    }`}
                  >
                    {/* Avatar */}
                    <div className="flex-shrink-0 relative">
                      {notification.sender?.profilePicURL ? (
                        <img
                          src={notification.sender.profilePicURL}
                          alt={notification.sender.fullName}
                          className="w-12 h-12 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center">
                          <i className="fas fa-user text-gray-500" />
                        </div>
                      )}

                      {/* Type Icon Badge */}
                      <div
                        className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-white border-2 border-white flex items-center justify-center ${getNotificationColor(
                          notification.type
                        )}`}
                      >
                        <i className={`fas ${getNotificationIcon(notification.type)} text-xs`} />
                      </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-color-text-darker font-medium mb-1">
                        {notification.message}
                      </p>
                      <p className="text-xs text-color-text">
                        {formatNotificationTime(notification.createdAt)}
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="flex-shrink-0 flex items-center gap-2">
                      {!notification.read && (
                        <span className="w-2 h-2 bg-color-button-blue rounded-full" />
                      )}
                      
                      <button
                        onClick={(e) => handleDeleteNotification(notification._id, e)}
                        className="opacity-0 group-hover:opacity-100 p-2 hover:bg-red-50 rounded-full transition-all"
                        aria-label="Delete notification"
                      >
                        <i className="fas fa-times text-red-600 text-sm" />
                      </button>
                    </div>
                  </motion.div>
                ))}

                {/* Loading more indicator */}
                {loadingMore && (
                  <div className="p-4 text-center">
                    <i className="fas fa-spinner fa-spin text-color-button-blue" />
                    <span className="ml-2 text-sm text-color-text">Loading more...</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
