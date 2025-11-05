/**
 * ============================================================================
 * USER CONTEXT - GLOBAL USER STATE MANAGEMENT
 * ============================================================================
 * 
 * Provides global user state and profile update methods
 * - Manages current authenticated user
 * - Handles profile updates across the app
 * - Syncs with localStorage
 * - Provides optimistic updates
 * 
 * @version 1.0.0
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";

const UserContext = createContext(null);

/**
 * UserProvider Component
 * Wraps the app to provide user state globally
 */
export function UserProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Initialize user from localStorage on mount
  useEffect(() => {
    try {
      const storedUser = localStorage.getItem("user");
      if (storedUser) {
        const userData = JSON.parse(storedUser);
        setCurrentUser(userData);
      }
    } catch (error) {
      console.error("Error loading user from localStorage:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Update current user data
   * - Updates state
   * - Syncs with localStorage
   * - Merges with existing data
   */
  const updateUser = useCallback((userData) => {
    setCurrentUser((prevUser) => {
      const updatedUser = {
        ...prevUser,
        ...userData,
        profile: {
          ...(prevUser?.profile || {}),
          ...(userData?.profile || {}),
        },
      };

      // Sync with localStorage
      try {
        localStorage.setItem("user", JSON.stringify(updatedUser));
      } catch (error) {
        console.error("Error saving user to localStorage:", error);
      }

      return updatedUser;
    });
  }, []);

  /**
   * Update specific profile fields
   * Useful for partial updates (e.g., just experience or skills)
   */
  const updateProfileField = useCallback((field, value) => {
    setCurrentUser((prevUser) => {
      const updatedUser = {
        ...prevUser,
        profile: {
          ...(prevUser?.profile || {}),
          [field]: value,
        },
      };

      // Sync with localStorage
      try {
        localStorage.setItem("user", JSON.stringify(updatedUser));
      } catch (error) {
        console.error("Error saving user to localStorage:", error);
      }

      return updatedUser;
    });
  }, []);

  /**
   * Clear user data (logout)
   */
  const clearUser = useCallback(() => {
    setCurrentUser(null);
    try {
      localStorage.removeItem("user");
      localStorage.removeItem("token");
    } catch (error) {
      console.error("Error clearing user data:", error);
    }
  }, []);

  /**
   * Set complete user data (login)
   */
  const setUser = useCallback((userData) => {
    setCurrentUser(userData);
    try {
      localStorage.setItem("user", JSON.stringify(userData));
    } catch (error) {
      console.error("Error saving user to localStorage:", error);
    }
  }, []);

  const value = {
    currentUser,
    loading,
    updateUser,
    updateProfileField,
    clearUser,
    setUser,
  };

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
}

/**
 * Hook to access user context
 * Must be used within UserProvider
 */
export function useUser() {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error("useUser must be used within UserProvider");
  }
  return context;
}

export default UserContext;
