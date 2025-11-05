/**
 * @module userService
 * @description User and profile management service to replace Firestore with REST API
 */

import apiClient from "./apiClient";

/**
 * Get user profile by ID
 * @param {string} userId - User ID
 * @returns {Promise<Object>} User profile object
 */
export const getUserProfile = async (userId) => {
  const response = await apiClient.get(`/users/${userId}`);
  return response.data;
};

/**
 * Get all users (paginated)
 * @param {number} page - Page number
 * @param {number} limit - Users per page
 * @returns {Promise<Object>} Users array with pagination info
 */
export const getAllUsers = async (page = 1, limit = 20) => {
  const response = await apiClient.get("/users", {
    params: { page, limit },
  });
  return response;
};

/**
 * Search users by name, email, or headline
 * @param {string} query - Search query
 * @returns {Promise<Array>} Array of matching users
 */
export const searchUsers = async (query) => {
  const response = await apiClient.get("/users/search", {
    params: { q: query },
  });
  return response.data;
};

/**
 * Update user profile
 * @param {string} userId - User ID
 * @param {Object} profileData - Profile data to update
 * @returns {Promise<Object>} Updated user object
 */
export const updateUserProfile = async (userId, profileData) => {
  const response = await apiClient.put(`/users/${userId}`, profileData);
  return response.data;
};

/**
 * Update user profile with images
 * @param {string} userId - User ID
 * @param {Object} profileData - Profile data
 * @param {string} profileData.firstName - First name
 * @param {string} profileData.lastName - Last name
 * @param {string} profileData.headline - Profile headline
 * @param {string} profileData.about - About section
 * @param {string} profileData.countryLoc - Country location
 * @param {string} profileData.postalCodeLoc - Postal code
 * @param {string} [profileData.profileImageBase64] - Base64 profile image
 * @param {string} [profileData.backgroundImageBase64] - Base64 background image
 * @returns {Promise<Object>} Updated user object
 */
export const updateProfileWithImages = async (userId, profileData) => {
  const response = await apiClient.put(`/users/${userId}`, profileData);
  return response.data;
};

/**
 * Update profile picture using file upload
 * @param {string} userId - User ID
 * @param {File} imageFile - Profile image file
 * @param {Object} [additionalData] - Additional profile data to update
 * @returns {Promise<Object>} Updated user object
 */
export const updateProfilePicture = async (userId, imageFile, additionalData = {}) => {
  const formData = new FormData();
  formData.append("profileImage", imageFile);
  
  // Add additional profile data if provided
  Object.keys(additionalData).forEach((key) => {
    formData.append(key, additionalData[key]);
  });

  const response = await apiClient.put(`/users/${userId}`, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return response.data;
};

/**
 * Get user's posts
 * @param {string} userId - User ID
 * @param {number} page - Page number
 * @param {number} limit - Posts per page
 * @returns {Promise<Object>} Posts array with pagination info
 */
export const getUserPosts = async (userId, page = 1, limit = 10) => {
  const response = await apiClient.get(`/users/${userId}/posts`, {
    params: { page, limit },
  });
  return response;
};

/**
 * Deactivate/delete user account (soft delete)
 * @param {string} userId - User ID
 * @returns {Promise<Object>} Success message
 */
export const deactivateUser = async (userId) => {
  const response = await apiClient.delete(`/users/${userId}`);
  return response;
};

/**
 * Convert File to Base64 string
 * @param {File} file - File object
 * @returns {Promise<string>} Base64 encoded string
 */
export const fileToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      if (reader.result && typeof reader.result === "string") {
        resolve(reader.result);
      } else {
        reject(new Error("Failed to read file as base64 string"));
      }
    };
    reader.onerror = (error) => reject(error);
  });
};

/**
 * Create a user in the backend (called after Firebase auth)
 * This is for migration compatibility - backend handles user creation in auth endpoints
 * @deprecated Use authService.registerUser or authService.googleSignIn instead
 * @param {string} userId - User ID
 * @param {string} email - User email
 * @param {string} fullName - User full name
 * @param {string} authMethod - Authentication method
 * @param {string} profilePicURL - Profile picture URL
 * @returns {Promise<Object>} Created user object
 */
export const createUserInBackend = async (
  userId,
  email,
  fullName,
  authMethod,
  profilePicURL
) => {
  // This function is kept for compatibility but is now handled by auth endpoints
  console.warn("createUserInBackend is deprecated. Use authService instead.");
  return { userId, email, fullName, authMethod, profilePicURL };
};
