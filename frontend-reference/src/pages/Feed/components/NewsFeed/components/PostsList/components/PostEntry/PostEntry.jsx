// eslint-disable-next-line no-unused-vars
import { Post, User, Profile } from "../../../../../../../../models";
import formatDistanceToNow from "date-fns/formatDistanceToNow";
import {
  MediaQueries,
  showNotAvailableToast,
} from "../../../../../../../../utilities";
import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import InteractionCounter from "./components/InteractionCounter";
import CommentsList from "./components/CommentsList/CommentsList";
import PostActionButton from "./components/PostActionButton";
import { ReactionButton, ReactionPicker, DeleteModal } from "../../../../../../../../components";
import { useReaction } from "../../../../../../../../hooks/useReaction";
import { formatReactionCounts } from "../../../../../../../../constants/reactions";
import HashtagText from "../../../../../../../../components/HashtagText";
import { connectionAPI } from "../../../../../../../../services";
/**
 *
 * @param {Object} props
 * @param {Profile} props.objCreatorProfile
 * @param {User} props.objLoggedUser
 * @param {Post} props.objPost
 * @param {number} props.intLikesCount
 * @param {number} props.intCommentsCount
 * @param {number} props.intSharesCount
 * @returns {JSX.Element}
 */
export default function PostEntry({
  objLoggedUser,
  objCreatorProfile,
  objPost,
  intLikesCount,
  intCommentsCount,
  intSharesCount,
}) {
  const navigate = useNavigate();
  const [showComments, setShowComments] = useState(false);
  const [showReactionPicker, setShowReactionPicker] = useState(false);
  const [showOptionsMenu, setShowOptionsMenu] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(objPost.strText);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [connectionDegree, setConnectionDegree] = useState(3);
  const menuRef = useRef(null);

  // Fetch connection degree
  useEffect(() => {
    const fetchDegree = async () => {
      // Skip if viewing own post
      if (objLoggedUser.strUserId === objPost.strUserId) {
        setConnectionDegree(0);
        return;
      }

      try {
        const degree = await connectionAPI.getConnectionDegree(
          objLoggedUser.strUserId,
          objPost.strUserId
        );
        setConnectionDegree(degree);
      } catch (error) {
        console.error("Error fetching connection degree:", error);
        setConnectionDegree(3);
      }
    };

    fetchDegree();
  }, [objLoggedUser.strUserId, objPost.strUserId]);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
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

  // Use custom hook for multi-reaction functionality with optimistic updates
  const {
    hasReacted,
    reactionType,
    reactionCount,
    reactionCounts,
    isAnimating,
    isPending,
    handleToggleReaction
  } = useReaction(objPost, objLoggedUser.strUserId);

  // Check if current user is post owner
  const isPostOwner = objLoggedUser.strUserId === objPost.strUserId;
  
  // Debug logging
  console.log("Post Owner Check:", {
    loggedUserId: objLoggedUser.strUserId,
    postUserId: objPost.strUserId,
    isPostOwner: isPostOwner
  });

  // Handler for hashtag clicks
  const handleHashtagClick = (hashtag) => {
    // TODO: Navigate to hashtag feed page
    console.log("View hashtag:", hashtag);
    showNotAvailableToast(); // Temporary until hashtag feed is implemented
  };

  // Handler for editing post
  const handleEditPost = async () => {
    if (!editText.trim() || editText.trim() === objPost.strText) {
      setIsEditing(false);
      setEditText(objPost.strText);
      return;
    }

    setIsSubmitting(true);

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `http://localhost:5000/api/posts/${objPost.strPostId}`,
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
      
      // Update the post text in the UI
      objPost.strText = data.post.text;
      setIsEditing(false);
      setShowOptionsMenu(false);
      console.log("✅ Post updated:", data.post);
    } catch (error) {
      console.error("❌ Failed to update post:", error);
      alert("Failed to update post. Please try again.");
      setEditText(objPost.strText);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handler for opening delete modal
  const handleDeleteClick = () => {
    setShowDeleteModal(true);
    setShowOptionsMenu(false);
  };

  // Handler for confirming delete
  const handleConfirmDelete = async () => {
    setIsDeleting(true);

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `http://localhost:5000/api/posts/${objPost.strPostId}`,
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

      console.log("✅ Post deleted successfully");
      
      // Close modal and reload the page to refresh the feed
      setShowDeleteModal(false);
      window.location.reload();
    } catch (error) {
      console.error("❌ Failed to delete post:", error);
      alert("Failed to delete post. Please try again.");
      setIsDeleting(false);
    }
  };

  // Handler for canceling edit
  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditText(objPost.strText);
  };

  // Handler for keyboard shortcuts in edit mode
  const handleEditKeyDown = (e) => {
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleEditPost();
    } else if (e.key === "Escape") {
      handleCancelEdit();
    }
  };

  // Handler for deleting comments
  const handleDeleteComment = async (commentId) => {
    if (!window.confirm("Are you sure you want to delete this comment?")) {
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `http://localhost:5000/api/posts/${objPost.strPostId}/comments/${commentId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to delete comment");
      }

      const data = await response.json();
      
      console.log("✅ Comment deleted successfully:", data);
      
      // Force a re-render by toggling comments view
      // The CommentsList component will handle the local state update
    } catch (error) {
      console.error("❌ Failed to delete comment:", error);
      alert("Failed to delete comment. Please try again.");
    }
  };

  // Handler for when a new comment is added
  const handleCommentAdded = (newComment) => {
    console.log("✅ New comment added:", newComment);
    // The comment is already added to the local state in CommentsList
    // Optionally refresh the post or update counts
  };

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
    }, 300); // Shorter delay for better UX
  };

  return (
    <div className=" bg-white h-fit sm:rounded-lg border shadow-sm">
      <div className="flex px-1 justify-between items-start m-3">
        <button
          type="button"
          onClick={() => navigate(`/profile/${objPost.strUserId}`)}
          className="flex gap-2 hover:opacity-80 transition-opacity"
        >
          <div className=" w-12 min-h-full flex items-end">
            <img
              loading="lazy"
              referrerPolicy="no-referrer"
              className="w-12 h-auto rounded-full"
              src={objCreatorProfile.strProfilePicURL}
              alt={
                objCreatorProfile.objIntro.strFirstName +
                " " +
                objCreatorProfile.objIntro.strLastName
              }
            />
          </div>
          <div className="flex flex-col">
            <div className="flex gap-1">
              <p className="text-color-text-darker capitalize font-bold text-base leading-5">
                {objCreatorProfile.objIntro.strFirstName +
                  " " +
                  objCreatorProfile.objIntro.strLastName}
              </p>
              <p className=" text-color-text">
                {"• " +
                  (objLoggedUser.strUserId === objPost.strUserId
                    ? "You"
                    : connectionDegree === 1
                    ? "1st"
                    : connectionDegree === 2
                    ? "2nd"
                    : "3rd")}
              </p>
            </div>
            <p className="text-color-text text-sm leading-4">
              {objCreatorProfile.objIntro.strHeadline}
            </p>
            <div className="flex gap-1 items-center text-color-text">
              <p className=" text-sm">
                {formatDistanceToNow(objPost.dtCreatedOn) + " •"}
              </p>
              <span>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 16 16"
                  data-supported-dps="16x16"
                  fill="currentColor"
                  width="16"
                  height="16"
                  focusable="false"
                >
                  <path d="M8 1a7 7 0 107 7 7 7 0 00-7-7zM3 8a5 5 0 011-3l.55.55A1.5 1.5 0 015 6.62v1.07a.75.75 0 00.22.53l.56.56a.75.75 0 00.53.22H7v.69a.75.75 0 00.22.53l.56.56a.75.75 0 01.22.53V13a5 5 0 01-5-5zm6.24 4.83l2-2.46a.75.75 0 00.09-.8l-.58-1.16A.76.76 0 0010 8H7v-.19a.51.51 0 01.28-.45l.38-.19a.74.74 0 01.68 0L9 7.5l.38-.7a1 1 0 00.12-.48v-.85a.78.78 0 01.21-.53l1.07-1.09a5 5 0 01-1.54 9z"></path>
                </svg>
              </span>
            </div>
          </div>
        </button>
        
        {/* Options Menu (Three-dot menu for owner) */}
        {isPostOwner && (
          <div className="relative" ref={menuRef}>
            <button
              type="button"
              onClick={() => setShowOptionsMenu(!showOptionsMenu)}
              className={
                "relative rounded-full h-8 w-8 hover:bg-[#00000014] text-color-text flex items-center justify-center whitespace-nowrap"
              }
              disabled={isDeleting}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                data-supported-dps="24x24"
                fill="currentColor"
                width="24"
                height="24"
                focusable="false"
              >
                <path d="M14 12a2 2 0 11-2-2 2 2 0 012 2zM4 10a2 2 0 102 2 2 2 0 00-2-2zm16 0a2 2 0 102 2 2 2 0 00-2-2z"></path>
              </svg>
            </button>

            {/* Dropdown Menu */}
            {showOptionsMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                <button
                  onClick={() => {
                    setIsEditing(true);
                    setShowOptionsMenu(false);
                  }}
                  className="w-full text-left px-4 py-3 hover:bg-gray-100 flex items-center gap-3 text-sm font-medium text-gray-700"
                  disabled={isDeleting}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    width="20"
                    height="20"
                  >
                    <path d="M21.13 2.86a3 3 0 00-4.17 0l-13 13L2 22l6.19-2L21.13 7a3 3 0 000-4.16zM6.77 18.57l-1.35-1.34L16.64 6 18 7.35z"></path>
                  </svg>
                  Edit post
                </button>
                <button
                  onClick={handleDeleteClick}
                  className="w-full text-left px-4 py-3 hover:bg-gray-100 flex items-center gap-3 text-sm font-medium text-red-600"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    width="20"
                    height="20"
                  >
                    <path d="M21 6h-5V4.33A2.42 2.42 0 0013.5 2h-3A2.42 2.42 0 008 4.33V6H3v2h1.5l.9 12.58A3 3 0 008.38 23h7.24a3 3 0 003-2.42L19.5 8H21zM10 4.33c0-.16.21-.33.5-.33h3c.29 0 .5.17.5.33V6h-4zM17.49 20.38a1 1 0 01-1 .81H8.38a1 1 0 01-.98-.8L6.52 8h11z"></path>
                  </svg>
                  Delete post
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Edit Mode */}
      {isEditing ? (
        <div className="px-4 pb-3">
          <textarea
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            onKeyDown={handleEditKeyDown}
            className="w-full min-h-[100px] p-3 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 text-[15px] text-color-text-darker resize-vertical"
            disabled={isSubmitting}
            autoFocus
          />
          <div className="flex gap-2 mt-2 justify-end">
            <button
              onClick={handleCancelEdit}
              className="px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-100 rounded-full"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              onClick={handleEditPost}
              className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-full disabled:opacity-50"
              disabled={isSubmitting || !editText.trim()}
            >
              {isSubmitting ? "Saving..." : "Save"}
            </button>
          </div>
        </div>
      ) : (
        <div className=" px-4 text-[15px] text-color-text-darker font-normal leading-5">
          <HashtagText text={objPost.strText} onHashtagClick={handleHashtagClick} className="" />
        </div>
      )}
      
      {/* Display post image if available */}
      {objPost.strMediaType === "photo" && objPost.strMediaURL ? (
        <div className="mt-2">
          <img
            loading="lazy"
            src={objPost.strMediaURL}
            alt="Post content"
            className="w-full h-auto object-cover"
          />
        </div>
      ) : null}
      
      {intLikesCount > 0 || intCommentsCount > 0 || intSharesCount > 0 ? (
        <InteractionCounter />
      ) : null}

      <div className="flex items-center justify-center mt-1 py-1 px-3">
        <div 
          className="relative flex-auto flex rounded"
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          <ReactionButton
            hasReacted={hasReacted}
            reactionType={reactionType}
            reactionCount={reactionCount}
            isAnimating={isAnimating}
            isPending={isPending}
            onClick={() => handleToggleReaction(reactionType || "like")}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
          />
          
          {showReactionPicker && (
            <ReactionPicker
              currentReaction={reactionType}
              onReactionSelect={handleToggleReaction}
              onMouseEnter={handleMouseEnter}
              onMouseLeave={handleMouseLeave}
            />
          )}
        </div>

        <PostActionButton
          strType="Comment"
          handleClick={() => setShowComments(!showComments)}
        />
        <PostActionButton strType="Share" handleClick={showNotAvailableToast} />
        {MediaQueries.minWidth640px.matches ? (
          <PostActionButton
            strType="Send"
            handleClick={showNotAvailableToast}
          />
        ) : null}
      </div>
      
      {/* Optional: Display reaction counts breakdown */}
      {reactionCount > 0 && reactionCounts && Object.keys(reactionCounts).length > 0 && (
        <div className="px-4 pb-2 text-xs text-color-text flex items-center gap-2">
          <span className="font-medium">Reactions:</span>
          {formatReactionCounts(reactionCounts).map((reaction, index) => (
            <span key={reaction.type} className="inline-flex items-center gap-1">
              <span>{reaction.emoji}</span>
              <span className="font-medium">{reaction.count}</span>
              {index < formatReactionCounts(reactionCounts).length - 1 && <span>•</span>}
            </span>
          ))}
        </div>
      )}
      
      {showComments ? (
        <CommentsList
          comments={objPost.comments || []}
          postId={objPost.strPostId}
          currentUserId={objLoggedUser.strUserId}
          currentUser={objLoggedUser}
          onDeleteComment={handleDeleteComment}
          onCommentAdded={handleCommentAdded}
        />
      ) : null}

      {/* Delete Confirmation Modal */}
      <DeleteModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleConfirmDelete}
        title="Delete Post"
        message="Are you sure you want to delete this post? This action cannot be undone."
        isDeleting={isDeleting}
      />
    </div>
  );
}
