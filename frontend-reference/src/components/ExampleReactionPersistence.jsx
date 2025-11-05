/**
 * Example: Using Enhanced ReactionContext with Persistence
 * 
 * This example shows how components automatically benefit from
 * reaction persistence across page refreshes.
 */

import React, { useEffect } from 'react';
import { useReactionContext } from '../contexts/ReactionContext';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

/**
 * Example Post Component
 * Shows how reactions automatically persist
 */
const ExamplePost = ({ post }) => {
  const { getReaction, updateReaction, initializeReaction } = useReactionContext();
  
  // Get current user
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
  const userId = currentUser._id;

  // Initialize reaction state when post loads
  useEffect(() => {
    if (post && post._id) {
      // Option 1: Use currentUserReaction from API (recommended)
      if (post.currentUserReaction !== undefined) {
        initializeReaction(post._id, {
          reactionType: post.currentUserReaction,
          hasReacted: !!post.currentUserReaction,
          reactionCount: post.reactionCount || 0,
          reactionCounts: post.reactionCounts || {},
        });
      }
      
      // Option 2: Use reactions array (fallback)
      else if (post.reactions && userId) {
        const userReaction = post.reactions.find(
          r => r.user === userId || r.user?._id === userId
        );
        initializeReaction(post._id, {
          reactionType: userReaction?.type || null,
          hasReacted: !!userReaction,
          reactionCount: post.reactionCount || post.reactions.length,
          reactionCounts: calculateReactionCounts(post.reactions),
        });
      }
    }
  }, [post, userId, initializeReaction]);

  // Get current reaction state from context
  const reactionState = getReaction(post._id) || {
    reactionType: null,
    hasReacted: false,
    reactionCount: 0,
  };

  // Handle reaction click
  const handleReact = async (reactionType) => {
    if (!userId) {
      alert('Please login to react');
      return;
    }

    await updateReaction(post._id, reactionType, userId);
  };

  // Render reaction buttons
  const reactions = [
    { type: 'like', emoji: '👍', label: 'Like' },
    { type: 'celebrate', emoji: '🎉', label: 'Celebrate' },
    { type: 'support', emoji: '💪', label: 'Support' },
    { type: 'love', emoji: '❤️', label: 'Love' },
    { type: 'insightful', emoji: '💡', label: 'Insightful' },
  ];

  return (
    <div className="post-card">
      {/* Post Content */}
      <div className="post-content">
        <p>{post.text}</p>
      </div>

      {/* Reaction Buttons */}
      <div className="reaction-buttons">
        {reactions.map(({ type, emoji, label }) => {
          const isActive = reactionState.reactionType === type;
          
          return (
            <button
              key={type}
              onClick={() => handleReact(type)}
              className={`reaction-btn ${isActive ? 'active' : ''}`}
              title={label}
            >
              <span className="emoji">{emoji}</span>
              <span className="label">{label}</span>
            </button>
          );
        })}
      </div>

      {/* Reaction Count */}
      <div className="reaction-count">
        {reactionState.reactionCount > 0 && (
          <span>{reactionState.reactionCount} reactions</span>
        )}
      </div>

      {/* Debug Info (remove in production) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="debug-info" style={{ fontSize: '10px', color: '#666', marginTop: '10px' }}>
          <details>
            <summary>Debug: Reaction State</summary>
            <pre>{JSON.stringify(reactionState, null, 2)}</pre>
          </details>
        </div>
      )}
    </div>
  );
};

/**
 * Helper: Calculate reaction counts from reactions array
 */
function calculateReactionCounts(reactions) {
  const counts = {};
  if (reactions && Array.isArray(reactions)) {
    reactions.forEach(reaction => {
      const type = reaction.type || 'like';
      counts[type] = (counts[type] || 0) + 1;
    });
  }
  return counts;
}

/**
 * Example Feed Page
 * Shows how reactions persist across page refreshes
 */
const ExampleFeedPage = () => {
  const { isLoaded, reactionCache } = useReactionContext();
  const [posts, setPosts] = React.useState([]);
  const [loading, setLoading] = React.useState(true);

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get(`${API_URL}/posts`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });

        if (response.data.success) {
          setPosts(response.data.posts);
        }
      } catch (error) {
        console.error('Failed to fetch posts:', error);
      } finally {
        setLoading(false);
      }
    };

    // Wait for reactions to load before fetching posts
    if (isLoaded) {
      fetchPosts();
    }
  }, [isLoaded]);

  if (!isLoaded) {
    return <div>Loading reactions...</div>;
  }

  if (loading) {
    return <div>Loading posts...</div>;
  }

  return (
    <div className="feed-page">
      <h1>Feed</h1>
      
      {/* Debug: Show loaded reactions */}
      {process.env.NODE_ENV === 'development' && (
        <div className="debug-panel" style={{ background: '#f0f0f0', padding: '10px', marginBottom: '20px' }}>
          <strong>Loaded Reactions:</strong> {Object.keys(reactionCache).length}
          <details>
            <summary>View All</summary>
            <pre style={{ fontSize: '10px' }}>
              {JSON.stringify(reactionCache, null, 2)}
            </pre>
          </details>
        </div>
      )}

      {/* Render posts */}
      <div className="posts-list">
        {posts.map(post => (
          <ExamplePost key={post._id} post={post} />
        ))}
      </div>
    </div>
  );
};

/**
 * Example: Testing Persistence
 * 
 * Steps to test:
 * 1. Login to the app
 * 2. React to several posts
 * 3. Refresh the page (F5)
 * 4. Navigate to different pages (Feed → Profile → Post Detail)
 * 5. Verify reactions remain consistent everywhere
 * 
 * What happens behind the scenes:
 * 1. On page load → ReactionProvider fetches GET /api/posts/reactions/me
 * 2. All user reactions loaded into reactionCache
 * 3. When posts are fetched → they include currentUserReaction field
 * 4. Components read from reactionCache → show correct state
 * 5. User clicks reaction → optimistic update + API call
 * 6. State synced with backend → persisted in database
 */

export { ExamplePost, ExampleFeedPage };
