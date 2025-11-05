/**
 * Hashtag Utilities
 * Functions to extract and process hashtags from text
 */

/**
 * Extract hashtags from text
 * @param {string} text - Text containing potential hashtags
 * @returns {string[]} Array of unique hashtags (lowercase, without # symbol)
 */
export const extractHashtags = (text) => {
  if (!text || typeof text !== 'string') {
    return [];
  }

  // Match hashtags: # followed by letters, numbers, underscores
  // Must start with a letter or underscore, not a number
  const hashtagRegex = /#([a-zA-Z_][a-zA-Z0-9_]*)/g;
  
  const matches = text.match(hashtagRegex);
  
  if (!matches) {
    return [];
  }

  // Remove # symbol, convert to lowercase, and get unique values
  const hashtags = matches.map(tag => tag.substring(1).toLowerCase());
  
  // Remove duplicates using Set
  const uniqueHashtags = [...new Set(hashtags)];
  
  // Filter out very long hashtags (limit to 50 characters)
  return uniqueHashtags.filter(tag => tag.length <= 50);
};

/**
 * Format hashtag for display (add # prefix)
 * @param {string} hashtag - Hashtag without # symbol
 * @returns {string} Hashtag with # prefix
 */
export const formatHashtag = (hashtag) => {
  if (!hashtag) return '';
  return hashtag.startsWith('#') ? hashtag : `#${hashtag}`;
};

/**
 * Validate hashtag format
 * @param {string} hashtag - Hashtag to validate
 * @returns {boolean} True if valid hashtag format
 */
export const isValidHashtag = (hashtag) => {
  if (!hashtag || typeof hashtag !== 'string') {
    return false;
  }

  // Remove # if present
  const cleanTag = hashtag.startsWith('#') ? hashtag.substring(1) : hashtag;
  
  // Must start with letter or underscore, followed by letters, numbers, underscores
  // Length between 1 and 50 characters
  const hashtagPattern = /^[a-zA-Z_][a-zA-Z0-9_]{0,49}$/;
  
  return hashtagPattern.test(cleanTag);
};

/**
 * Get trending hashtags from posts
 * @param {Array} posts - Array of post objects with hashtags
 * @param {number} limit - Number of trending hashtags to return
 * @returns {Array} Array of {hashtag, count} objects sorted by count
 */
export const getTrendingHashtags = (posts, limit = 10) => {
  if (!Array.isArray(posts) || posts.length === 0) {
    return [];
  }

  // Count occurrences of each hashtag
  const hashtagCounts = {};
  
  posts.forEach(post => {
    if (post.hashtags && Array.isArray(post.hashtags)) {
      post.hashtags.forEach(tag => {
        hashtagCounts[tag] = (hashtagCounts[tag] || 0) + 1;
      });
    }
  });

  // Convert to array and sort by count
  const trending = Object.entries(hashtagCounts)
    .map(([hashtag, count]) => ({ hashtag, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);

  return trending;
};
