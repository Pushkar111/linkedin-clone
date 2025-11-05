/**
 * UserPostCard Component
 * LinkedIn-style post card for profile page
 */
import React from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import formatDistanceToNow from "date-fns/formatDistanceToNow";

export default function UserPostCard({ post, index }) {
  const navigate = useNavigate();

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.4,
        delay: index * 0.1,
        ease: "easeOut",
      },
    },
  };

  const handlePostClick = () => {
    // Navigate to feed and scroll to post (or open post detail)
    navigate("/feed");
  };

  return (
    <motion.div
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      whileHover={{ y: -4, boxShadow: "0 12px 24px rgba(0,0,0,0.15)" }}
      className="user-post-card"
      onClick={handlePostClick}
    >
      {/* Post Image */}
      {post.mediaURL && (
        <div className="user-post-image-wrapper">
          <img
            src={post.mediaURL}
            alt="Post content"
            className="user-post-image"
          />
        </div>
      )}

      {/* Post Content */}
      <div className="user-post-content">
        <p className="user-post-text">
          {post.text}
        </p>

        {/* Post Stats */}
        <div className="user-post-stats">
          <div className="user-post-stats-left">
            <span className="user-post-stat">
              <i className="fas fa-thumbs-up"></i>
              {post.reactions?.length || 0}
            </span>
            <span className="user-post-stat">
              <i className="fas fa-comment"></i>
              {post.comments?.length || 0}
            </span>
          </div>
          <span className="user-post-time">
            {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
          </span>
        </div>
      </div>
    </motion.div>
  );
}
