/**
 * Hashtag Utilities for Frontend
 * Parse and process hashtags in post text
 */

/**
 * Parse text and return segments with hashtags marked
 * @param {string} text - Text containing hashtags
 * @returns {Array} Array of {text, isHashtag, hashtag} objects
 */
export const parseHashtags = (text) => {
  if (!text || typeof text !== "string") {
    return [{ text: "", isHashtag: false }];
  }

  // Regex to match hashtags
  const hashtagRegex = /(#[a-zA-Z_][a-zA-Z0-9_]*)/g;
  
  const segments = [];
  let lastIndex = 0;
  let match;

  while ((match = hashtagRegex.exec(text)) !== null) {
    // Add text before hashtag
    if (match.index > lastIndex) {
      segments.push({
        text: text.substring(lastIndex, match.index),
        isHashtag: false,
      });
    }

    // Add hashtag
    const fullHashtag = match[0]; // e.g., "#javascript"
    const hashtag = fullHashtag.substring(1); // Remove #
    
    segments.push({
      text: fullHashtag,
      isHashtag: true,
      hashtag: hashtag,
    });

    lastIndex = match.index + fullHashtag.length;
  }

  // Add remaining text after last hashtag
  if (lastIndex < text.length) {
    segments.push({
      text: text.substring(lastIndex),
      isHashtag: false,
    });
  }

  // If no hashtags found, return original text
  if (segments.length === 0) {
    segments.push({
      text: text,
      isHashtag: false,
    });
  }

  return segments;
};

/**
 * Extract just the hashtags from text
 * @param {string} text - Text containing hashtags
 * @returns {string[]} Array of hashtags (without # symbol)
 */
export const extractHashtags = (text) => {
  if (!text || typeof text !== "string") {
    return [];
  }

  const hashtagRegex = /#([a-zA-Z_][a-zA-Z0-9_]*)/g;
  const matches = text.match(hashtagRegex);

  if (!matches) {
    return [];
  }

  // Remove # symbol and get unique values
  const hashtags = matches.map(tag => tag.substring(1).toLowerCase());
  return [...new Set(hashtags)];
};

/**
 * Format hashtag for display
 * @param {string} hashtag - Hashtag with or without #
 * @returns {string} Hashtag with # prefix
 */
export const formatHashtag = (hashtag) => {
  if (!hashtag) return "";
  return hashtag.startsWith("#") ? hashtag : `#${hashtag}`;
};

/**
 * Validate hashtag format
 * @param {string} hashtag - Hashtag to validate
 * @returns {boolean} True if valid
 */
export const isValidHashtag = (hashtag) => {
  if (!hashtag || typeof hashtag !== "string") {
    return false;
  }

  const cleanTag = hashtag.startsWith("#") ? hashtag.substring(1) : hashtag;
  const hashtagPattern = /^[a-zA-Z_][a-zA-Z0-9_]{0,49}$/;
  
  return hashtagPattern.test(cleanTag);
};
