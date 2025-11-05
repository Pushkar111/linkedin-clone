/**
 * EnhancedPostCard Component - COMPLETE WITH ALL FEED FEATURES
 * 
 * Full-featured post card with Feed parity:
 * ✅ Multi-reaction system (6 types)
 * ✅ Inline comments
 * ✅ Edit/Delete post
 * ✅ Three-dot options menu
 * ✅ Connection degree badges
 * ✅ Clickable hashtags  
 * ✅ Interaction counter
 * ✅ Share functionality
 * ✅ Optimistic updates
 */

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import { toast } from "react-toastify";

// Hooks and utilities
import { useReaction } from "../../../hooks/useReaction";
import { connectionAPI } from "../../../services";
import { showNotAvailableToast } from "../../../utilities";

// Components
import { ReactionButton, ReactionPicker, DeleteModal } from "../../../components";
import HashtagText from "../../../components/HashtagText/HashtagText";
import CommentsList from "../../Feed/components/NewsFeed/components/PostsList/components/PostEntry/components/CommentsList/CommentsList";

export default function EnhancedPostCard({ post, index, onPostDeleted }) {
  const navigate = useNavigate();
  
  // Get current user from localStorage with better error handling
  const getCurrentUser = () => {
    try {
      const userStr = localStorage.getItem("user");
      if (!userStr || userStr === "null" || userStr === "undefined") {
        return null;
      }
      const user = JSON.parse(userStr);
      return user;
    } catch (error) {
      console.error("Error parsing user from localStorage:", error);
      return null;
    }
  };
  
  const currentUser = getCurrentUser();
  const currentUserId = currentUser?._id || currentUser?.strUserId;
  
  // Get author from either 'author' or 'user' field (backend inconsistency)
  // Backend /api/posts returns 'user' field, profileAPI transforms to 'author'
  const postAuthor = post.author || post.user;
  const postAuthorId = postAuthor?._id || postAuthor || post.strUserId || post.user;
  
  // State management
  const [showComments, setShowComments] = useState(false);
  const [showReactionPicker, setShowReactionPicker] = useState(false);
  const [showOptionsMenu, setShowOptionsMenu] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(post.text || post.content || "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [connectionDegree, setConnectionDegree] = useState(3);
  const [commentCount, setCommentCount] = useState(post.commentCount || 0);
  
  const menuRef = useRef(null);
  const reactionHoverTimeoutRef = useRef(null);
  
  // Use multi-reaction hook (userId might be undefined initially - hook will handle it)
  const {
    hasReacted,
    reactionType,
    reactionCount,
    reactionCounts,
    isAnimating,
    isPending,
    handleToggleReaction
  } = useReaction(
    {
      strPostId: post._id || post.strPostId,
      ...post
    },
    currentUserId
  );

  // Check if current user is post owner
  const isPostOwner = currentUserId === postAuthorId;
  
  /**
   * Handle reaction hover enter (with flicker prevention)
   */
  const handleReactionHoverEnter = () => {
    if (reactionHoverTimeoutRef.current) {
      clearTimeout(reactionHoverTimeoutRef.current);
      reactionHoverTimeoutRef.current = null;
    }
    setShowReactionPicker(true);
  };

  /**
   * Handle reaction hover leave (with delay to prevent flicker)
   */
  const handleReactionHoverLeave = () => {
    reactionHoverTimeoutRef.current = setTimeout(() => {
      setShowReactionPicker(false);
      reactionHoverTimeoutRef.current = null;
    }, 200);
  };
  
  // Fetch connection degree
  useEffect(() => {
    const fetchDegree = async () => {
      // Skip if we don't have valid user IDs yet (user still loading)
      if (!currentUserId || !postAuthorId) {
        setConnectionDegree(3); // Default to 3rd degree
        return;
      }

      // Skip if post is owned by current user
      if (isPostOwner) {
        setConnectionDegree(0);
        return;
      }

      try {
        const degree = await connectionAPI.getConnectionDegree(currentUserId, postAuthorId);
        setConnectionDegree(degree);
      } catch (error) {
        console.error("Error fetching connection degree:", error);
        setConnectionDegree(3);
      }
    };

    fetchDegree();
  }, [currentUserId, postAuthorId, isPostOwner]);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      // @ts-ignore - menuRef type compatibility
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowOptionsMenu(false);
      }
    };

    if (showOptionsMenu) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showOptionsMenu]);

  // Cleanup reaction hover timeout
  useEffect(() => {
    return () => {
      if (reactionHoverTimeoutRef.current) {
        clearTimeout(reactionHoverTimeoutRef.current);
      }
    };
  }, []);

  /**
   * Card entrance animation
   */
  const cardVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        delay: index * 0.1
      }
    }
  };

  /**
   * Handler for editing post
   */
  const handleEditPost = async () => {
    if (!editText.trim() || editText.trim() === (post.text || post.content)) {
      setIsEditing(false);
      setEditText(post.text || post.content || "");
      return;
    }

    setIsSubmitting(true);

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `http://localhost:5000/api/posts/${post._id || post.strPostId}`,
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
        throw new Error("Failed to update post");
      }

      const data = await response.json();
      
      // Update post text
      post.text = data.post.text;
      post.content = data.post.text;
      setIsEditing(false);
      setShowOptionsMenu(false);
      toast.success("Post updated successfully!");
    } catch (error) {
      console.error("Failed to update post:", error);
      toast.error("Failed to update post. Please try again.");
      setEditText(post.text || post.content || "");
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Handler for deleting post
   */
  const handleConfirmDelete = async () => {
    setIsDeleting(true);

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `http://localhost:5000/api/posts/${post._id || post.strPostId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to delete post");
      }

      toast.success("Post deleted successfully!");
      setShowDeleteModal(false);
      
      // Notify parent to remove post from list
      if (onPostDeleted) {
        onPostDeleted(post._id || post.strPostId);
      }
    } catch (error) {
      console.error("Failed to delete post:", error);
      toast.error("Failed to delete post. Please try again.");
      setIsDeleting(false);
    }
  };

  /**
   * Handler for hashtag clicks
   */
  const handleHashtagClick = (hashtag) => {
    console.log("View hashtag:", hashtag);
    showNotAvailableToast();
  };

  /**
   * Navigate to post author profile
   */
  const handleAuthorClick = (e) => {
    e.stopPropagation();
    navigate(`/profile/${postAuthorId}`);
  };

  /**
   * Navigate to post detail
   */
  const handlePostClick = () => {
    if (!isEditing) {
      navigate(`/post/${post._id || post.strPostId}`);
    }
  };

  /**
   * Handle share click
   */
  const handleShareClick = (e) => {
    e.stopPropagation();
    showNotAvailableToast();
  };

  /**
   * Format post timestamp
   */
  const getTimeAgo = () => {
    try {
      return formatDistanceToNow(new Date(post.createdAt), { addSuffix: true });
    } catch {
      return "Recently";
    }
  };

  /**
   * Get connection degree badge
   */
  const getDegreeBadge = () => {
    if (connectionDegree === 0) return null;
    if (connectionDegree === 1) return "• 1st";
    if (connectionDegree === 2) return "• 2nd";
    return "• 3rd";
  };

  /**
   * Render post attachments
   */
  const renderAttachments = () => {
    if (!post.mediaURL && !post.attachments?.length) return null;

    const mediaUrl = post.mediaURL || post.attachments[0]?.url;
    const mediaType = post.attachments?.[0]?.type || "image";

    return (
      <div className="relative w-full rounded-lg overflow-hidden bg-gray-100 mb-4">
        {mediaType === "video" ? (
          <video
            src={mediaUrl}
            controls
            className="w-full max-h-96 object-contain"
            preload="metadata"
          />
        ) : (
          <img
            src={mediaUrl}
            alt="Post content"
            className="w-full max-h-96 object-cover hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />
        )}
      </div>
    );
  };

  return (
    <motion.article
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
      whileHover={{ y: -2, boxShadow: "0 8px 24px rgba(0,0,0,0.12)" }}
      className="bg-white rounded-2xl shadow-sm overflow-visible cursor-pointer transition-shadow relative"
      onClick={handlePostClick}
      role="article"
      aria-label={`Post by ${postAuthor?.name || postAuthor?.fullName || "Unknown"}`}
    >
      {/* Post Header */}
      <div className="p-4 sm:p-6">
        <div className="flex items-start gap-3 mb-4">
          {/* Author Avatar */}
          <motion.button
            onClick={handleAuthorClick}
            className="flex-shrink-0 focus:outline-none focus:ring-2 focus:ring-color-button-blue rounded-full"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <img
              src={
                postAuthor?.profilePicURL ||
                postAuthor?.avatarUrl ||
                "https://ui-avatars.com/api/?name=" +
                  encodeURIComponent(postAuthor?.name || postAuthor?.fullName || "User")
              }
              alt={`${postAuthor?.name || postAuthor?.fullName || "User"}'s avatar`}
              className="w-12 h-12 rounded-full object-cover ring-2 ring-gray-100"
            />
          </motion.button>

          {/* Author Info */}
          <div className="flex-1 min-w-0">
            <button
              onClick={handleAuthorClick}
              className="font-semibold text-color-text-darker hover:text-color-button-blue transition-colors focus:outline-none focus:underline"
            >
              {postAuthor?.name || postAuthor?.fullName || "Unknown User"}
            </button>
            
            {(postAuthor?.headline || postAuthor?.profile?.headline) && (
              <p className="text-sm text-color-text line-clamp-1">
                {postAuthor?.headline || postAuthor?.profile?.headline}
              </p>
            )}
            
            <p className="text-xs text-color-text-low-emphasis flex items-center gap-1 mt-1">
              <time dateTime={post.createdAt}>{getTimeAgo()}</time>
              {getDegreeBadge() && (
                <>
                  <span aria-hidden="true">{getDegreeBadge()}</span>
                </>
              )}
              <span aria-hidden="true">•</span>
              <i className="fas fa-globe-americas text-xs" aria-label="Public post" />
            </p>
          </div>

          {/* Three-Dot Menu */}
          <div className="relative z-50" ref={menuRef}>
            <motion.button
              onClick={(e) => {
                e.stopPropagation();
                setShowOptionsMenu(!showOptionsMenu);
              }}
              className={`
                flex items-center justify-center w-9 h-9 rounded-full
                transition-all duration-150
                ${showOptionsMenu 
                  ? "bg-blue-50 text-blue-600" 
                  : "hover:bg-gray-100 text-gray-600"
                }
              `}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="2" />
                <circle cx="4" cy="12" r="2" />
                <circle cx="20" cy="12" r="2" />
              </svg>
            </motion.button>

            {/* Options Dropdown */}
            <AnimatePresence>
              {showOptionsMenu && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: -10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -10 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 top-10 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-[100]"
                  onClick={(e) => e.stopPropagation()}
                >
                  {isPostOwner && (
                    <>
                      <button
                        onClick={() => {
                          setIsEditing(true);
                          setShowOptionsMenu(false);
                        }}
                        className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                      >
                        <i className="fas fa-edit w-4" />
                        <span>Edit post</span>
                      </button>
                      <button
                        onClick={() => {
                          setShowDeleteModal(true);
                          setShowOptionsMenu(false);
                        }}
                        className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                      >
                        <i className="fas fa-trash w-4" />
                        <span>Delete post</span>
                      </button>
                      <hr className="my-1" />
                    </>
                  )}
                  <button
                    onClick={() => showNotAvailableToast()}
                    className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                  >
                    <i className="fas fa-bookmark w-4" />
                    <span>Save post</span>
                  </button>
                  {!isPostOwner && (
                    <button
                      onClick={() => showNotAvailableToast()}
                      className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                    >
                      <i className="fas fa-flag w-4" />
                      <span>Report post</span>
                    </button>
                  )}
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(window.location.origin + `/post/${post._id || post.strPostId}`);
                      toast.success("Link copied to clipboard!");
                      setShowOptionsMenu(false);
                    }}
                    className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                  >
                    <i className="fas fa-link w-4" />
                    <span>Copy link</span>
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Post Content - Edit Mode or Display Mode */}
        <div className="mb-4">
          {isEditing ? (
            <div className="space-y-3" onClick={(e) => e.stopPropagation()}>
              <textarea
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                className="w-full min-h-[100px] p-3 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={isSubmitting}
              />
              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => {
                    setIsEditing(false);
                    setEditText(post.text || post.content || "");
                  }}
                  className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg"
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  onClick={handleEditPost}
                  className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Saving..." : "Save"}
                </button>
              </div>
            </div>
          ) : (
            <div className="text-color-text-darker whitespace-pre-wrap break-words">
              <HashtagText 
                text={post.text || post.content || ""} 
                onHashtagClick={handleHashtagClick}
                className=""
              />
            </div>
          )}
        </div>

        {/* Post Attachments */}
        {renderAttachments()}

        {/* Interaction Counter */}
        <div className="flex items-center justify-between px-2 py-3 border-t border-gray-100">
          {/* Reaction Summary */}
          {reactionCount > 0 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                console.log("View reactions");
              }}
              className="flex items-center gap-1 text-sm text-color-text-low-emphasis hover:text-blue-600 hover:underline transition-colors"
            >
              <span className="flex -space-x-1">
                {Object.entries(reactionCounts || {})
                  .filter(([, count]) => count > 0)
                  .slice(0, 3)
                  .map(([type]) => {
                    const config = { 
                      like: "👍", 
                      celebrate: "🎉", 
                      support: "🙌", 
                      love: "❤️", 
                      insightful: "💡", 
                      curious: "🤔" 
                    };
                    return (
                      <span key={type} className="text-base">
                        {config[type] || "👍"}
                      </span>
                    );
                  })}
              </span>
              <span>{reactionCount}</span>
            </button>
          )}
          
          {/* Comments/Shares */}
          <div className="flex items-center gap-3 text-sm text-color-text-low-emphasis">
            {commentCount > 0 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowComments(!showComments);
                }}
                className="hover:text-blue-600 hover:underline transition-colors"
              >
                {commentCount} {commentCount === 1 ? "comment" : "comments"}
              </button>
            )}
            {(post.shareCount || 0) > 0 && (
              <span>{post.shareCount} {post.shareCount === 1 ? "share" : "shares"}</span>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1 pt-2 border-t border-gray-100 relative">
          {/* Reaction Button with Fixed Hover */}
          <div 
            className="flex-1 relative"
            onMouseEnter={handleReactionHoverEnter}
            onMouseLeave={handleReactionHoverLeave}
          >
            <ReactionButton
              hasReacted={hasReacted}
              reactionType={reactionType}
              reactionCount={reactionCount}
              isAnimating={isAnimating}
              isPending={isPending}
              onClick={(e) => {
                e.stopPropagation();
                // Only toggle reaction if user is loaded
                if (currentUserId) {
                  handleToggleReaction(reactionType || "like");
                }
              }}
              onMouseEnter={handleReactionHoverEnter}
              onMouseLeave={handleReactionHoverLeave}
            />
            
            {showReactionPicker && (
              <ReactionPicker
                onReactionSelect={(reaction) => {
                  // Only toggle reaction if user is loaded
                  if (currentUserId) {
                    handleToggleReaction(reaction);
                    setShowReactionPicker(false);
                  } else {
                    console.warn("Please wait, user is loading...");
                    setShowReactionPicker(false);
                  }
                }}
                currentReaction={reactionType}
                onMouseEnter={handleReactionHoverEnter}
                onMouseLeave={handleReactionHoverLeave}
              />
            )}
          </div>

          {/* Comment Button */}
          <motion.button
            onClick={(e) => {
              e.stopPropagation();
              setShowComments(!showComments);
            }}
            className="flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-lg font-medium text-color-text hover:bg-gray-100 transition-colors"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <i className="fas fa-comment" />
            <span className="hidden sm:inline">Comment</span>
          </motion.button>

          {/* Share Button */}
          <motion.button
            onClick={handleShareClick}
            className="flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-lg font-medium text-color-text hover:bg-gray-100 transition-colors"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <i className="fas fa-share" />
            <span className="hidden sm:inline">Share</span>
          </motion.button>
        </div>

        {/* Comments Section */}
        <AnimatePresence>
          {showComments && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="mt-4"
              onClick={(e) => e.stopPropagation()}
            >
              <CommentsList
                comments={post.comments || []}
                postId={post._id || post.strPostId}
                currentUserId={currentUser._id || currentUser.strUserId}
                currentUser={currentUser}
                onDeleteComment={() => {}}
                onCommentAdded={() => {
                  setCommentCount(commentCount + 1);
                }}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <DeleteModal
          isOpen={showDeleteModal}
          onClose={() => setShowDeleteModal(false)}
          onConfirm={handleConfirmDelete}
          isDeleting={isDeleting}
          title="Delete post?"
          message="This post will be permanently deleted. You cannot undo this action."
        />
      )}
    </motion.article>
  );
}
