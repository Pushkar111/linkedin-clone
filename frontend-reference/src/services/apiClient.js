/**
 * @module apiClient
 * @description Centralized API client using Axios with JWT token management
 */

import axios from "axios";
import { toast } from "react-toastify";

// Create axios instance with base configuration
const apiClient = axios.create({
  baseURL: process.env.REACT_APP_API_URL || "http://localhost:5000/api",
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true, // Include cookies in requests
});

/**
 * Request interceptor - Automatically add JWT token to requests
 */
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

/**
 * Response interceptor - Handle errors and token refresh
 */
apiClient.interceptors.response.use(
  (response) => {
    // Extract data from response
    console.log("API Response:", response.data);
    return response.data;
  },
  async (error) => {
    console.error("API Error:", error.response?.data || error.message);
    const originalRequest = error.config;

    // Handle 401 Unauthorized - Token expired or invalid
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Try to refresh token
        const refreshToken = localStorage.getItem("refreshToken");
        
        if (refreshToken) {
          const response = await axios.post(
            `${process.env.REACT_APP_API_URL || "http://localhost:5000/api"}/auth/refresh`,
            { refreshToken }
          );

          const { token } = response.data;
          localStorage.setItem("token", token);

          // Retry original request with new token
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return apiClient(originalRequest);
        }
      } catch (refreshError) {
        // Refresh failed - logout user
        localStorage.removeItem("token");
        localStorage.removeItem("refreshToken");
        localStorage.removeItem("user");
        
        toast.error("Session expired. Please login again.");
        
        // Redirect to landing page after a short delay
        setTimeout(() => {
          window.location.href = "/";
        }, 1500);
        
        return Promise.reject(refreshError);
      }
    }

    // Handle other errors
    // Note: We don't show toast here as thunks handle error messages
    // This prevents duplicate toast notifications
    return Promise.reject(error.response?.data || error);
  }
);

export default apiClient;
