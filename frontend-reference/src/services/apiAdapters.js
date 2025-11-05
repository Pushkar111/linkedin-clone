/**
 * @module apiAdapters
 * @description Adapters to transform REST API responses to match frontend data models
 */

/**
 * Transform API user response to frontend User model
 * @param {Object} apiUser - User object from API
 * @returns {Object} Formatted user object for frontend
 */
export const adaptUserFromAPI = (apiUser) => {
  if (!apiUser) return null;

  return {
    strUserId: apiUser._id,
    strEmail: apiUser.email,
    strFullName: apiUser.fullName,
    strAuthMethod: apiUser.authMethod,
    strProfilePicURL: apiUser.profilePicURL || "",
    dtCreatedOn: new Date(apiUser.createdAt),
    booActive: apiUser.active !== false,
    objProfile: apiUser.profile ? adaptProfileFromAPI(apiUser.profile, apiUser) : null,
  };
};

/**
 * Transform API profile data to frontend Profile model
 * @param {Object} apiProfile - Profile object from API
 * @param {Object} apiUser - Parent user object from API
 * @returns {Object} Formatted profile object for frontend
 */
export const adaptProfileFromAPI = (apiProfile, apiUser) => {
  if (!apiProfile) return null;

  return {
    strProfileId: `${apiUser._id}-en`, // Composite ID (userId-languageId)
    booPrimary: true, // Backend has single profile, always primary
    arrSections: apiProfile.sections || [],
    strAbout: apiProfile.about || "",
    objIntro: {
      strFirstName: apiProfile.firstName || "",
      strLastName: apiProfile.lastName || "",
      strHeadline: apiProfile.headline || "",
      strCountryLoc: apiProfile.countryLoc || "",
      strPostalCodeLoc: apiProfile.postalCodeLoc || "",
    },
    strProfilePicURL: apiUser.profilePicURL || "",
    strBgPicPath: apiProfile.backgroundPicURL || "",
    dtCreatedOn: new Date(apiUser.createdAt),
    booActive: apiUser.active !== false,
    strUserId: apiUser._id,
  };
};

/**
 * Transform API post response to frontend Post model
 * @param {Object} apiPost - Post object from API
 * @returns {Object} Formatted post object for frontend
 */
export const adaptPostFromAPI = (apiPost) => {
  if (!apiPost) return null;

  // Handle user data - could be populated or just an ID
  let adaptedUser = null;
  let userProfile = null;
  
  if (apiPost.user && typeof apiPost.user === "object") {
    // User is populated - create adapted user and profile
    adaptedUser = {
      strUserId: apiPost.user._id,
      strEmail: apiPost.user.email || "",
      strFullName: apiPost.user.fullName || "",
      strAuthMethod: apiPost.user.authMethod || "email-password",
      strProfilePicURL: apiPost.user.profilePicURL || "",
      dtCreatedOn: apiPost.user.createdAt ? new Date(apiPost.user.createdAt) : new Date(),
      booActive: apiPost.user.active !== false,
      objProfile: null, // Will set below
    };

    // Create profile object from user data
    userProfile = {
      strProfileId: `${apiPost.user._id}-en`,
      booPrimary: true,
      arrSections: apiPost.user.profile?.sections || [],
      strAbout: apiPost.user.profile?.about || "",
      objIntro: {
        strFirstName: apiPost.user.profile?.firstName || apiPost.user.fullName?.split(" ")[0] || "",
        strLastName: apiPost.user.profile?.lastName || apiPost.user.fullName?.split(" ").slice(1).join(" ") || "",
        strHeadline: apiPost.user.profile?.headline || "",
        strCountryLoc: apiPost.user.profile?.countryLoc || "",
        strPostalCodeLoc: apiPost.user.profile?.postalCodeLoc || "",
      },
      strProfilePicURL: apiPost.user.profilePicURL || "",
      strBgPicPath: apiPost.user.profile?.backgroundPicURL || "",
      dtCreatedOn: apiPost.user.createdAt ? new Date(apiPost.user.createdAt) : new Date(),
      booActive: apiPost.user.active !== false,
      strUserId: apiPost.user._id,
    };

    adaptedUser.objProfile = userProfile;
  }

  return {
    strPostId: apiPost._id,
    strUserId: typeof apiPost.user === "object" ? apiPost.user._id : apiPost.user,
    strText: apiPost.text || "",
    intViewCount: apiPost.viewCount || 0,
    intReactionCount: apiPost.reactionCount || apiPost.likeCount || apiPost.likes?.length || 0,
    intCommentCount: apiPost.commentCount || apiPost.comments?.length || 0,
    strMediaType: apiPost.mediaType || "none",
    strMediaURL: apiPost.mediaURL || "",
    dtCreatedOn: new Date(apiPost.createdAt),
    booActive: apiPost.active !== false,
    // Additional data for enhanced features
    likes: (apiPost.likes || []).map(id => typeof id === "object" ? id.toString() : id), // Ensure likes are strings
    comments: apiPost.comments || [],
    user: adaptedUser,
    objProfile: userProfile, // Add profile directly for backward compatibility
    // Multi-reaction system fields
    reactions: apiPost.reactions || [],
    reactionCount: apiPost.reactionCount || apiPost.reactions?.length || 0,
    reactionCounts: apiPost.reactionCounts || {},
  };
};

