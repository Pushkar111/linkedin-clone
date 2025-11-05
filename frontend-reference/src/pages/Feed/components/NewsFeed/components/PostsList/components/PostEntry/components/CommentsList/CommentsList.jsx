/**
 * CommentsList Component
 * Displays all comments for a post with reactions
 */
import React, { useState, useEffect } from "react";
import CommentItem from "./components/CommentItem";
import AddComment from "./components/AddComment";
import "./CommentsList.css";

/**
 * @param {Object} props
 * @param {Object[]} props.comments - Array of comment objects
 * @param {string} props.postId - Post ID
 * @param {string} props.currentUserId - Current logged in user ID
 * @param {Object} props.currentUser - Current user object
 * @param {Function} props.onDeleteComment - Delete comment handler
 * @param {Function} props.onCommentAdded - Callback when comment is added
 */
export default function CommentsList({ comments = [], postId, currentUserId, currentUser, onDeleteComment, onCommentAdded }) {
  const [localComments, setLocalComments] = useState(comments);
  
  // Sync local comments with prop changes
  useEffect(() => {
    setLocalComments(comments);
  }, [comments]);

  const handleCommentAdded = (newComment) => {
    // Add new comment to local state
    setLocalComments([...localComments, newComment]);
    
    // Notify parent if callback provided
    if (onCommentAdded) {
      onCommentAdded(newComment);
    }
  };

  const handleCommentEdited = (editedComment) => {
    // Update comment in local state
    setLocalComments(localComments.map(comment => 
      comment._id === editedComment._id ? editedComment : comment
    ));
  };

  const handleCommentDeleted = async (commentId) => {
    // Call parent's delete handler
    if (onDeleteComment) {
      await onDeleteComment(commentId);
    }
    
    // Remove comment from local state
    setLocalComments(localComments.filter(comment => comment._id !== commentId));
  };

  return (
    <div className="comments-list-container">
      {/* Add comment input box */}
      <AddComment
        postId={postId}
        currentUser={currentUser}
        onCommentAdded={handleCommentAdded}
      />

      {/* Comments list */}
      {localComments && localComments.length > 0 ? (
        <div className="comments-list">
          {localComments.map((comment) => (
            <CommentItem
              key={comment._id}
              comment={comment}
              postId={postId}
              currentUserId={currentUserId}
              onDelete={handleCommentDeleted}
              onEdit={handleCommentEdited}
            />
          ))}
        </div>
      ) : (
        <div className="comments-list-empty">
          <p style={{ color: "gray" }}>No comments yet. Be the first to comment!</p>
        </div>
      )}
    </div>
  );
}
