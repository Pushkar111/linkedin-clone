/**
 * ============================================================================
 * CONNECTION BUTTON - LinkedIn-Style Dynamic State Management
 * ============================================================================
 * 
 * Smart button component that handles all connection states:
 * - 3rd degree → "Connect" button
 * - Pending (sent) → "Pending" button (disabled)
 * - Pending (received) → "Accept" / "Ignore" buttons
 * - 1st degree (connected) → "Message" + dropdown with "Remove Connection"
 * - 2nd degree → "Connect" button with mutual count
 * 
 * Features:
 * - Optimistic UI updates
 * - Automatic rollback on error
 * - Loading states
 * - Dropdown menu for connected state
 * - Toast notifications
 * 
 * @version 2.0.0
 */

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import {
  getConnectionStatus,
  sendConnectionRequest,
  acceptConnectionRequest,
  ignoreConnectionRequest,
  withdrawConnectionRequest,
  removeConnection
} from "../../services/connectionAPI";
import { NavigationPaths } from "../../utilities/Enums";

/**
 * Connection Button Component
 * 
 * @param {Object} props
 * @param {string} props.targetUserId - User ID to connect with
 * @param {boolean} props.isOwner - Is this the current user"s profile?
 * @param {string} props.size - Button size: "sm" | "md" | "lg"
 * @param {boolean} props.showMutualCount - Show mutual connections count
 * @param {Function} props.onStatusChange - Callback when status changes
 * @param {string} props.className - Additional CSS classes
 */
