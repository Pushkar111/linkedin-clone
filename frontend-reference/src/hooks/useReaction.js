/**
 * Custom hook for optimistic reaction functionality with animations
 * LinkedIn-style multi-reaction system with instant UI feedback
 * 
 * LOGIC MATCHES: useCommentReaction.js for consistent behavior
 */
import { useState, useCallback, useEffect } from "react";
import { postAPI } from "../services";

/**
 * Custom hook to handle post reactions with optimistic updates
 * Same logic as useCommentReaction for consistency
 * @param {Object} post - The post object
 * @param {string} userId - Current logged in user ID
 * @returns {Object} Reaction state and handlers
 */
export const useReaction = (post, userId) => {
  const postId = post?.strPostId || post?._id;
  
  // Local state for optimistic UI updates
  const [hasReacted, setHasReacted] = useState(false);
  const [reactionType, setReactionType] = useState(null);
  const [reactionCount, setReactionCount] = useState(0);
  const [reactionCounts, setReactionCounts] = useState({});
  const [isAnimating, setIsAnimating] = useState(false);
  const [isPending, setIsPending] = useState(false);

  // Initialize from post data (same pattern as useCommentReaction)
  // Use JSON.stringify for object comparisons to prevent infinite loops
  useEffect(() => {
    if (!post || !postId) return;

    // Find user's reaction
    const userReaction = post.reactions?.find(r => 
      r.user === userId || r.user?._id === userId
    );
    
    const hasReactedState = !!userReaction;
    const reactionTypeState = userReaction ? userReaction.type : null;
    const reactionCountState = post.reactionCount || post.intReactionCount || post.reactions?.length || 0;
    
    // Use provided reactionCounts or calculate from reactions array
    const counts = post.reactionCounts || {};
    
    setHasReacted(hasReactedState);
    setReactionType(reactionTypeState);
    setReactionCount(reactionCountState);
    setReactionCounts(counts);
  }, [
    postId,
    userId,
    post?.reactions?.length,
    post?.reactionCount,
    post?.intReactionCount,
    JSON.stringify(post?.reactionCounts)
  ]);

  /**
   * Handle reaction toggle with optimistic update
   * SAME LOGIC as useCommentReaction for consistency
   * @param {string} selectedReactionType - The reaction type selected
   */
  const handleToggleReaction = useCallback(async (selectedReactionType) => {
    // Prevent multiple clicks while request is pending
    if (isPending) {
      return;
    }

    // Silently return if postId or userId missing (user still loading)
    if (!postId || !userId) {
      return;
    }

    // Store original state for potential rollback
    const originalHasReacted = hasReacted;
    const originalReactionType = reactionType;
    const originalCount = reactionCount;
    const originalCounts = { ...reactionCounts };

    try {
      let newHasReacted;
      let newReactionType;
      let newCount;
      let newCounts = { ...originalCounts };

      // Determine new state based on current state and selected reaction
      if (hasReacted && reactionType === selectedReactionType) {
        // Same reaction - remove it (unreact)
        newHasReacted = false;
        newReactionType = null;
        newCount = Math.max(0, originalCount - 1);
        
        // Decrease count for this reaction type
        if (newCounts[selectedReactionType]) {
          newCounts[selectedReactionType] = Math.max(0, newCounts[selectedReactionType] - 1);
          if (newCounts[selectedReactionType] === 0) {
            delete newCounts[selectedReactionType];
          }
        }
      } else if (hasReacted && reactionType !== selectedReactionType) {
        // Different reaction - change it
        newHasReacted = true;
        newReactionType = selectedReactionType;
        newCount = originalCount; // Count stays same (changing type)
        
        // Decrease old reaction count, increase new one
        if (reactionType && newCounts[reactionType]) {
          newCounts[reactionType] = Math.max(0, newCounts[reactionType] - 1);
          if (newCounts[reactionType] === 0) {
            delete newCounts[reactionType];
          }
        }
        newCounts[selectedReactionType] = (newCounts[selectedReactionType] || 0) + 1;
      } else {
        // No reaction yet - add new one
        newHasReacted = true;
        newReactionType = selectedReactionType;
        newCount = originalCount + 1;
        
        // Increase count for this reaction type
        newCounts[selectedReactionType] = (newCounts[selectedReactionType] || 0) + 1;
      }

      // Optimistic update - update UI immediately
      setHasReacted(newHasReacted);
      setReactionType(newReactionType);
      setReactionCount(newCount);
      setReactionCounts(newCounts);
      setIsAnimating(true);
      setIsPending(true);

      // Trigger animation for 300ms
      setTimeout(() => setIsAnimating(false), 300);

      // Call API directly (same pattern as useCommentReaction)
      const result = await postAPI.toggleReactionPost(postId, selectedReactionType);

      // Success - sync with server response (same as comment reactions)
      console.log("✅ Post reaction toggle success:", result);

      if (result.success && result.data) {
        setHasReacted(!!result.data.userReaction);
        setReactionType(result.data.userReaction || null);
        setReactionCount(result.data.totalReactions || 0);
        setReactionCounts(result.data.reactionCounts || {});
      }
      setIsPending(false);

    } catch (error) {
      console.error("❌ Failed to toggle post reaction:", error);

      // Rollback optimistic update on error
      setHasReacted(originalHasReacted);
      setReactionType(originalReactionType);
      setReactionCount(originalCount);
      setReactionCounts(originalCounts);
      setIsPending(false);
      setIsAnimating(false);
    }
  }, [postId, userId, hasReacted, reactionType, reactionCount, reactionCounts, isPending]);

  return {
    hasReacted,
    reactionType,
    reactionCount,
    reactionCounts,
    isAnimating,
    isPending,
    handleToggleReaction,
  };
};

export default useReaction;
