/**
 * CommentItem Component
 * Displays a single comment with reactions
 */
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import formatDistanceToNow from "date-fns/formatDistanceToNow";
import { ReactionButton, ReactionPicker } from "../../../../../../../../../../../../components";
import useCommentReaction from "../../../../../../../../../../../../hooks/useCommentReaction";
import { formatReactionCounts } from "../../../../../../../../../../../../constants/reactions";
import { connectionAPI } from "../../../../../../../../../../../../services";
import "./CommentItem.css";

/**
 * @param {Object} props
 * @param {Object} props.comment - Comment object
 * @param {string} props.postId - Post ID
 * @param {string} props.currentUserId - Current logged in user ID
 * @param {Function} props.onDelete - Delete comment handler
 * @param {Function} props.onEdit - Edit comment handler
 */
export default function CommentItem({ comment, postId, currentUserId, onDelete, onEdit }) {
  const navigate = useNavigate();
  const [showReactionPicker, setShowReactionPicker] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(comment.text);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [connectionDegree, setConnectionDegree] = useState(3);

  // Use comment reaction hook
  const {
    hasReacted,
    reactionType,
    reactionCount,
    reactionCounts,
    isAnimating,
    isPending,
    handleToggleReaction,
  } = useCommentReaction(
    postId,
    comment._id,
    {
      userReaction: comment.userReaction || null,
      totalReactions: comment.reactionCount || 0,
      reactionCounts: comment.reactionCounts || {},
    },
    currentUserId
  );

  const user = comment.user || {};
  const isOwner = currentUserId === (typeof comment.user === "string" ? comment.user : comment.user?._id);

  // Fetch connection degree
  useEffect(() => {
    const fetchDegree = async () => {
      const commentUserId = typeof comment.user === "string" ? comment.user : comment.user?._id;
      
      // Skip if viewing own comment
      if (currentUserId === commentUserId) {
        setConnectionDegree(0);
        return;
      }

      try {
        const degree = await connectionAPI.getConnectionDegree(currentUserId, commentUserId);
        setConnectionDegree(degree);
      } catch (error) {
        console.error("Error fetching connection degree:", error);
        setConnectionDegree(3);
      }
    };

    fetchDegree();
  }, [currentUserId, comment.user]);

  let timeoutId = null;

  const handleMouseEnter = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    setShowReactionPicker(true);
  };

  const handleMouseLeave = () => {
    timeoutId = setTimeout(() => {
      setShowReactionPicker(false);
      timeoutId = null;
    }, 300);
  };

  const handleEditSubmit = async () => {
    if (!editText.trim() || editText.trim() === comment.text) {
      setIsEditing(false);
      setEditText(comment.text);
      return;
    }

    setIsSubmitting(true);

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `http://localhost:5000/api/posts/${postId}/comments/${comment._id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ text: editText.trim() }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to update comment");
      }

      const data = await response.json();
      
      // Call onEdit callback if provided
      if (onEdit) {
        onEdit(data.comment);
      }

      setIsEditing(false);
      console.log("✅ Comment updated:", data.comment);
    } catch (error) {
      console.error("❌ Failed to update comment:", error);
      alert("Failed to update comment. Please try again.");
      setEditText(comment.text);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditCancel = () => {
    setIsEditing(false);
    setEditText(comment.text);
  };

  const handleEditKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleEditSubmit();
    } else if (e.key === "Escape") {
      handleEditCancel();
    }
  };

  const handleProfileClick = () => {
    const userId = typeof comment.user === "string" ? comment.user : comment.user?._id;
    if (userId) {
      navigate(`/profile/${userId}`);
    }
  };

  return (
    <div className="comment-item">
      <div 
        className="comment-avatar"
        onClick={handleProfileClick}
        style={{ cursor: "pointer" }}
      >
        <img
          src={user.profilePicURL || "/default-avatar.png"}
          alt={user.fullName || "User"}
          className="comment-avatar-img"
          style={{ transition: "opacity 0.2s" }}
          onMouseEnter={(e) => e.currentTarget.style.opacity = "0.8"}
          onMouseLeave={(e) => e.currentTarget.style.opacity = "1"}
        />
      </div>

      <div className="comment-content">
        <div className="comment-bubble">
          <div className="comment-header">
            <span 
              className="comment-author"
              onClick={handleProfileClick}
              style={{ cursor: "pointer" }}
            >
              {user.fullName || "Anonymous"}
              {!isOwner && (
                <span style={{ color: "#666", fontWeight: "normal", marginLeft: "4px" }}>
                  • {connectionDegree === 1 ? "1st" : connectionDegree === 2 ? "2nd" : "3rd"}
                </span>
              )}
            </span>
            {user.profile?.headline && (
              <span className="comment-headline">{user.profile.headline}</span>
            )}
          </div>

          {isEditing ? (
            <div className="comment-edit-container">
              <textarea
                className="comment-edit-input"
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                onKeyDown={handleEditKeyPress}
                disabled={isSubmitting}
                autoFocus
              />
              <div className="comment-edit-actions">
                <button
                  className="comment-edit-save"
                  onClick={handleEditSubmit}
                  disabled={isSubmitting || !editText.trim()}
                >
                  {isSubmitting ? "Saving..." : "Save"}
                </button>
                <button
                  className="comment-edit-cancel"
                  onClick={handleEditCancel}
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <p className="comment-text">{comment.text}</p>
          )}

          {/* Reaction counts display */}
          {reactionCount > 0 && !isEditing && (
            <div className="comment-reactions-display">
              {formatReactionCounts(reactionCounts).map((reaction, idx) => (
                <span key={idx} className="comment-reaction-emoji" title={`${reaction.count} ${reaction.label}`}>
                  {reaction.emoji} {reaction.count}
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="comment-actions">
          <span className="comment-time">
            {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
          </span>

          {/* Reaction Button with Picker - only show when not editing */}
          {!isEditing && (
            <div
              className="comment-reaction-container"
              onMouseEnter={handleMouseEnter}
              onMouseLeave={handleMouseLeave}
            >
              <ReactionButton
                hasReacted={hasReacted}
                reactionType={reactionType || "like"}
                reactionCount={reactionCount}
                isAnimating={isAnimating}
                isPending={isPending}
                onClick={() => handleToggleReaction(reactionType || "like")}
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
              />

              {showReactionPicker && (
                <div className="comment-reaction-picker-wrapper">
                  <ReactionPicker
                    onReactionSelect={(type) => {
                      handleToggleReaction(type);
                      setShowReactionPicker(false);
                    }}
                    currentReaction={reactionType || ""}
                    onMouseEnter={handleMouseEnter}
                    onMouseLeave={handleMouseLeave}
                  />
                </div>
              )}
            </div>
          )}

          {isOwner && !isEditing && (
            <>
              <button
                className="comment-edit-btn"
                onClick={() => setIsEditing(true)}
                aria-label="Edit comment"
              >
                Edit
              </button>
              <button
                className="comment-delete-btn"
                onClick={() => onDelete(comment._id)}
                aria-label="Delete comment"
              >
                Delete
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
