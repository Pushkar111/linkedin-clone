/**
 * Custom hook for optimistic like/unlike functionality with animations
 * Provides instant UI feedback, error handling, and rollback on failure
 */
import { useState, useCallback, useEffect } from "react";
import { useDispatch } from "react-redux";
import { toggleLike } from "../redux/thunks";

/**
 * Custom hook to handle post like/unlike with optimistic updates
 * @param {Object} post - The post object
 * @param {string} userId - Current logged in user ID
 * @returns {Object} Like state and handlers
 */
export const useLikePost = (post, userId) => {
  const dispatch = useDispatch();
  
  // Local state for optimistic UI updates (synced with Redux)
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isPending, setIsPending] = useState(false);

  // Sync local state with Redux state
  useEffect(() => {
    if (post) {
      const liked = post.likes?.includes(userId) || false;
      const count = post.intReactionCount || 0;
      
      setIsLiked(liked);
      setLikeCount(count);
      setIsPending(post._isLikePending || false);
    }
  }, [post, userId]);

  /**
   * Handle like/unlike toggle with optimistic update
   */
  const handleToggleLike = useCallback(async (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    // Prevent multiple clicks while request is pending
    if (isPending) {
      console.log("Like action already in progress");
      return;
    }

    if (!post || !userId) {
      console.error("Missing post or userId");
      return;
    }

    // Store original state for potential rollback
    const originalIsLiked = isLiked;
    const originalCount = likeCount;

    try {
      // Optimistic update - update UI immediately
      setIsLiked(!originalIsLiked);
      setLikeCount(originalIsLiked ? Math.max(0, originalCount - 1) : originalCount + 1);
      setIsAnimating(true);
      setIsPending(true);

      // Trigger animation for 300ms
      setTimeout(() => setIsAnimating(false), 300);

      // Dispatch Redux action (which also does optimistic update in Redux)
      const result = await dispatch(
        toggleLike({
          postId: post.strPostId,
          userId: userId,
        })
      ).unwrap();

      // Success - Redux will update the store with server response
      console.log("✅ Like toggle success:", {
        postId: result.postId,
        liked: result.liked,
        likeCount: result.likeCount,
      });

      // Sync with server response (in case of reconciliation)
      setIsLiked(result.liked);
      setLikeCount(result.likeCount);
      setIsPending(false);

    } catch (error) {
      console.error("❌ Failed to toggle like:", error);

      // Rollback optimistic update on error
      setIsLiked(originalIsLiked);
      setLikeCount(originalCount);
      setIsPending(false);
      setIsAnimating(false);

      // Error toast already shown by Redux thunk
    }
  }, [dispatch, post, userId, isLiked, likeCount, isPending]);

  return {
    isLiked,
    likeCount,
    isAnimating,
    isPending,
    handleToggleLike,
  };
};

export default useLikePost;
