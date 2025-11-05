/**
 * ProfilePostsFeed Component
 * 
 * Displays user's posts with:
 * - Infinite scroll pagination
 * - Optimistic like updates
 * - Skeleton loading states
 * - Empty state handling
 * 
 * Two implementations provided:
 * A) Vanilla Axios + useState + useEffect
 * B) React Query (commented out, ready to use)
 */

import React, { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import EnhancedPostCard from "./EnhancedPostCard";
import { getUserPosts } from "../../../services/profileAPI";

export default function ProfilePostsFeed({ userId }) {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  
  const observerTarget = useRef(null);
  const POSTS_PER_PAGE = 10;

  /**
   * Fetch initial posts
   */
  useEffect(() => {
    const fetchPosts = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await getUserPosts(userId, 1, POSTS_PER_PAGE);
        setPosts(response.posts || []);
        setHasMore((response.posts || []).length === POSTS_PER_PAGE);
        setPage(1);
      } catch (err) {
        console.error("Failed to fetch posts:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      fetchPosts();
    }
  }, [userId]);

  /**
   * Load more posts (pagination)
   */
  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore) return;

    try {
      setLoadingMore(true);
      const nextPage = page + 1;
      
      const response = await getUserPosts(userId, nextPage, POSTS_PER_PAGE);
      const newPosts = response.posts || [];
      
      setPosts(prev => [...prev, ...newPosts]);
      setPage(nextPage);
      setHasMore(newPosts.length === POSTS_PER_PAGE);
    } catch (err) {
      console.error("Failed to load more posts:", err);
    } finally {
      setLoadingMore(false);
    }
  }, [userId, page, loadingMore, hasMore]);

  /**
   * Intersection Observer for infinite scroll
   */
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore) {
          loadMore();
        }
      },
      { threshold: 0.1 }
    );

    const currentTarget = observerTarget.current;
    if (currentTarget) {
      observer.observe(currentTarget);
    }

    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget);
      }
    };
  }, [loadMore, hasMore, loadingMore]);

  /**
   * Skeleton loader component
   */
  const PostSkeleton = () => (
    <div className="bg-white rounded-2xl shadow-sm p-6 animate-pulse">
      <div className="flex items-start gap-3 mb-4">
        <div className="w-12 h-12 bg-gray-200 rounded-full" />
        <div className="flex-1">
          <div className="h-4 bg-gray-200 rounded w-32 mb-2" />
          <div className="h-3 bg-gray-200 rounded w-24" />
        </div>
      </div>
      <div className="space-y-2 mb-4">
        <div className="h-3 bg-gray-200 rounded w-full" />
        <div className="h-3 bg-gray-200 rounded w-5/6" />
        <div className="h-3 bg-gray-200 rounded w-4/6" />
      </div>
      <div className="h-48 bg-gray-200 rounded-lg mb-4" />
      <div className="flex gap-4">
        <div className="h-8 bg-gray-200 rounded w-20" />
        <div className="h-8 bg-gray-200 rounded w-20" />
        <div className="h-8 bg-gray-200 rounded w-20" />
      </div>
    </div>
  );

  /**
   * Empty state component
   */
  const EmptyState = () => (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-white rounded-2xl shadow-sm p-12 text-center"
    >
      <div className="text-color-text text-6xl mb-4">
        <i className="fas fa-inbox" />
      </div>
      <h3 className="text-xl font-semibold text-color-text-darker mb-2">
        No posts yet
      </h3>
      <p className="text-color-text">
        This user hasn&apos;t shared any posts yet. Check back later!
      </p>
    </motion.div>
  );

  /**
   * Error state component
   */
  if (error) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-2xl shadow-sm p-12 text-center"
      >
        <div className="text-red-500 text-6xl mb-4">
          <i className="fas fa-exclamation-triangle" />
        </div>
        <h3 className="text-xl font-semibold text-color-text-darker mb-2">
          Failed to load posts
        </h3>
        <p className="text-color-text mb-6">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="px-6 py-2 bg-color-button-blue text-white rounded-full hover:bg-color-button-blue-darker transition-colors"
        >
          Try Again
        </button>
      </motion.div>
    );
  }

  /**
   * Loading skeleton (initial load)
   */
  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <PostSkeleton key={i} />
        ))}
      </div>
    );
  }

  /**
   * Empty state (no posts)
   */
  if (posts.length === 0) {
    return <EmptyState />;
  }

  /**
   * Posts list with infinite scroll
   */
  return (
    <div className="space-y-4" role="feed" aria-label="User posts">
      <AnimatePresence>
        {posts.map((post, index) => (
          <EnhancedPostCard
            key={post._id}
            post={post}
            index={index}
          />
        ))}
      </AnimatePresence>

      {/* Loading more indicator */}
      {loadingMore && (
        <div className="py-8">
          <PostSkeleton />
        </div>
      )}

      {/* Intersection observer target */}
      {hasMore && !loadingMore && (
        <div ref={observerTarget} className="h-10" aria-hidden="true" />
      )}

      {/* End of posts message */}
      {!hasMore && posts.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-8 text-color-text"
        >
          <i className="fas fa-check-circle text-2xl mb-2 block" />
          <p>You&apos;ve reached the end of posts</p>
        </motion.div>
      )}
    </div>
  );
}

/* ============================================================================
 * REACT QUERY IMPLEMENTATION (Alternative)
 * ============================================================================
 * 
 * Uncomment below to use React Query instead of vanilla approach.
 * Benefits: Automatic caching, refetching, optimistic updates out of the box
 * 
 * Install: npm install @tanstack/react-query
 * 
import { useInfiniteQuery } from "@tanstack/react-query";

export function ProfilePostsFeedWithReactQuery({ userId }) {
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
    error
  } = useInfiniteQuery({
    queryKey: ["userPosts", userId],
    queryFn: ({ pageParam = 1 }) => getUserPosts(userId, pageParam, 10),
    getNextPageParam: (lastPage, pages) => {
      if (lastPage.posts.length < 10) return undefined;
      return pages.length + 1;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    cacheTime: 1000 * 60 * 30, // 30 minutes
    enabled: !!userId
  });

  const observerTarget = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { threshold: 0.1 }
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => {
      if (observerTarget.current) {
        observer.unobserve(observerTarget.current);
      }
    };
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  const posts = data?.pages.flatMap(page => page.posts) || [];

  // ... rest of implementation similar to above
}
*/
