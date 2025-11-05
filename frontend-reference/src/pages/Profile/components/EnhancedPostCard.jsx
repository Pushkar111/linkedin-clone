/**
 * EnhancedPostCard Component
 * 
 * Production-ready post card with:
 * - Optimistic like/reaction updates
 * - Image/video attachments
 * - Comment count display
 * - Framer Motion animations
 * - Accessibility features
 * - Click to navigate to post detail
 */

import React from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import useLikePost from "../../../hooks/useLikePost";

export default function EnhancedPostCard({ post, index }) {
  const navigate = useNavigate();
  const currentUser = JSON.parse(localStorage.getItem("user") || "{}");
  
  // Use optimistic like hook
  const { isLiked, likeCount, isAnimating, handleToggleLike } = useLikePost(
    post,
    currentUser._id
  );

  /**
   * Card entrance animation with stagger
   */
  const cardVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        delay: index * 0.1,
        ease: [0.22, 1, 0.36, 1] // Custom easing
      }
    }
  };

  /**
   * Navigate to post author profile
   */
  const handleAuthorClick = (e) => {
    e.stopPropagation();
    navigate(`/profile/${post.author._id || post.author}`);
  };

  /**
   * Navigate to post detail
   */
  const handlePostClick = () => {
    navigate(`/post/${post._id}`);
  };

  /**
   * Handle comment click
   */
  const handleCommentClick = (e) => {
    e.stopPropagation();
    navigate(`/post/${post._id}#comments`);
  };

  /**
   * Handle share click
   */
  const handleShareClick = (e) => {
    e.stopPropagation();
    console.log("Share post:", post._id);
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
   * Render post attachments (images/videos)
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
      whileHover={{ y: -2, boxShadow: "0 8px 24px rgba(0,0,0,0.12)" }}
      className="bg-white rounded-2xl shadow-sm overflow-hidden cursor-pointer transition-shadow"
      onClick={handlePostClick}
      role="article"
      aria-label={`Post by ${post.author?.name || "Unknown"}`}
    >
      {/* Post Header - Author Info */}
      <div className="p-4 sm:p-6">
        <div className="flex items-start gap-3 mb-4">
          {/* Author Avatar */}
          <motion.button
            onClick={handleAuthorClick}
            className="flex-shrink-0 focus:outline-none focus:ring-2 focus:ring-color-button-blue rounded-full"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            aria-label={`View ${post.author?.name || "author"}'s profile`}
          >
            <img
              src={
                post.author?.profilePicURL ||
                post.author?.avatarUrl ||
                "https://ui-avatars.com/api/?name=" +
                  encodeURIComponent(post.author?.name || post.author?.fullName || "User")
              }
              alt={`${post.author?.name || "User"}'s avatar`}
              className="w-12 h-12 rounded-full object-cover ring-2 ring-gray-100"
            />
          </motion.button>

          {/* Author Name & Timestamp */}
          <div className="flex-1 min-w-0">
            <button
              onClick={handleAuthorClick}
              className="font-semibold text-color-text-darker hover:text-color-button-blue transition-colors focus:outline-none focus:underline"
            >
              {post.author?.name || post.author?.fullName || "Unknown User"}
            </button>
            
            {post.author?.headline && (
              <p className="text-sm text-color-text line-clamp-1">
                {post.author.headline}
              </p>
            )}
            
            <p className="text-xs text-color-text-low-emphasis flex items-center gap-1 mt-1">
              <time dateTime={post.createdAt}>{getTimeAgo()}</time>
              <span aria-hidden="true">•</span>
              <i className="fas fa-globe-americas text-xs" aria-label="Public post" />
            </p>
          </div>

          {/* More Options */}
          <button
            onClick={(e) => e.stopPropagation()}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-color-button-blue"
            aria-label="More options"
          >
            <i className="fas fa-ellipsis-h text-color-text" />
          </button>
        </div>

        {/* Post Content */}
        <div className="mb-4">
          <p className="text-color-text-darker whitespace-pre-wrap break-words">
            {post.text || post.content}
          </p>
        </div>

        {/* Post Attachments */}
        {renderAttachments()}

        {/* Engagement Stats */}
        {(likeCount > 0 || post.commentCount > 0) && (
          <div className="flex items-center justify-between text-sm text-color-text py-3 border-t border-gray-100">
            {likeCount > 0 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  console.log("View likes");
                }}
                className="hover:underline focus:outline-none focus:underline"
              >
                <i className="fas fa-thumbs-up text-blue-600 mr-1" aria-hidden="true" />
                {likeCount} {likeCount === 1 ? "like" : "likes"}
              </button>
            )}
            
            {post.commentCount > 0 && (
              <button
                onClick={handleCommentClick}
                className="hover:underline focus:outline-none focus:underline ml-auto"
              >
                {post.commentCount} {post.commentCount === 1 ? "comment" : "comments"}
              </button>
            )}
          </div>
        )}

        {/* Action Buttons - Like, Comment, Share */}
        <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
          {/* Like Button with Animation */}
          <motion.button
            onClick={(e) => {
              e.stopPropagation();
              handleToggleLike(e);
            }}
            className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-color-button-blue focus:ring-inset ${
              isLiked
                ? "text-blue-600 bg-blue-50"
                : "text-color-text hover:bg-gray-100"
            }`}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            animate={isAnimating ? { scale: [1, 1.2, 1] } : {}}
            transition={{ duration: 0.3 }}
            aria-label={isLiked ? "Unlike post" : "Like post"}
            aria-pressed={isLiked}
          >
            <motion.i
              className={`fas fa-thumbs-up ${isLiked ? "text-blue-600" : ""}`}
              animate={isAnimating ? { rotate: [0, -15, 15, 0] } : {}}
              aria-hidden="true"
            />
            <span className="hidden sm:inline">Like</span>
          </motion.button>

          {/* Comment Button */}
          <motion.button
            onClick={handleCommentClick}
            className="flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-lg font-medium text-color-text hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-color-button-blue focus:ring-inset"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            aria-label="Comment on post"
          >
            <i className="fas fa-comment" aria-hidden="true" />
            <span className="hidden sm:inline">Comment</span>
          </motion.button>

          {/* Share Button */}
          <motion.button
            onClick={handleShareClick}
            className="flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-lg font-medium text-color-text hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-color-button-blue focus:ring-inset"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            aria-label="Share post"
          >
            <i className="fas fa-share" aria-hidden="true" />
            <span className="hidden sm:inline">Share</span>
          </motion.button>
        </div>
      </div>
    </motion.article>
  );
}
