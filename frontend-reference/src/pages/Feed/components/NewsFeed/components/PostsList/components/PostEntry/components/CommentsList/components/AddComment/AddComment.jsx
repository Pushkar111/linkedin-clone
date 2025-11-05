/**
 * AddComment Component
 * Input box to add new comments
 */
import React, { useState } from "react";
import "./AddComment.css";

/**
 * @param {Object} props
 * @param {string} props.postId - Post ID
 * @param {Object} props.currentUser - Current user object
 * @param {Function} props.onCommentAdded - Callback when comment is added
 */
export default function AddComment({ postId, currentUser, onCommentAdded }) {
  const [commentText, setCommentText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!commentText.trim()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`http://localhost:5000/api/posts/${postId}/comments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ text: commentText.trim() }),
      });

      if (!response.ok) {
        throw new Error("Failed to add comment");
      }

      const data = await response.json();
      
      // Clear input
      setCommentText("");
      
      // Notify parent component
      if (onCommentAdded) {
        onCommentAdded(data.comment);
      }

      console.log("✅ Comment added:", data.comment);
    } catch (error) {
      console.error("❌ Failed to add comment:", error);
      alert("Failed to add comment. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyPress = (e) => {
    // Submit on Enter (without Shift)
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className="add-comment">
      <div className="add-comment-avatar">
        <img
          src={currentUser?.profilePicURL || currentUser?.strProfilePicURL || "/default-avatar.png"}
          alt="Your avatar"
          className="add-comment-avatar-img"
        />
      </div>

      <form onSubmit={handleSubmit} className="add-comment-form">
        <textarea
          className="add-comment-input"
          placeholder="Add a comment..."
          value={commentText}
          onChange={(e) => setCommentText(e.target.value)}
          onKeyPress={handleKeyPress}
          disabled={isSubmitting}
          rows={1}
        />
        
        <div className="add-comment-actions">
          <button
            type="submit"
            className="add-comment-submit"
            disabled={isSubmitting || !commentText.trim()}
          >
            {isSubmitting ? "Posting..." : "Post"}
          </button>
        </div>
      </form>
    </div>
  );
}
