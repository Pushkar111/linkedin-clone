// eslint-disable-next-line no-unused-vars
import { shapeDBDefaultValues, DefaultDatabaseValues } from "../models";

/**
 * @module ServiceDatabaseValues
 * REST API version - uses hardcoded defaults instead of Firebase
 */

/**
 * Get default values (profile picture and background image URLs)
 * @returns {Promise<DefaultDatabaseValues | null>}
 */
const getDefaultValues = async () => {
  try {
    // Return hardcoded default values for REST API version
    // These match the backend defaults
    return shapeDBDefaultValues(
      "https://res.cloudinary.com/demo/image/upload/default-avatar.png", // Default profile pic
      "https://res.cloudinary.com/demo/image/upload/default-background.jpg" // Default background
    );
  } catch (error) {
    console.error("serviceDBValues.getDefaultValues:", error);
  }

  return null;
};

export { getDefaultValues };
