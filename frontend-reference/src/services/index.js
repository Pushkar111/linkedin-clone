// Legacy Firebase services (kept for backward compatibility)
// Export stub functions to prevent import errors
export const googleSignOutUser = () => {
  console.warn("googleSignOutUser is deprecated. Firebase authentication has been removed.");
  return Promise.resolve();
};

// New REST API services
export * as authAPI from "./authService";
export * as postAPI from "./postService";
export * as userAPI from "./userService";
export * as connectionAPI from "./connectionAPI";
export * as messageAPI from "./messageAPI";
export { default as apiClient } from "./apiClient";
export * from "./apiAdapters";
