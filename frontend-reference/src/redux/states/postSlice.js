import { createSlice } from "@reduxjs/toolkit";
import {
  fetchPosts,
  fetchPostById,
  fetchUserPosts,
  createTextPost,
  createPostWithImage,
  createPostWithImageBase64,
  updatePost,
  deletePost,
  toggleLike,
  toggleReaction,
  addComment,
  deleteComment,
} from "../thunks/postThunks";

const initialState = {
  posts: [],
  currentPost: null,
  userPosts: [],
  loading: false,
  error: null,
  pagination: {
    currentPage: 1,
    totalPages: 1,
    totalPosts: 0,
    hasMore: true,
  },
};

const postSlice = createSlice({
  name: "posts",
  initialState,
  reducers: {
    clearPosts: (state) => {
      state.posts = [];
      state.pagination = initialState.pagination;
    },
    clearError: (state) => {
      state.error = null;
    },
    addPostToFeed: (state, action) => {
      // Add new post to beginning of feed
      state.posts.unshift(action.payload);
    },
  },
  extraReducers: (builder) => {
    // Fetch Posts
    builder
      .addCase(fetchPosts.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPosts.fulfilled, (state, action) => {
        state.loading = false;
        const { posts, pagination } = action.payload;
        
        // Append posts for pagination
        if (pagination.currentPage === 1) {
          state.posts = posts;
        } else {
          state.posts = [...state.posts, ...posts];
        }
        
        state.pagination = {
          currentPage: pagination.currentPage,
          totalPages: pagination.totalPages,
          totalPosts: pagination.totalPosts,
          hasMore: pagination.currentPage < pagination.totalPages,
        };
      })
      .addCase(fetchPosts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // Fetch Single Post
    builder
      .addCase(fetchPostById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPostById.fulfilled, (state, action) => {
        state.loading = false;
        state.currentPost = action.payload;
      })
      .addCase(fetchPostById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // Fetch User Posts
    builder
      .addCase(fetchUserPosts.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUserPosts.fulfilled, (state, action) => {
        state.loading = false;
        state.userPosts = action.payload.posts;
      })
      .addCase(fetchUserPosts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // Create Text Post
    builder
      .addCase(createTextPost.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createTextPost.fulfilled, (state, action) => {
        state.loading = false;
        state.posts.unshift(action.payload);
      })
      .addCase(createTextPost.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // Create Post with Image
    builder
      .addCase(createPostWithImage.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createPostWithImage.fulfilled, (state, action) => {
        state.loading = false;
        state.posts.unshift(action.payload);
      })
      .addCase(createPostWithImage.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // Create Post with Base64 Image
    builder
      .addCase(createPostWithImageBase64.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createPostWithImageBase64.fulfilled, (state, action) => {
        state.loading = false;
        state.posts.unshift(action.payload);
      })
      .addCase(createPostWithImageBase64.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // Update Post
    builder
      .addCase(updatePost.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updatePost.fulfilled, (state, action) => {
        state.loading = false;
        const updatedPost = action.payload;
        const index = state.posts.findIndex(
          (post) => post.strPostId === updatedPost.strPostId
        );
        if (index !== -1) {
          state.posts[index] = updatedPost;
        }
      })
      .addCase(updatePost.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // Delete Post
    builder
      .addCase(deletePost.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deletePost.fulfilled, (state, action) => {
        state.loading = false;
        const postId = action.payload;
        state.posts = state.posts.filter((post) => post.strPostId !== postId);
        state.userPosts = state.userPosts.filter((post) => post.strPostId !== postId);
      })
      .addCase(deletePost.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // Toggle Like - with optimistic updates, reconciliation, and proper rollback
    builder
      .addCase(toggleLike.pending, (state, action) => {
        // Extract from action.meta.arg which is the object passed to thunk
        const { postId, userId } = action.meta.arg || {};
        
        if (!postId || !userId) {
          console.error("toggleLike.pending: Missing postId or userId", action.meta.arg);
          return;
        }
        
        // Optimistic update - toggle like immediately
        const postIndex = state.posts.findIndex((post) => post.strPostId === postId);
        if (postIndex !== -1) {
          const post = state.posts[postIndex];
          
          // Skip if already pending (debounce)
          if (post._isLikePending) {
            console.log(`[Redux] Like already pending for post ${postId}, ignoring`);
            return;
          }
          
          const currentLikes = post.likes || [];
          const isCurrentlyLiked = currentLikes.includes(userId);
          
          // Store original state for potential rollback
          post._originalLikes = [...currentLikes];
          post._originalCount = post.intReactionCount;
          post._originalLiked = isCurrentlyLiked;
          
          // Toggle optimistically
          if (isCurrentlyLiked) {
            // Unlike
            post.likes = currentLikes.filter(id => id !== userId);
            post.intReactionCount = Math.max(0, post.intReactionCount - 1);
          } else {
            // Like
            post.likes = [...currentLikes, userId];
            post.intReactionCount = post.intReactionCount + 1;
          }
          
          post._isLikePending = true;
        }
        
        // Update current post if it matches
        if (state.currentPost && state.currentPost.strPostId === postId) {
          if (state.currentPost._isLikePending) {
            console.log(`[Redux] Like already pending for current post ${postId}, ignoring`);
            return;
          }
          
          const currentLikes = state.currentPost.likes || [];
          const isCurrentlyLiked = currentLikes.includes(userId);
          
          state.currentPost._originalLikes = [...currentLikes];
          state.currentPost._originalCount = state.currentPost.intReactionCount;
          state.currentPost._originalLiked = isCurrentlyLiked;
          
          if (isCurrentlyLiked) {
            state.currentPost.likes = currentLikes.filter(id => id !== userId);
            state.currentPost.intReactionCount = Math.max(0, state.currentPost.intReactionCount - 1);
          } else {
            state.currentPost.likes = [...currentLikes, userId];
            state.currentPost.intReactionCount = state.currentPost.intReactionCount + 1;
          }
          
          state.currentPost._isLikePending = true;
        }
      })
      .addCase(toggleLike.fulfilled, (state, action) => {
        const { postId, post: updatedPost, reconciled } = action.payload;
        
        if (reconciled) {
          console.log(`[Redux] Reconciling post ${postId} with canonical server state`);
        }
        
        // Update in posts array with canonical server state
        const postIndex = state.posts.findIndex((post) => post.strPostId === postId);
        if (postIndex !== -1) {
          // Merge updated post data while preserving other fields
          state.posts[postIndex] = {
            ...state.posts[postIndex],
            ...updatedPost,
            intReactionCount: updatedPost.intReactionCount,
            likes: updatedPost.likes,
            _isLikePending: false,
            _originalLikes: undefined,
            _originalCount: undefined,
            _originalLiked: undefined,
          };
          
          console.log(`[Redux] Post ${postId} updated`, {
            likeCount: state.posts[postIndex].intReactionCount,
            likesLength: state.posts[postIndex].likes?.length,
          });
        }
        
        // Update current post if it matches
        if (state.currentPost && state.currentPost.strPostId === postId) {
          state.currentPost = {
            ...state.currentPost,
            ...updatedPost,
            intReactionCount: updatedPost.intReactionCount,
            likes: updatedPost.likes,
            _isLikePending: false,
            _originalLikes: undefined,
            _originalCount: undefined,
            _originalLiked: undefined,
          };
        }
      })
      .addCase(toggleLike.rejected, (state, action) => {
        // Extract postId from action.meta.arg
        const { postId } = action.meta.arg || {};
        
        if (!postId) {
          console.error("toggleLike.rejected: Missing postId", action.meta.arg);
          return;
        }
        
        console.log(`[Redux] Rolling back like for post ${postId}`);
        
        // Rollback optimistic update
        const postIndex = state.posts.findIndex((post) => post.strPostId === postId);
        if (postIndex !== -1) {
          const post = state.posts[postIndex];
          if (post._originalLikes !== undefined) {
            post.likes = post._originalLikes;
            post.intReactionCount = post._originalCount || 0;
            post._originalLikes = undefined;
            post._originalCount = undefined;
            post._originalLiked = undefined;
          }
          post._isLikePending = false;
        }
        
        // Rollback current post if it matches
        if (state.currentPost && state.currentPost.strPostId === postId) {
          if (state.currentPost._originalLikes !== undefined) {
            state.currentPost.likes = state.currentPost._originalLikes;
            state.currentPost.intReactionCount = state.currentPost._originalCount || 0;
            state.currentPost._originalLikes = undefined;
            state.currentPost._originalCount = undefined;
            state.currentPost._originalLiked = undefined;
          }
          state.currentPost._isLikePending = false;
        }
        
        state.error = action.payload;
      });

    // Toggle Reaction - LinkedIn-style multi-reactions with optimistic updates
    builder
      .addCase(toggleReaction.pending, (state, action) => {
        const { postId, userId, reactionType } = action.meta.arg || {};
        
        if (!postId || !userId || !reactionType) {
          console.error("toggleReaction.pending: Missing required params", action.meta.arg);
          return;
        }
        
        // Helper function to calculate optimistic reaction state
        const calculateOptimisticReaction = (reactions = []) => {
          const userReaction = reactions.find(r => r.user === userId);
          const isReacted = !!userReaction;
          const currentType = userReaction ? userReaction.type : null;
          const isSameReaction = currentType === reactionType;
          
          let newReactions;
          let newReacted;
          let newReactionType;
          
          if (isReacted && isSameReaction) {
            // Remove reaction (toggle off)
            newReactions = reactions.filter(r => r.user !== userId);
            newReacted = false;
            newReactionType = null;
          } else if (isReacted && !isSameReaction) {
            // Change reaction type
            newReactions = reactions.map(r => 
              r.user === userId ? { ...r, type: reactionType } : r
            );
            newReacted = true;
            newReactionType = reactionType;
          } else {
            // Add new reaction
            newReactions = [...reactions, { user: userId, type: reactionType }];
            newReacted = true;
            newReactionType = reactionType;
          }
          
          // Calculate reaction counts
          const reactionCounts = {};
          newReactions.forEach(r => {
            const type = r.type || "like";
            reactionCounts[type] = (reactionCounts[type] || 0) + 1;
          });
          
          return {
            reactions: newReactions,
            reactionCount: newReactions.length,
            reactionCounts,
            reacted: newReacted,
            reactionType: newReactionType,
          };
        };
        
        // Optimistic update for posts array
        const postIndex = state.posts.findIndex((post) => post.strPostId === postId);
        if (postIndex !== -1) {
          const post = state.posts[postIndex];
          
          // Skip if already pending
          if (post._isReactionPending) {
            console.log(`[Redux] Reaction already pending for post ${postId}, ignoring`);
            return;
          }
          
          // Store original state for rollback
          post._originalReactions = post.reactions ? [...post.reactions] : [];
          post._originalReactionCount = post.intReactionCount || 0;
          post._originalReactionCounts = post.reactionCounts ? { ...post.reactionCounts } : {};
          
          // Calculate and apply optimistic update
          const optimistic = calculateOptimisticReaction(post.reactions);
          post.reactions = optimistic.reactions;
          post.intReactionCount = optimistic.reactionCount;
          post.reactionCounts = optimistic.reactionCounts;
          post._isReactionPending = true;
        }
        
        // Optimistic update for current post
        if (state.currentPost && state.currentPost.strPostId === postId) {
          if (state.currentPost._isReactionPending) {
            console.log(`[Redux] Reaction already pending for current post ${postId}, ignoring`);
            return;
          }
          
          state.currentPost._originalReactions = state.currentPost.reactions ? [...state.currentPost.reactions] : [];
          state.currentPost._originalReactionCount = state.currentPost.intReactionCount || 0;
          state.currentPost._originalReactionCounts = state.currentPost.reactionCounts ? { ...state.currentPost.reactionCounts } : {};
          
          const optimistic = calculateOptimisticReaction(state.currentPost.reactions);
          state.currentPost.reactions = optimistic.reactions;
          state.currentPost.intReactionCount = optimistic.reactionCount;
          state.currentPost.reactionCounts = optimistic.reactionCounts;
          state.currentPost._isReactionPending = true;
        }
      })
      .addCase(toggleReaction.fulfilled, (state, action) => {
        const { postId, post: updatedPost, reconciled } = action.payload;
        
        if (reconciled) {
          console.log(`[Redux] Reconciling post ${postId} with canonical server state (reactions)`);
        }
        
        // Update in posts array with canonical server state
        const postIndex = state.posts.findIndex((post) => post.strPostId === postId);
        if (postIndex !== -1) {
          state.posts[postIndex] = {
            ...state.posts[postIndex],
            ...updatedPost,
            _isReactionPending: false,
            _originalReactions: undefined,
            _originalReactionCount: undefined,
            _originalReactionCounts: undefined,
          };
        }
        
        // Update current post with canonical server state
        if (state.currentPost && state.currentPost.strPostId === postId) {
          state.currentPost = {
            ...state.currentPost,
            ...updatedPost,
            _isReactionPending: false,
            _originalReactions: undefined,
            _originalReactionCount: undefined,
            _originalReactionCounts: undefined,
          };
        }
      })
      .addCase(toggleReaction.rejected, (state, action) => {
        const { postId } = action.meta.arg || {};
        
        if (!postId) {
          console.error("toggleReaction.rejected: Missing postId", action.meta.arg);
          return;
        }
        
        console.log(`[Redux] Rolling back reaction for post ${postId}`);
        
        // Rollback optimistic update in posts array
        const postIndex = state.posts.findIndex((post) => post.strPostId === postId);
        if (postIndex !== -1) {
          const post = state.posts[postIndex];
          if (post._originalReactions !== undefined) {
            post.reactions = post._originalReactions;
            post.intReactionCount = post._originalReactionCount || 0;
            post.reactionCounts = post._originalReactionCounts || {};
            post._originalReactions = undefined;
            post._originalReactionCount = undefined;
            post._originalReactionCounts = undefined;
          }
          post._isReactionPending = false;
        }
        
        // Rollback current post
        if (state.currentPost && state.currentPost.strPostId === postId) {
          if (state.currentPost._originalReactions !== undefined) {
            state.currentPost.reactions = state.currentPost._originalReactions;
            state.currentPost.intReactionCount = state.currentPost._originalReactionCount || 0;
            state.currentPost.reactionCounts = state.currentPost._originalReactionCounts || {};
            state.currentPost._originalReactions = undefined;
            state.currentPost._originalReactionCount = undefined;
            state.currentPost._originalReactionCounts = undefined;
          }
          state.currentPost._isReactionPending = false;
        }
        
        state.error = action.payload;
      });

    // Add Comment
    builder
      .addCase(addComment.fulfilled, (state, action) => {
        const { postId /*, comment */ } = action.payload;
        
        // Update comment count in posts array
        const postIndex = state.posts.findIndex((post) => post.strPostId === postId);
        if (postIndex !== -1) {
          state.posts[postIndex].intCommentCount += 1;
        }
        
        // Update current post if it matches
        if (state.currentPost && state.currentPost.strPostId === postId) {
          state.currentPost.intCommentCount += 1;
        }
      })
      .addCase(addComment.rejected, (state, action) => {
        state.error = action.payload;
      });

    // Delete Comment
    builder
      .addCase(deleteComment.fulfilled, (state, action) => {
        const { postId } = action.payload;
        
        // Update comment count in posts array
        const postIndex = state.posts.findIndex((post) => post.strPostId === postId);
        if (postIndex !== -1) {
          state.posts[postIndex].intCommentCount -= 1;
        }
        
        // Update current post if it matches
        if (state.currentPost && state.currentPost.strPostId === postId) {
          state.currentPost.intCommentCount -= 1;
        }
      })
      .addCase(deleteComment.rejected, (state, action) => {
        state.error = action.payload;
      });
  },
});

export const { clearPosts, clearError: clearPostError, addPostToFeed } = postSlice.actions;
export default postSlice.reducer;
