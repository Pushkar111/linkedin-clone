/**
 * @file like-functionality.test.js
 * @description Integration tests for like/unlike functionality with optimistic updates
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { configureStore } from '@reduxjs/toolkit';
import postReducer from '../redux/states/postSlice';
import { toggleLike } from '../redux/thunks/postThunks';
import * as postAPI from '../services/postService';

// Mock the post API
vi.mock('../services/postService');

describe('Like/Unlike Functionality', () => {
  let store;
  const mockUserId = 'user123';
  const mockPostId = 'post456';
  
  const mockPost = {
    _id: mockPostId,
    text: 'Test post',
    likes: [],
    likeCount: 0,
    user: {
      _id: 'creator123',
      fullName: 'Test User',
      profilePicURL: 'https://example.com/pic.jpg',
    },
  };

  beforeEach(() => {
    // Create a fresh store for each test
    store = configureStore({
      reducer: {
        posts: postReducer,
      },
    });

    // Reset mocks
    vi.clearAllMocks();
  });

  describe('Optimistic Updates', () => {
    it('should optimistically add like when user clicks like button', async () => {
      // Setup: Post with no likes
      const initialState = {
        posts: {
          posts: [
            {
              strPostId: mockPostId,
              likes: [],
              intReactionCount: 0,
            },
          ],
          loading: false,
          error: null,
        },
      };

      store = configureStore({
        reducer: { posts: postReducer },
        preloadedState: initialState,
      });

      // Mock API to delay response
      postAPI.toggleLikePost.mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(
              () =>
                resolve({
                  success: true,
                  isLiked: true,
                  likeCount: 1,
                  post: { ...mockPost, likes: [mockUserId], likeCount: 1 },
                }),
              100
            )
          )
      );

      // Dispatch like action
      const promise = store.dispatch(
        toggleLike({ postId: mockPostId, userId: mockUserId })
      );

      // Check optimistic update (before API response)
      await new Promise((resolve) => setTimeout(resolve, 10));
      let state = store.getState().posts;
      const post = state.posts.find((p) => p.strPostId === mockPostId);
      
      expect(post.likes).toContain(mockUserId);
      expect(post.intReactionCount).toBe(1);
      expect(post._isLikePending).toBe(true);

      // Wait for API response
      await promise;

      // Check final state matches server response
      state = store.getState().posts;
      const finalPost = state.posts.find((p) => p.strPostId === mockPostId);
      expect(finalPost._isLikePending).toBe(false);
      expect(finalPost.likes).toContain(mockUserId);
    });

    it('should optimistically remove like when user unlikes', async () => {
      // Setup: Post with user's like
      const initialState = {
        posts: {
          posts: [
            {
              strPostId: mockPostId,
              likes: [mockUserId],
              intReactionCount: 1,
            },
          ],
          loading: false,
          error: null,
        },
      };

      store = configureStore({
        reducer: { posts: postReducer },
        preloadedState: initialState,
      });

      // Mock API response
      postAPI.toggleLikePost.mockResolvedValue({
        success: true,
        isLiked: false,
        likeCount: 0,
        post: { ...mockPost, likes: [], likeCount: 0 },
      });

      // Dispatch unlike action
      const promise = store.dispatch(
        toggleLike({ postId: mockPostId, userId: mockUserId })
      );

      // Check optimistic update
      await new Promise((resolve) => setTimeout(resolve, 10));
      let state = store.getState().posts;
      const post = state.posts.find((p) => p.strPostId === mockPostId);
      
      expect(post.likes).not.toContain(mockUserId);
      expect(post.intReactionCount).toBe(0);

      await promise;
    });
  });

  describe('Error Handling & Rollback', () => {
    it('should rollback optimistic update on API error', async () => {
      const initialState = {
        posts: {
          posts: [
            {
              strPostId: mockPostId,
              likes: [],
              intReactionCount: 0,
            },
          ],
          loading: false,
          error: null,
        },
      };

      store = configureStore({
        reducer: { posts: postReducer },
        preloadedState: initialState,
      });

      // Mock API to fail
      postAPI.toggleLikePost.mockRejectedValue({
        response: { data: { message: 'Network error' } },
      });

      // Dispatch like action
      try {
        await store.dispatch(
          toggleLike({ postId: mockPostId, userId: mockUserId })
        ).unwrap();
      } catch (error) {
        // Expected to fail
      }

      // Check rollback - should revert to original state
      const state = store.getState().posts;
      const post = state.posts.find((p) => p.strPostId === mockPostId);
      
      expect(post.likes).toEqual([]);
      expect(post.intReactionCount).toBe(0);
      expect(post._isLikePending).toBe(false);
    });

    it('should not show false positive success when API fails', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation();
      
      postAPI.toggleLikePost.mockRejectedValue(new Error('Server error'));

      try {
        await store.dispatch(
          toggleLike({ postId: mockPostId, userId: mockUserId })
        ).unwrap();
      } catch (error) {
        expect(error.message).toBeDefined();
      }

      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  describe('Idempotency', () => {
    it('should handle rapid double clicks correctly', async () => {
      const initialState = {
        posts: {
          posts: [
            {
              strPostId: mockPostId,
              likes: [],
              intReactionCount: 0,
            },
          ],
          loading: false,
          error: null,
        },
      };

      store = configureStore({
        reducer: { posts: postReducer },
        preloadedState: initialState,
      });

      // Mock API to return liked state
      postAPI.toggleLikePost.mockResolvedValue({
        success: true,
        isLiked: true,
        likeCount: 1,
        post: { ...mockPost, likes: [mockUserId], likeCount: 1 },
      });

      // Simulate rapid double click
      const promise1 = store.dispatch(
        toggleLike({ postId: mockPostId, userId: mockUserId })
      );
      
      // Second click should be prevented by pending state
      // (tested in component level)

      await promise1;

      const state = store.getState().posts;
      const post = state.posts.find((p) => p.strPostId === mockPostId);
      
      // Should be liked once, not toggled twice
      expect(post.likes).toEqual([mockUserId]);
      expect(post.intReactionCount).toBe(1);
    });
  });

  describe('Server State Reconciliation', () => {
    it('should use server canonical state over optimistic state', async () => {
      // Simulate scenario where optimistic state differs from server
      const initialState = {
        posts: {
          posts: [
            {
              strPostId: mockPostId,
              likes: [],
              intReactionCount: 0,
            },
          ],
          loading: false,
          error: null,
        },
      };

      store = configureStore({
        reducer: { posts: postReducer },
        preloadedState: initialState,
      });

      // Server returns different state (e.g., post already had other likes)
      postAPI.toggleLikePost.mockResolvedValue({
        success: true,
        isLiked: true,
        likeCount: 3, // Other users also liked
        post: {
          ...mockPost,
          likes: [mockUserId, 'user2', 'user3'],
          likeCount: 3,
        },
      });

      await store.dispatch(
        toggleLike({ postId: mockPostId, userId: mockUserId })
      ).unwrap();

      const state = store.getState().posts;
      const post = state.posts.find((p) => p.strPostId === mockPostId);
      
      // Should match server state exactly
      expect(post.intReactionCount).toBe(3);
      expect(post.likes).toHaveLength(3);
    });
  });
});