/**
 * Transform multiple posts from API
 * @param {Array} apiPosts - Array of post objects from API
 * @returns {Array} Array of formatted post objects
 */
export const adaptPostsFromAPI = (apiPosts) => {
  if (!Array.isArray(apiPosts)) return [];
  return apiPosts.map(adaptPostFromAPI);
};

/**
 * Transform multiple users from API
 * @param {Array} apiUsers - Array of user objects from API
 * @returns {Array} Array of formatted user objects
 */
export const adaptUsersFromAPI = (apiUsers) => {
  if (!Array.isArray(apiUsers)) return [];
  return apiUsers.map(adaptUserFromAPI);
};

/**
 * Transform frontend user data to API format for updates
 * @param {Object} frontendProfile - Profile object from frontend
 * @returns {Object} Formatted profile data for API
 */
export const adaptProfileToAPI = (frontendProfile) => {
  return {
    firstName: frontendProfile.objIntro?.strFirstName || "",
    lastName: frontendProfile.objIntro?.strLastName || "",
    headline: frontendProfile.objIntro?.strHeadline || "",
    about: frontendProfile.strAbout || "",
    countryLoc: frontendProfile.objIntro?.strCountryLoc || "",
    postalCodeLoc: frontendProfile.objIntro?.strPostalCodeLoc || "",
    sections: frontendProfile.arrSections || [],
  };
};

/**
 * Check if user has liked a post
 * @param {Object} post - Post object (from API or adapted)
 * @param {string} userId - Current user ID
 * @returns {boolean} True if user has liked the post
 */
export const hasUserLikedPost = (post, userId) => {
  if (!post || !userId) return false;
  
  // Check in likes array (from API)
  if (post.likes && Array.isArray(post.likes)) {
    return post.likes.some(
      (like) => (typeof like === "string" ? like : like._id) === userId
    );
  }
  
  return false;
};

/**
 * Get comment count from post
 * @param {Object} post - Post object
 * @returns {number} Number of comments
 */
export const getCommentCount = (post) => {
  if (!post) return 0;
  
  if (post.comments && Array.isArray(post.comments)) {
    return post.comments.length;
  }
  
  return post.intCommentCount || 0;
};

/**
 * Get like count from post
 * @param {Object} post - Post object
 * @returns {number} Number of likes
 */
export const getLikeCount = (post) => {
  if (!post) return 0;
  
  if (post.likes && Array.isArray(post.likes)) {
    return post.likes.length;
  }
  
  return post.intReactionCount || 0;
};
