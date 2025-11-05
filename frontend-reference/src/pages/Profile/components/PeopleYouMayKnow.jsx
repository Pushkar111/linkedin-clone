/**
 * ============================================================================
 * PEOPLE YOU MAY KNOW - LinkedIn-Style Connection Suggestions
 * ============================================================================
 * 
 * Smart recommendation component with:
 * - 2nd & 3rd degree connections
 * - Mutual connections count
 * - Dynamic connection button
 * - Realtime status updates
 * - Reason for suggestion
 * 
 * @version 2.0.0
 */

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { getSuggestedConnections } from "../../../services/connectionAPI";
import ConnectionButton from "../../../components/ConnectionButton/ConnectionButton";

/**
 * People You May Know Component
 * 
 * @param {Object} props
 * @param {number} props.limit - Number of suggestions to show
 * @param {boolean} props.showRefresh - Show refresh button
 * @param {string} props.className - Additional CSS classes
 */
export default function PeopleYouMayKnow({ 
  limit = 5, 
  showRefresh = true,
  className = ""
}) {
  const navigate = useNavigate();
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  /**
   * Fetch suggestions
   */
  const fetchSuggestions = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const data = await getSuggestedConnections(limit);
      setSuggestions(data);
    } catch (error) {
      console.error("Failed to fetch suggestions:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchSuggestions();
  }, [limit]);

  /**
   * Handle suggestion status change (after connecting)
   * Automatically refetch suggestions
   */
  const handleStatusChange = ({ status }) => {
    if (status === "CONNECTED" || status === "PENDING_SENT") {
      // Refetch suggestions after a short delay
      setTimeout(() => {
        fetchSuggestions(true);
      }, 1000);
    }
  };

  /**
   * Handle refresh click
   */
  const handleRefresh = () => {
    fetchSuggestions(true);
  };

  /**
   * Get degree badge color
   */
  const getDegreeColor = (degree) => {
    switch (degree) {
      case 1:
        return "bg-blue-100 text-blue-700";
      case 2:
        return "bg-green-100 text-green-700";
      case 3:
        return "bg-gray-100 text-gray-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  /**
   * Get degree label
   */
  const getDegreeLabel = (degree) => {
    switch (degree) {
      case 1:
        return "1st";
      case 2:
        return "2nd";
      case 3:
        return "3rd";
      default:
        return "3rd";
    }
  };

  // Loading state
  if (loading && !refreshing) {
    return (
      <div className={`bg-white rounded-2xl shadow-sm border border-gray-200 p-4 ${className}`}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-color-text-darker">
            People you may know
          </h3>
        </div>
        
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-3 animate-pulse">
              <div className="w-12 h-12 bg-gray-200 rounded-full" />
              <div className="flex-1">
                <div className="h-4 bg-gray-200 rounded w-2/3 mb-2" />
                <div className="h-3 bg-gray-200 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Empty state
  if (!suggestions || suggestions.length === 0) {
    return (
      <div className={`bg-white rounded-2xl shadow-sm border border-gray-200 p-6 text-center ${className}`}>
        <div className="text-gray-400 text-4xl mb-3">
          <i className="fas fa-users" />
        </div>
        <h3 className="text-lg font-semibold text-color-text-darker mb-2">
          No suggestions available
        </h3>
        <p className="text-sm text-color-text">
          Check back later for personalized connection recommendations
        </p>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-100 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-color-text-darker">
          People you may know
        </h3>
        
        {showRefresh && (
          <motion.button
            onClick={handleRefresh}
            disabled={refreshing}
            whileHover={{ scale: 1.1, rotate: 180 }}
            whileTap={{ scale: 0.9 }}
            transition={{ duration: 0.3 }}
            className="text-color-button-blue hover:text-color-button-blue-darker disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Refresh suggestions"
          >
            <i className={`fas fa-sync-alt ${refreshing ? "fa-spin" : ""}`} />
          </motion.button>
        )}
      </div>

      {/* Suggestions List */}
      <div className="divide-y divide-gray-100">
        <AnimatePresence mode="popLayout">
          {suggestions.map((user, index) => (
            <motion.div
              key={user._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -100 }}
              transition={{ 
                duration: 0.3, 
                delay: index * 0.05,
                layout: { duration: 0.3 }
              }}
              layout
              className="p-4 hover:bg-gray-50 transition-colors"
            >
              {/* User Info Row */}
              <div className="flex items-start gap-3 mb-3">
                {/* Avatar */}
                <motion.div
                  onClick={() => navigate(`/profile/${user._id}`)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="flex-shrink-0 cursor-pointer relative"
                >
                  <img
                    src={user.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=0A66C2&color=fff&size=128`}
                    alt={user.name}
                    className="w-14 h-14 rounded-full object-cover border-2 border-gray-100"
                  />
                  
                  {/* Degree Badge */}
                  <span className={`
                    absolute -bottom-1 -right-1 text-[10px] font-bold px-1.5 py-0.5 rounded-full
                    ${getDegreeColor(user.degree)}
                  `}>
                    {getDegreeLabel(user.degree)}
                  </span>
                </motion.div>

                {/* User Details */}
                <div className="flex-1 min-w-0">
                  <motion.h4
                    onClick={() => navigate(`/profile/${user._id}`)}
                    whileHover={{ x: 2 }}
                    className="font-semibold text-sm text-color-text-darker hover:text-color-button-blue cursor-pointer truncate"
                  >
                    {user.name}
                  </motion.h4>
                  
                  <p className="text-xs text-color-text line-clamp-2 mb-2">
                    {user.headline || "LinkedIn Member"}
                  </p>

                  {/* Mutual Connections */}
                  {user.mutualConnections > 0 && (
                    <div className="flex items-center gap-1 text-xs text-color-text-low-emphasis">
                      <i className="fas fa-user-friends text-[10px]" />
                      <span>{user.mutualConnections} mutual connection{user.mutualConnections !== 1 ? 's' : ''}</span>
                    </div>
                  )}

                  {/* Reason for suggestion (if available) */}
                  {user.reason && !user.mutualConnections && (
                    <div className="flex items-center gap-1 text-xs text-color-text-low-emphasis">
                      <i className="fas fa-lightbulb text-[10px]" />
                      <span>{user.reason}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Connection Button */}
              <ConnectionButton
                targetUserId={user._id}
                size="sm"
                showMutualCount={false}
                onStatusChange={handleStatusChange}
                className="w-full"
              />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* View All Link */}
      <motion.button
        onClick={() => navigate("/mynetwork/grow")}
        whileHover={{ backgroundColor: "#f9fafb" }}
        className="w-full py-3 text-center text-sm font-semibold text-color-button-blue hover:underline border-t border-gray-100"
      >
        Show all recommendations
        <i className="fas fa-arrow-right ml-2 text-xs" />
      </motion.button>
    </div>
  );
}

/**
 * Usage Examples:
 * 
 * // Basic usage
 * <PeopleYouMayKnow />
 * 
 * // With custom limit
 * <PeopleYouMayKnow limit={10} />
 * 
 * // Without refresh button
 * <PeopleYouMayKnow showRefresh={false} />
 * 
 * // With custom styling
 * <PeopleYouMayKnow className="lg:sticky lg:top-20" />
 */
