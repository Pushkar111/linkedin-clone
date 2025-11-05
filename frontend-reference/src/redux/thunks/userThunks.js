import { createAsyncThunk } from "@reduxjs/toolkit";
import { userAPI, adaptUserFromAPI, adaptUsersFromAPI } from "../../services";
import { toast } from "react-toastify";

/**
 * Fetch user profile by ID
 * @param {string} userId - User ID
 */
export const fetchUserProfile = createAsyncThunk(
  "users/fetchProfile",
  async (userId, { rejectWithValue }) => {
    try {
      const response = await userAPI.getUserProfile(userId);
      return adaptUserFromAPI(response.user);
    } catch (error) {
      const message = error.response?.data?.message || "Failed to fetch user profile";
      return rejectWithValue(message);
    }
  }
);

/**
 * Fetch all users with pagination
 * @param {Object} params - Pagination parameters
 * @param {number} params.page - Page number
 * @param {number} params.limit - Items per page
 */
export const fetchAllUsers = createAsyncThunk(
  "users/fetchAll",
  async ({ page = 1, limit = 20 }, { rejectWithValue }) => {
    try {
      const response = await userAPI.getAllUsers(page, limit);
      const adaptedUsers = adaptUsersFromAPI(response.users);
      return {
        users: adaptedUsers,
        pagination: response.pagination,
      };
    } catch (error) {
      const message = error.response?.data?.message || "Failed to fetch users";
      return rejectWithValue(message);
    }
  }
);

/**
 * Search users by query
 * @param {string} query - Search query
 */
export const searchUsers = createAsyncThunk(
  "users/search",
  async (query, { rejectWithValue }) => {
    try {
      const response = await userAPI.searchUsers(query);
      return adaptUsersFromAPI(response.users);
    } catch (error) {
      const message = error.response?.data?.message || "Search failed";
      return rejectWithValue(message);
    }
  }
);

/**
 * Update user profile
 * @param {Object} data - Update data
 * @param {string} data.userId - User ID
 * @param {Object} data.profileData - Profile data to update
 */
export const updateProfile = createAsyncThunk(
  "users/updateProfile",
  async ({ userId, profileData }, { rejectWithValue }) => {
    try {
      const response = await userAPI.updateUserProfile(userId, profileData);
      toast.success("Profile updated!");
      return adaptUserFromAPI(response.user);
    } catch (error) {
      const message = error.response?.data?.message || "Failed to update profile";
      toast.error(message);
      return rejectWithValue(message);
    }
  }
);

/**
 * Update profile with images
 * @param {Object} data - Update data
 * @param {string} data.userId - User ID
 * @param {Object} data.profileData - Profile data with base64 images
 */
export const updateProfileWithImages = createAsyncThunk(
  "users/updateProfileWithImages",
  async ({ userId, profileData }, { rejectWithValue }) => {
    try {
      const response = await userAPI.updateProfileWithImages(userId, profileData);
      toast.success("Profile updated!");
      return adaptUserFromAPI(response.user);
    } catch (error) {
      const message = error.response?.data?.message || "Failed to update profile";
      toast.error(message);
      return rejectWithValue(message);
    }
  }
);

/**
 * Update profile picture
 * @param {Object} data - Update data
 * @param {string} data.userId - User ID
 * @param {File} data.imageFile - Profile picture file
 * @param {Object} data.additionalData - Additional profile data
 */
export const updateProfilePicture = createAsyncThunk(
  "users/updateProfilePicture",
  async ({ userId, imageFile, additionalData = {} }, { rejectWithValue }) => {
    try {
      const response = await userAPI.updateProfilePicture(
        userId,
        imageFile,
        additionalData
      );
      toast.success("Profile picture updated!");
      return adaptUserFromAPI(response.user);
    } catch (error) {
      const message = error.response?.data?.message || "Failed to update profile picture";
      toast.error(message);
      return rejectWithValue(message);
    }
  }
);

/**
 * Deactivate user account
 * @param {string} userId - User ID
 */
export const deactivateAccount = createAsyncThunk(
  "users/deactivate",
  async (userId, { rejectWithValue }) => {
    try {
      await userAPI.deactivateUser(userId);
      toast.success("Account deactivated");
      return userId;
    } catch (error) {
      const message = error.response?.data?.message || "Failed to deactivate account";
      toast.error(message);
      return rejectWithValue(message);
    }
  }
);