export default function ConnectionButton({
  targetUserId,
  isOwner = false,
  size = "md",
  showMutualCount = false,
  onStatusChange,
  className = ""
}) {
  const navigate = useNavigate();
  const [status, setStatus] = useState("NOT_CONNECTED");
  const [degree, setDegree] = useState(3);
  const [mutualConnections, setMutualConnections] = useState(0);
  const [connectionId, setConnectionId] = useState(null);
  const [requestId, setRequestId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);

  // Fetch connection status on mount
  useEffect(() => {
    if (!targetUserId || isOwner) {
      setInitialLoading(false);
      return;
    }

    const fetchStatus = async () => {
      try {
        const data = await getConnectionStatus(targetUserId);
        setStatus(data.status);
        setDegree(data.degree);
        setMutualConnections(data.mutualConnections);
        setConnectionId(data.connectionId);
        setRequestId(data.requestId);
      } catch (error) {
        console.error("Failed to fetch connection status:", error);
      } finally {
        setInitialLoading(false);
      }
    };

    fetchStatus();
  }, [targetUserId, isOwner]);

  // Notify parent of status changes
  useEffect(() => {
    if (onStatusChange && !initialLoading) {
      onStatusChange({ status, degree, mutualConnections, connectionId });
    }
  }, [status, degree, mutualConnections, connectionId, onStatusChange, initialLoading]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };

    if (showDropdown) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [showDropdown]);

  /**
   * Handle connect button click
   * Sends connection request with optimistic update
   */
  const handleConnect = async () => {
    if (loading) return;

    // Store original state for rollback
    const originalStatus = status;
    const originalRequestId = requestId;

    try {
      // Optimistic update
      setStatus("PENDING_SENT");
      setLoading(true);

      // API call
      const result = await sendConnectionRequest(targetUserId);
      setRequestId(result.requestId);
      
      toast.success("Connection request sent!");
    } catch (error) {
      // Rollback on error
      setStatus(originalStatus);
      setRequestId(originalRequestId);
      toast.error(error.message || "Failed to send request");
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle accept button click (for received requests)
   */
  const handleAccept = async () => {
    if (loading || !requestId) return;

    const originalStatus = status;
    const originalConnectionId = connectionId;

    try {
      // Optimistic update
      setStatus("CONNECTED");
      setDegree(1);
      setLoading(true);

      // API call
      const result = await acceptConnectionRequest(requestId);
      setConnectionId(result.connectionId);
      setRequestId(null);
      
      toast.success("You are now connected!");
      
      // Trigger parent refresh if callback provided
      if (onStatusChange) {
        onStatusChange({ status: "CONNECTED", degree: 1, mutualConnections, connectionId: result.connectionId });
      }
    } catch (error) {
      // Rollback on error
      setStatus(originalStatus);
      setConnectionId(originalConnectionId);
      toast.error(error.message || "Failed to accept request");
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle ignore button click (for received requests)
   */
  const handleIgnore = async () => {
    if (loading || !requestId) return;

    const originalStatus = status;
    const originalRequestId = requestId;

    try {
      // Optimistic update
      setStatus("NOT_CONNECTED");
      setRequestId(null);
      setLoading(true);

      // API call
      await ignoreConnectionRequest(requestId);
      
      toast.info("Request ignored");
    } catch (error) {
      // Rollback on error
      setStatus(originalStatus);
      setRequestId(originalRequestId);
      toast.error(error.message || "Failed to ignore request");
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle withdraw pending request
   */
  const handleWithdraw = async () => {
    if (loading || !requestId) return;

    const originalStatus = status;
    const originalRequestId = requestId;

    try {
      // Optimistic update
      setStatus("NOT_CONNECTED");
      setRequestId(null);
      setLoading(true);

      // API call
      await withdrawConnectionRequest(requestId);
      
      toast.info("Request withdrawn");
    } catch (error) {
      // Rollback on error
      setStatus(originalStatus);
      setRequestId(originalRequestId);
      toast.error(error.message || "Failed to withdraw request");
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle remove connection
   */
  const handleRemove = async () => {
    if (loading || !connectionId) return;

    const confirmed = window.confirm(
      "Are you sure you want to remove this connection?"
    );

    if (!confirmed) return;

    const originalStatus = status;
    const originalConnectionId = connectionId;

    try {
      // Optimistic update
      setStatus("NOT_CONNECTED");
      setDegree(3);
      setConnectionId(null);
      setLoading(true);
      setShowDropdown(false);

      // API call
      await removeConnection(connectionId);
      
      toast.info("Connection removed");
    } catch (error) {
      // Rollback on error
      setStatus(originalStatus);
      setConnectionId(originalConnectionId);
      toast.error(error.message || "Failed to remove connection");
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle message button click
   * Navigate to messaging page with targetUserId
   */
  const handleMessage = () => {
    navigate(`/${NavigationPaths.MESSAGING}/${targetUserId}`);
  };

  // Size classes
  const sizeClasses = {
    sm: "px-3 py-1.5 text-xs",
    md: "px-4 py-2 text-sm",
    lg: "px-6 py-3 text-base"
  };

  const buttonSize = sizeClasses[size] || sizeClasses.md;

  // Don"t show button on own profile
  if (isOwner) return null;

  // Loading skeleton
  if (initialLoading) {
    return (
      <div className={`${buttonSize} bg-gray-200 rounded-full animate-pulse ${className}`}>
        &nbsp;
      </div>
    );
  }

  // NOT_CONNECTED (3rd degree) - Show "Connect" button
  if (status === "NOT_CONNECTED") {
    return (
      <motion.button
        onClick={handleConnect}
        disabled={loading}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className={`
          ${buttonSize}
          bg-color-button-blue text-white font-semibold rounded-full
          hover:bg-color-button-blue-darker
          disabled:bg-gray-400 disabled:cursor-not-allowed
          transition-colors duration-200
          ${className}
        `}
      >
        {loading ? (
          <>
            <i className="fas fa-spinner fa-spin mr-2" />
            Connecting...
          </>
        ) : (
          <>
            <i className="fas fa-user-plus mr-2" />
            Connect
            {showMutualCount && mutualConnections > 0 && (
              <span className="ml-2 text-xs opacity-90">
                ({mutualConnections} mutual)
              </span>
            )}
          </>
        )}
      </motion.button>
    );
  }

  // PENDING_SENT - Show "Pending" button with withdraw option
  if (status === "PENDING_SENT") {
    return (
      <motion.button
        onClick={handleWithdraw}
        disabled={loading}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className={`
          ${buttonSize}
          bg-gray-200 text-color-text-darker font-semibold rounded-full
          hover:bg-gray-300
          disabled:bg-gray-200 disabled:cursor-not-allowed
          transition-colors duration-200
          ${className}
        `}
        title="Click to withdraw request"
      >
        {loading ? (
          <>
            <i className="fas fa-spinner fa-spin mr-2" />
            Withdrawing...
          </>
        ) : (
          <>
            <i className="fas fa-clock mr-2" />
            Pending
          </>
        )}
      </motion.button>
    );
  }

  // PENDING_RECEIVED - Show "Accept" and "Ignore" buttons
  if (status === "PENDING_RECEIVED") {
    return (
      <div className={`flex gap-2 ${className}`}>
        <motion.button
          onClick={handleAccept}
          disabled={loading}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className={`
            ${buttonSize}
            bg-color-button-blue text-white font-semibold rounded-full
            hover:bg-color-button-blue-darker
            disabled:bg-gray-400 disabled:cursor-not-allowed
            transition-colors duration-200
          `}
        >
          {loading ? (
            <>
              <i className="fas fa-spinner fa-spin mr-2" />
              Accepting...
            </>
          ) : (
            <>
              <i className="fas fa-check mr-2" />
              Accept
            </>
          )}
        </motion.button>

        <motion.button
          onClick={handleIgnore}
          disabled={loading}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className={`
            ${buttonSize}
            bg-gray-200 text-color-text-darker font-semibold rounded-full
            hover:bg-gray-300
            disabled:bg-gray-200 disabled:cursor-not-allowed
            transition-colors duration-200
          `}
        >
          <i className="fas fa-times mr-2" />
          Ignore
        </motion.button>
      </div>
    );
  }

  // CONNECTED (1st degree) - Show "Message" button with dropdown
  if (status === "CONNECTED") {
    return (
      <div className={`relative inline-block ${className}`} ref={dropdownRef}>
        <div className="flex gap-2">
          <motion.button
            onClick={handleMessage}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={`
              ${buttonSize}
              bg-color-button-blue text-white font-semibold rounded-full
              hover:bg-color-button-blue-darker
              transition-colors duration-200
            `}
          >
            <i className="fas fa-comment-alt mr-2" />
            Message
          </motion.button>

          <motion.button
            onClick={() => setShowDropdown(!showDropdown)}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={`
              ${buttonSize}
              bg-gray-200 text-color-text-darker font-semibold rounded-full
              hover:bg-gray-300
              transition-colors duration-200
            `}
            aria-label="More options"
            aria-expanded={showDropdown}
            aria-haspopup="true"
          >
            <i className="fas fa-ellipsis-h" />
          </motion.button>
        </div>

        {/* Dropdown Menu */}
        <AnimatePresence>
          {showDropdown && (
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="
                absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg
                border border-gray-200 overflow-hidden z-50
              "
            >
              <button
                onClick={handleRemove}
                disabled={loading}
                className="
                  w-full px-4 py-3 text-left text-sm text-red-600
                  hover:bg-red-50 transition-colors
                  disabled:opacity-50 disabled:cursor-not-allowed
                  flex items-center gap-3
                "
              >
                <i className="fas fa-user-times text-red-600" />
                <span>Remove Connection</span>
              </button>

              <button
                onClick={() => {
                  navigate(`/profile/${targetUserId}?tab=about`);
                  setShowDropdown(false);
                }}
                className="
                  w-full px-4 py-3 text-left text-sm text-color-text-darker
                  hover:bg-gray-50 transition-colors
                  flex items-center gap-3 border-t border-gray-100
                "
              >
                <i className="fas fa-user text-color-text" />
                <span>View Profile</span>
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  // Fallback (should never reach here)
  return null;
}

/**
 * Usage Examples:
 * 
 * // Basic usage
 * <ConnectionButton targetUserId="user123" />
 * 
 * // With mutual count
 * <ConnectionButton 
 *   targetUserId="user123" 
 *   showMutualCount={true}
 * />
 * 
 * // With status change callback
 * <ConnectionButton 
 *   targetUserId="user123" 
 *   onStatusChange={(status) => console.log("Status:", status)}
 * />
 * 
 * // Large size
 * <ConnectionButton 
 *   targetUserId="user123" 
 *   size="lg"
 * />
 * 
 * // On own profile (won"t render)
 * <ConnectionButton 
 *   targetUserId="currentUserId" 
 *   isOwner={true}
 * />
 */
