/**
 * Custom hook for comment reaction functionality with optimistic updates
 * Similar to useReaction but for comments instead of posts
 */
import { useState, useCallback, useEffect } from "react";
import { commentReactionAPI } from "../services/apiAdapters";

/**
 * Custom hook to handle comment reactions with optimistic updates
 * @param {string} postId - The post ID
 * @param {string} commentId - The comment ID
 * @param {Object} initialReactionData - Initial reaction data from comment
 * @param {string} userId - Current logged in user ID
 * @returns {Object} Reaction state and handlers
 */
export const useCommentReaction = (postId, commentId, initialReactionData = {}, userId) => {
  
  // Local state for optimistic UI updates
  const [hasReacted, setHasReacted] = useState(false);
  const [reactionType, setReactionType] = useState(null);
  const [reactionCount, setReactionCount] = useState(0);
  const [reactionCounts, setReactionCounts] = useState({});
  const [isAnimating, setIsAnimating] = useState(false);
  const [isPending, setIsPending] = useState(false);

  // Initialize from prop data
  useEffect(() => {
    if (initialReactionData) {
      setHasReacted(!!initialReactionData.userReaction);
      setReactionType(initialReactionData.userReaction || null);
      setReactionCount(initialReactionData.totalReactions || 0);
      setReactionCounts(initialReactionData.reactionCounts || {});
    }
  }, [
    initialReactionData?.userReaction,
    initialReactionData?.totalReactions,
    JSON.stringify(initialReactionData?.reactionCounts)
  ]);

  /**
   * Handle reaction toggle with optimistic update
   * @param {string} selectedReactionType - The reaction type selected
   */
  const handleToggleReaction = useCallback(async (selectedReactionType) => {
    // Prevent multiple clicks while request is pending
    if (isPending) {
      console.log("Comment reaction action already in progress");
      return;
    }

    if (!postId || !commentId || !userId) {
      console.error("Missing postId, commentId, or userId");
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

      // Call API
      const result = await commentReactionAPI.toggleReaction(postId, commentId, selectedReactionType);

      // Success - sync with server response
      console.log("✅ Comment reaction toggle success:", result);

      if (result.success && result.data) {
        setHasReacted(!!result.data.userReaction);
        setReactionType(result.data.userReaction || null);
        setReactionCount(result.data.totalReactions || 0);
        setReactionCounts(result.data.reactionCounts || {});
      }
      setIsPending(false);

    } catch (error) {
      console.error("❌ Failed to toggle comment reaction:", error);

      // Rollback optimistic update on error
      setHasReacted(originalHasReacted);
      setReactionType(originalReactionType);
      setReactionCount(originalCount);
      setReactionCounts(originalCounts);
      setIsPending(false);
      setIsAnimating(false);
    }
  }, [postId, commentId, userId, hasReacted, reactionType, reactionCount, reactionCounts, isPending]);

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

export default useCommentReaction;
