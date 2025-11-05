/**
 * ReactionContext - Global State Manager for Reaction Synchronization with localStorage
 * 
 * Ensures reaction consistency across Feed, Profile, and Post Detail pages.
 * Maintains a centralized cache of post reactions to prevent state discrepancies.
 * 
 * Features:
 * - Global reaction state sync across all views
 * - Optimistic updates with rollback on error
 * - API response caching
 * - Real-time state synchronization
 * - Persist reactions across page refresh using localStorage + backend sync
 * - Instant load from localStorage, then reconcile with backend
 * - No flicker or delay on page refresh
 */

import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import axios from "axios";
import { toast } from "react-toastify";

// Create context
// @ts-ignore - Context value provided by ReactionProvider
const ReactionContext = createContext(null);

// API base URL
const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000/api";

// LocalStorage key for reaction cache
const REACTION_CACHE_KEY = "reactionCache";

/**
 * ReactionProvider Component
 * Wraps the app to provide global reaction state
 */
export const ReactionProvider = ({ children, currentUser }) => {
  // Global reaction cache: { postId: { reactionType, reactionCount, reactionCounts, hasReacted } }
  const [reactionCache, setReactionCache] = useState({});
  
  // Pending API requests (to prevent duplicate calls)
  const [pendingRequests, setPendingRequests] = useState(new Set());
  
  // Track if reactions have been loaded from backend
  const [isLoaded, setIsLoaded] = useState(false);

  /**
   * Step 1: Load from localStorage instantly on mount (before backend)
   * This ensures instant display of reactions on page load
   */
  useEffect(() => {
    try {
      const cached = localStorage.getItem(REACTION_CACHE_KEY);
      if (cached) {
        const parsedCache = JSON.parse(cached);
        setReactionCache(parsedCache);
        console.log(`💾 Loaded ${Object.keys(parsedCache).length} reactions from localStorage`);
      }
    } catch (error) {
      console.error("❌ Failed to load reactions from localStorage:", error);
      // Clear corrupted cache
      localStorage.removeItem(REACTION_CACHE_KEY);
    }
  }, []); // Run once on mount

  /**
   * Step 2: Fetch all user reactions from backend and merge with localStorage
   * This runs after localStorage load to ensure backend is source of truth
   */
  useEffect(() => {
    const loadUserReactions = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          console.log("No token found, skipping backend reaction load");
          setIsLoaded(true);
          return;
        }

        console.log("🔄 Loading user reactions from backend...");
        const response = await axios.get(`${API_URL}/posts/reactions/me`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.data.success && response.data.reactions) {
          const backendMap = {};
          response.data.reactions.forEach(({ postId, reactionType }) => {
            backendMap[postId] = {
              reactionType,
              hasReacted: true,
              lastUpdated: Date.now(),
              loadedFromBackend: true,
            };
          });

          // Merge with existing cache (backend wins)
          setReactionCache(prev => {
            const merged = { ...prev, ...backendMap };
            
            // Persist merged state to localStorage
            try {
              localStorage.setItem(REACTION_CACHE_KEY, JSON.stringify(merged));
            } catch (error) {
              console.error("❌ Failed to persist reactions to localStorage:", error);
            }
            
            return merged;
          });

          console.log(`✅ Loaded ${response.data.reactions.length} reactions from backend`);
        }

        setIsLoaded(true);
      } catch (error) {
        console.error("❌ Failed to load user reactions:", error);
        setIsLoaded(true);
      }
    };

    // Only load if user is authenticated
    if (currentUser?._id) {
      loadUserReactions();
    } else {
      setIsLoaded(true);
    }
  }, [currentUser]); // Re-run when currentUser changes

  /**
   * Initialize reaction state for a post
   * @param {string} postId - Post ID
   * @param {Object} initialState - Initial reaction state from API
   */
  const initializeReaction = useCallback((postId, initialState) => {
    if (!postId) return;

    setReactionCache(prev => ({
      ...prev,
      [postId]: {
        reactionType: initialState.reactionType || null,
        hasReacted: initialState.hasReacted || false,
        reactionCount: initialState.reactionCount || 0,
        reactionCounts: initialState.reactionCounts || {},
        lastUpdated: Date.now(),
      }
    }));
  }, []);

  /**
   * Get current reaction state for a post
   * @param {string} postId - Post ID
   * @returns {Object} Current reaction state
   */
  const getReaction = useCallback((postId) => {
    if (!postId) return null;
    return reactionCache[postId] || null;
  }, [reactionCache]);

  /**
   * Step 3: Update reaction for a post with optimistic update + localStorage persistence
   * @param {string} postId - Post ID
   * @param {string} reactionType - Type of reaction
   * @param {string} userId - Current user ID
   * @returns {Promise<Object>} Updated reaction state
   */
  const updateReaction = useCallback(async (postId, reactionType, userId) => {
    if (!postId || !reactionType || !userId) {
      console.error("Missing required parameters for updateReaction");
      return null;
    }

    // Prevent duplicate requests
    const requestKey = `${postId}-${reactionType}`;
    if (pendingRequests.has(requestKey)) {
      console.log("Request already in progress, skipping duplicate");
      return null;
    }

    // Get current state for rollback
    const currentState = reactionCache[postId] || {
      reactionType: null,
      hasReacted: false,
      reactionCount: 0,
      reactionCounts: {},
    };

    // Calculate optimistic state
    let newHasReacted;
    let newReactionType;
    let newCount;
    let newCounts = { ...currentState.reactionCounts };

    if (currentState.hasReacted && currentState.reactionType === reactionType) {
      // Same reaction - remove it (unreact)
      newHasReacted = false;
      newReactionType = null;
      newCount = Math.max(0, currentState.reactionCount - 1);
      
      if (newCounts[reactionType]) {
        newCounts[reactionType] = Math.max(0, newCounts[reactionType] - 1);
        if (newCounts[reactionType] === 0) {
          delete newCounts[reactionType];
        }
      }
    } else if (currentState.hasReacted && currentState.reactionType !== reactionType) {
      // Different reaction - change it
      newHasReacted = true;
      newReactionType = reactionType;
      newCount = currentState.reactionCount; // Count stays same
      
      // Decrease old reaction count
      if (newCounts[currentState.reactionType]) {
        newCounts[currentState.reactionType] = Math.max(0, newCounts[currentState.reactionType] - 1);
        if (newCounts[currentState.reactionType] === 0) {
          delete newCounts[currentState.reactionType];
        }
      }
      // Increase new reaction count
      newCounts[reactionType] = (newCounts[reactionType] || 0) + 1;
    } else {
      // No reaction yet - add new one
      newHasReacted = true;
      newReactionType = reactionType;
      newCount = currentState.reactionCount + 1;
      newCounts[reactionType] = (newCounts[reactionType] || 0) + 1;
    }

    const optimisticState = {
      reactionType: newReactionType,
      hasReacted: newHasReacted,
      reactionCount: newCount,
      reactionCounts: newCounts,
      lastUpdated: Date.now(),
      isPending: true,
    };

    // Optimistic update to state
    setReactionCache(prev => {
      const updated = { ...prev, [postId]: optimisticState };
      
      // Persist optimistic state to localStorage immediately
      try {
        localStorage.setItem(REACTION_CACHE_KEY, JSON.stringify(updated));
      } catch (error) {
        console.error("❌ Failed to persist reaction to localStorage:", error);
      }
      
      return updated;
    });

    // Mark request as pending
    setPendingRequests(prev => new Set(prev).add(requestKey));

    try {
      // Make API call
      const token = localStorage.getItem("token");
      const response = await axios.post(
        `${API_URL}/posts/${postId}/react`,
        { reactionType },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      // Sync with server response (new format matching comment reactions)
      const responseData = response.data.data || response.data; // Handle both old and new formats
      const serverState = {
        reactionType: responseData.userReaction || response.data.reactionType || null,
        hasReacted: responseData.userReaction ? true : (response.data.reacted || false),
        reactionCount: responseData.totalReactions || response.data.reactionCount || 0,
        reactionCounts: responseData.reactionCounts || response.data.reactionCounts || {},
        lastUpdated: Date.now(),
        isPending: false,
      };

      setReactionCache(prev => {
        const updated = { ...prev, [postId]: serverState };
        
        // Persist server state to localStorage
        try {
          localStorage.setItem(REACTION_CACHE_KEY, JSON.stringify(updated));
        } catch (error) {
          console.error("❌ Failed to persist reaction to localStorage:", error);
        }
        
        return updated;
      });

      console.log("✅ Post reaction toggle success:", {
        success: response.data.success,
        message: response.data.message,
        data: responseData
      });
      console.log("✅ Reaction updated successfully:", serverState);
      return serverState;

    } catch (error) {
      console.error("❌ Failed to update reaction:", error);
      
      // Rollback to previous state
      setReactionCache(prev => {
        const rolledBack = {
          ...prev,
          [postId]: {
            ...currentState,
            isPending: false,
          }
        };
        
        // Persist rollback to localStorage
        try {
          localStorage.setItem(REACTION_CACHE_KEY, JSON.stringify(rolledBack));
        } catch (error) {
          console.error("❌ Failed to persist rollback to localStorage:", error);
        }
        
        return rolledBack;
      });

      toast.error("Failed to update reaction. Please try again.");
      return null;

    } finally {
      // Remove from pending requests
      setPendingRequests(prev => {
        const newSet = new Set(prev);
        newSet.delete(requestKey);
        return newSet;
      });
    }
  }, [reactionCache, pendingRequests]);

  /**
   * Sync reactions from API response (used when fetching posts)
   * @param {Array} posts - Array of posts with reaction data
   * @param {string} userId - Current user ID
   */
  const syncReactionsFromPosts = useCallback((posts, userId) => {
    if (!posts || !Array.isArray(posts)) return;

    const updates = {};
    posts.forEach(post => {
      const postId = post._id || post.strPostId;
      if (!postId) return;

      // Find user's reaction
      const userReaction = post.reactions?.find(r => 
        (r.user === userId || r.user?._id === userId)
      );

      // Calculate reaction counts
      const reactionCounts = {};
      if (post.reactions && Array.isArray(post.reactions)) {
        post.reactions.forEach(reaction => {
          const type = reaction.type || "like";
          reactionCounts[type] = (reactionCounts[type] || 0) + 1;
        });
      }

      updates[postId] = {
        reactionType: userReaction?.type || null,
        hasReacted: !!userReaction,
        reactionCount: post.reactionCount || post.reactions?.length || 0,
        reactionCounts,
        lastUpdated: Date.now(),
      };
    });

    setReactionCache(prev => ({ ...prev, ...updates }));
  }, []);

  /**
   * Clear reaction cache (useful for logout)
   * Clears both in-memory state and localStorage
   */
  const clearReactionCache = useCallback(() => {
    setReactionCache({});
    setPendingRequests(new Set());
    
    // Clear localStorage
    try {
      localStorage.removeItem(REACTION_CACHE_KEY);
      console.log("🧹 Reaction cache cleared");
    } catch (error) {
      console.error("❌ Failed to clear reaction cache from localStorage:", error);
    }
  }, []);

  const value = {
    reactionCache,
    getReaction,
    updateReaction,
    initializeReaction,
    syncReactionsFromPosts,
    clearReactionCache,
    isLoaded,
  };

  return (
    // @ts-ignore - Type assertion for context provider
    <ReactionContext.Provider value={value}>
      {children}
    </ReactionContext.Provider>
  );
};

/**
 * Custom hook to use ReactionContext
 */
export const useReactionContext = () => {
  const context = useContext(ReactionContext);
  if (!context) {
    throw new Error("useReactionContext must be used within ReactionProvider");
  }
  return context;
};

export default ReactionContext;
