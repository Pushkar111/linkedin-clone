/**
 * ============================================================================
 * POST DETAIL PAGE - Single Post View
 * ============================================================================
 * 
 * Displays a single post with full details when navigated from:
 * - Notification click
 * - Profile post click
 * - Direct URL access
 * 
 * Features:
 * - Fetches post by ID from URL params
 * - Loading state with spinner
 * - Error handling with fallback UI
 * - Uses EnhancedPostCard for consistent rendering
 * - Back navigation support
 * 
 * @version 1.0.0
 */

import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { motion } from "framer-motion";
import { getPostById } from "../../services/postService";
import EnhancedPostCard from "../Profile/components/EnhancedPostCard";
import Loader from "../../components/Loader/Loader";

export default function PostDetailPage() {
  const { postId } = useParams();
  const navigate = useNavigate();
  const [post, setPost] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPost = async () => {
      if (!postId) {
        setError("Invalid post ID");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError("");
        
        console.log(`[PostDetailPage] Fetching post: ${postId}`);
        const response = await getPostById(postId);
        
        // Handle different response structures
        const postData = response?.post || response?.data || response;
        
        if (!postData || !postData._id) {
          throw new Error("Post not found or deleted");
        }
        
        console.log("[PostDetailPage] Post loaded successfully:", postData._id);
        setPost(postData);
      } catch (err) {
        console.error("❌ [PostDetailPage] Failed to fetch post:", err);
        setError(err.message || "Post not found or deleted");
      } finally {
        setLoading(false);
      }
    };

    fetchPost();
  }, [postId]);

  // Loading state
  if (loading) {
    return (
      <>
        <Helmet>
          <title>Loading Post... | LinkedIn</title>
        </Helmet>
        <Loader />
      </>
    );
  }

  // Error state
  if (error) {
    return (
      <>
        <Helmet>
          <title>Post Not Found | LinkedIn</title>
        </Helmet>
        <div className="min-h-screen bg-gray-100 flex items-center justify-center px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center"
          >
            <div className="mb-4">
              <i className="fas fa-exclamation-circle text-6xl text-red-500" />
            </div>
            <h2 className="text-2xl font-bold text-color-text-darker mb-2">
              Post Not Found
            </h2>
            <p className="text-color-text mb-6">
              {error}
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => navigate(-1)}
                className="px-4 py-2 text-color-button-blue hover:text-color-button-blue-darker font-medium transition-colors"
              >
                <i className="fas fa-arrow-left mr-2" />
                Go Back
              </button>
              <button
                onClick={() => navigate("/linkedin/feed")}
                className="px-4 py-2 bg-color-button-blue text-white rounded-full hover:bg-color-button-blue-darker transition-colors font-medium"
              >
                <i className="fas fa-home mr-2" />
                Go to Feed
              </button>
            </div>
          </motion.div>
        </div>
      </>
    );
  }

  // Success state - render post
  if (!post) {
    return (
      <>
        <Helmet>
          <title>Post Not Found | LinkedIn</title>
        </Helmet>
        <div className="min-h-screen bg-gray-100 flex items-center justify-center px-4">
          <div className="text-center text-color-text">
            <p>Post data is unavailable</p>
            <button
              onClick={() => navigate("/linkedin/feed")}
              className="mt-4 text-color-button-blue hover:text-color-button-blue-darker"
            >
              Return to Feed
            </button>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Helmet>
        <title>
          {post?.author?.fullName || post?.user?.fullName || "Post"} | LinkedIn
        </title>
      </Helmet>

      <div className="min-h-screen bg-gray-100 py-6">
        <div className="max-w-4xl mx-auto px-2 sm:px-4 lg:px-6 xl:px-8">
          {/* Back button */}
          <motion.button
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            onClick={() => navigate(-1)}
            className="mb-4 text-color-text hover:text-color-text-darker flex items-center gap-2 transition-colors"
          >
            <i className="fas fa-arrow-left" />
            <span className="font-medium">Back</span>
          </motion.button>

          {/* Post Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <EnhancedPostCard
              post={post}
              index={0}
              onPostDeleted={() => {
                // Navigate back to feed when post is deleted
                navigate("/linkedin/feed");
              }}
            />
          </motion.div>

          {/* Additional context or related posts could go here */}
        </div>
      </div>
    </>
  );
}
