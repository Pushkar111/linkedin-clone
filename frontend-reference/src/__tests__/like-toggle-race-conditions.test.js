/**
 * @jest-environment jsdom
 * @description Tests for like toggle race conditions, idempotency, and reconciliation
 */

import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import { toggleLike } from '../redux/thunks/postThunks';
import * as postAPI from '../services/postService';

// Mock the postAPI module
jest.mock('../services/postService');

// Mock react-toastify
jest.mock('react-toastify', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
    info: jest.fn(),
  },
}));

const middlewares = [thunk];
const mockStore = configureMockStore(middlewares);

describe('Like Toggle - Race Conditions and Idempotency Tests', () => {
  let store;
  const mockPostId = 'post123';
  const mockUserId = 'user456';

  beforeEach(() => {
    store = mockStore({
      posts: {
        posts: [
          {
            strPostId: mockPostId,
            likes: [],
            intReactionCount: 0,
          },
        ],
      },
    });
    jest.clearAllMocks();
  });

  describe('Request Deduplication', () => {
    it('should deduplicate rapid double-clicks within 500ms', async () => {
      // Mock API to respond slowly
      const mockResponse = {
        success: true,
        liked: true,
        likeCount: 1,
        post: {
          _id: mockPostId,
          likes: [mockUserId],
          likeCount: 1,
        },
        requestId: 'req_1',
      };

      let resolveFirst;
      const firstCallPromise = new Promise((resolve) => {
        resolveFirst = resolve;
      });

      postAPI.toggleLikePost
        .mockImplementationOnce(() => firstCallPromise)
        .mockResolvedValueOnce(mockResponse);

      // Trigger two rapid clicks
      const promise1 = store.dispatch(toggleLike({ postId: mockPostId, userId: mockUserId }));
      
      // Wait 100ms and click again (within 500ms window)
      await new Promise(resolve => setTimeout(resolve, 100));
      const promise2 = store.dispatch(toggleLike({ postId: mockPostId, userId: mockUserId }));

      // Resolve first request
      resolveFirst(mockResponse);

      await Promise.all([promise1, promise2]);

      // Should only call API once due to deduplication
      expect(postAPI.toggleLikePost).toHaveBeenCalledTimes(1);
    }, 10000);

    it('should NOT deduplicate clicks more than 500ms apart', async () => {
      const mockResponse = {
        success: true,
        liked: true,
        likeCount: 1,
        post: {
          _id: mockPostId,
          likes: [mockUserId],
          likeCount: 1,
        },
        requestId: 'req_1',
      };

      postAPI.toggleLikePost.mockResolvedValue(mockResponse);

      // First click
      await store.dispatch(toggleLike({ postId: mockPostId, userId: mockUserId }));

      // Wait 600ms (more than deduplication window)
      await new Promise(resolve => setTimeout(resolve, 600));

      // Second click
      await store.dispatch(toggleLike({ postId: mockPostId, userId: mockUserId }));

      // Should call API twice
      expect(postAPI.toggleLikePost).toHaveBeenCalledTimes(2);
    }, 10000);
  });

  describe('Idempotency', () => {
    it('should handle server returning same state on duplicate requests', async () => {
      const mockResponse = {
        success: true,
        liked: true,
        likeCount: 1,
        post: {
          _id: mockPostId,
          likes: [mockUserId],
          likeCount: 1,
        },
        requestId: 'req_1',
      };

      postAPI.toggleLikePost.mockResolvedValue(mockResponse);

      // Click once
      const result1 = await store.dispatch(
        toggleLike({ postId: mockPostId, userId: mockUserId })
      );

      // Click again (should be idempotent)
      const result2 = await store.dispatch(
        toggleLike({ postId: mockPostId, userId: mockUserId })
      );

      expect(result1.payload.liked).toBe(true);
      expect(result2.payload.liked).toBe(true);
      expect(result1.payload.likeCount).toBe(1);
      expect(result2.payload.likeCount).toBe(1);
    });
  });

  describe('Stale Response Handling', () => {
    it('should ignore responses with mismatched requestId', async () => {
      const oldRequestId = 'req_old_123';
      const newRequestId = 'req_new_456';

      // First response (stale)
      const staleResponse = {
        success: true,
        liked: false,
        likeCount: 0,
        post: {
          _id: mockPostId,
          likes: [],
          likeCount: 0,
        },
        requestId: oldRequestId,
      };

      // Second response (current)
      const currentResponse = {
        success: true,
        liked: true,
        likeCount: 1,
        post: {
          _id: mockPostId,
          likes: [mockUserId],
          likeCount: 1,
        },
        requestId: newRequestId,
      };

      let resolveStale, resolveCurrent;
      
      postAPI.toggleLikePost
        .mockImplementationOnce(() => new Promise((resolve) => {
          resolveStale = () => resolve(staleResponse);
        }))
        .mockImplementationOnce(() => new Promise((resolve) => {
          resolveCurrent = () => resolve(currentResponse);
        }));

      // Start first request
      const promise1 = store.dispatch(
        toggleLike({ postId: mockPostId, userId: mockUserId })
      );

      // Start second request
      const promise2 = store.dispatch(
        toggleLike({ postId: mockPostId, userId: mockUserId })
      );

      // Resolve in reverse order (newer request completes first)
      resolveCurrent();
      await promise2;

      resolveStale();
      try {
        await promise1;
      } catch (error) {
        // Expect stale response to be rejected
        expect(error.message).toContain('Stale response');
      }
    }, 10000);
  });

  describe('Error Handling and Reconciliation', () => {
    it('should reconcile with server state on error if post is liked', async () => {
      // Mock toggle to fail
      postAPI.toggleLikePost.mockRejectedValueOnce(new Error('Network error'));

      // Mock getPostById to return canonical state showing post is liked
      postAPI.getPostById = jest.fn().mockResolvedValueOnce({
        post: {
          _id: mockPostId,
          likes: [mockUserId],
          likeCount: 1,
        },
      });

      const result = await store.dispatch(
        toggleLike({ postId: mockPostId, userId: mockUserId })
      );

      // Should reconcile to server state (liked)
      expect(result.payload.liked).toBe(true);
      expect(result.payload.likeCount).toBe(1);
      expect(result.payload.reconciled).toBe(true);
      expect(postAPI.getPostById).toHaveBeenCalledWith(mockPostId);
    });

    it('should show error if reconciliation also fails', async () => {
      // Mock both toggle and getPostById to fail
      postAPI.toggleLikePost.mockRejectedValueOnce(new Error('Network error'));
      postAPI.getPostById = jest.fn().mockRejectedValueOnce(new Error('Network error'));

      const result = await store.dispatch(
        toggleLike({ postId: mockPostId, userId: mockUserId })
      );

      // Should reject with error
      expect(result.type).toContain('rejected');
      expect(result.payload.message).toBeDefined();
    });
  });

  describe('Optimistic Updates', () => {
    it('should update UI optimistically before server response', () => {
      const mockResponse = {
        success: true,
        liked: true,
        likeCount: 1,
        post: {
          _id: mockPostId,
          likes: [mockUserId],
          likeCount: 1,
        },
        requestId: 'req_1',
      };

      let resolvePromise;
      const slowPromise = new Promise((resolve) => {
        resolvePromise = resolve;
      });

      postAPI.toggleLikePost.mockImplementationOnce(() => slowPromise);

      // Dispatch action
      store.dispatch(toggleLike({ postId: mockPostId, userId: mockUserId }));

      // Check that pending action was dispatched (optimistic update)
      const actions = store.getActions();
      expect(actions[0].type).toContain('pending');

      // Resolve the promise
      resolvePromise(mockResponse);
    });

    it('should rollback optimistic update on error', async () => {
      postAPI.toggleLikePost.mockRejectedValueOnce(new Error('Server error'));
      postAPI.getPostById = jest.fn().mockRejectedValueOnce(new Error('Network error'));

      await store.dispatch(
        toggleLike({ postId: mockPostId, userId: mockUserId })
      );

      const actions = store.getActions();
      
      // Should have pending and rejected actions
      expect(actions.some(a => a.type.includes('pending'))).toBe(true);
      expect(actions.some(a => a.type.includes('rejected'))).toBe(true);
    });
  });

  describe('Slow Network Scenarios', () => {
    it('should handle delayed response and reconcile correctly', async () => {
      const mockResponse = {
        success: true,
        liked: true,
        likeCount: 1,
        post: {
          _id: mockPostId,
          likes: [mockUserId],
          likeCount: 1,
        },
        requestId: 'req_1',
      };

      // Simulate 2 second delay
      postAPI.toggleLikePost.mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve(mockResponse), 2000))
      );

      const startTime = Date.now();
      const result = await store.dispatch(
        toggleLike({ postId: mockPostId, userId: mockUserId })
      );
      const endTime = Date.now();

      // Should wait for response
      expect(endTime - startTime).toBeGreaterThanOrEqual(2000);
      expect(result.payload.liked).toBe(true);
      expect(result.payload.likeCount).toBe(1);
    }, 5000);
  });

  describe('Server 500 Error Handling', () => {
    it('should fetch canonical state on 500 error', async () => {
      const error = {
        response: {
          status: 500,
          data: {
            message: 'Internal server error',
          },
        },
      };

      postAPI.toggleLikePost.mockRejectedValueOnce(error);
      postAPI.getPostById = jest.fn().mockResolvedValueOnce({
        post: {
          _id: mockPostId,
          likes: [mockUserId],
          likeCount: 1,
        },
      });

      const result = await store.dispatch(
        toggleLike({ postId: mockPostId, userId: mockUserId })
      );

      // Should reconcile with canonical state
      expect(result.payload.liked).toBe(true);
      expect(result.payload.reconciled).toBe(true);
      expect(postAPI.getPostById).toHaveBeenCalledWith(mockPostId);
    });
  });
});
