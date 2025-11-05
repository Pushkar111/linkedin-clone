/**
 * Custom hook for optimistic reaction functionality with animations
 * LinkedIn-style multi-reaction system with instant UI feedback
 */
import { useState, useCallback, useEffect } from "react";
import { useDispatch } from "react-redux";
import { toggleReaction } from "../redux/thunks/postThunks";

/**
 * Custom hook to handle post reactions with optimistic updates
 * @param {Object} post - The post object
 * @param {string} userId - Current logged in user ID
 * @returns {Object} Reaction state and handlers
 */
export const useReaction = (post, userId) => {
  const dispatch = useDispatch();
  
  // Local state for optimistic UI updates (synced with Redux)
  const [hasReacted, setHasReacted] = useState(false);
  const [reactionType, setReactionType] = useState(null);
  const [reactionCount, setReactionCount] = useState(0);
  const [reactionCounts, setReactionCounts] = useState({});
  const [isAnimating, setIsAnimating] = useState(false);
  const [isPending, setIsPending] = useState(false);

  // Sync local state with Redux state
  useEffect(() => {
    if (post) {
      // Check if user has reacted
      const userReaction = post.reactions?.find(r => r.user === userId);
      
      setHasReacted(!!userReaction);
      setReactionType(userReaction ? userReaction.type : null);
      setReactionCount(post.reactionCount || post.reactions?.length || 0);
      
      // Calculate reaction counts by type
      const counts = {};
      if (post.reactions && Array.isArray(post.reactions)) {
        post.reactions.forEach(reaction => {
          const type = reaction.type || "like";
          counts[type] = (counts[type] || 0) + 1;
        });
      }
      setReactionCounts(counts);
      
      setIsPending(post._isReactionPending || false);
    }
  }, [post, userId]);

  /**
   * Handle reaction toggle with optimistic update
   * @param {string} selectedReactionType - The reaction type selected
   */
  const handleToggleReaction = useCallback(async (selectedReactionType) => {
    // Prevent multiple clicks while request is pending
    if (isPending) {
      console.log("Reaction action already in progress");
      return;
    }

    if (!post || !userId) {
      console.error("Missing post or userId");
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
        if (newCounts[reactionType]) {
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

      // Dispatch Redux action (which also does optimistic update in Redux)
      const result = await dispatch(
        toggleReaction({
          postId: post.strPostId,
          userId: userId,
          reactionType: selectedReactionType,
        })
      ).unwrap();

      // Success - sync with server response
      console.log("✅ Reaction toggle success:", {
        postId: result.postId,
        reacted: result.reacted,
        reactionType: result.reactionType,
        reactionCount: result.reactionCount,
        reactionCounts: result.reactionCounts,
      });

      // Sync with server response (in case of reconciliation)
      setHasReacted(result.reacted);
      setReactionType(result.reactionType);
      setReactionCount(result.reactionCount);
      setReactionCounts(result.reactionCounts || {});
      setIsPending(false);

    } catch (error) {
      console.error("❌ Failed to toggle reaction:", error);

      // Rollback optimistic update on error
      setHasReacted(originalHasReacted);
      setReactionType(originalReactionType);
      setReactionCount(originalCount);
      setReactionCounts(originalCounts);
      setIsPending(false);
      setIsAnimating(false);

      // Error toast already shown by Redux thunk
    }
  }, [dispatch, post, userId, hasReacted, reactionType, reactionCount, reactionCounts, isPending]);

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
