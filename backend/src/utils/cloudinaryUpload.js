/**
 * Cloudinary Upload Utility
 * Handle image uploads to Cloudinary
 */

import { cloudinary } from '../config/cloudinary.js';
import fs from 'fs';
import path from 'path';

/**
 * Upload image to Cloudinary from buffer or file
 * @param {Buffer|string} file - File buffer or file path
 * @param {string} folder - Cloudinary folder name
 * @param {Object} options - Additional upload options
 * @returns {Promise<Object>} - Upload result with URL
 */
export const uploadToCloudinary = async (file, folder = 'linkedin-clone', options = {}) => {
  try {
    const uploadOptions = {
      folder,
      resource_type: 'auto',
      transformation: [
        { width: 1200, height: 1200, crop: 'limit' },
        { quality: 'auto' },
        { fetch_format: 'auto' },
      ],
      ...options,
    };

    let result;

    // If file is a buffer (from multer memory storage)
    if (Buffer.isBuffer(file)) {
      result = await new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          uploadOptions,
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        );
        uploadStream.end(file);
      });
    }
    // If file is a path (from multer disk storage)
    else if (typeof file === 'string') {
      result = await cloudinary.uploader.upload(file, uploadOptions);
      // Delete local file after upload
      fs.unlinkSync(file);
    }
    // If file is an object with path property (multer file object)
    else if (file && file.path) {
      result = await cloudinary.uploader.upload(file.path, uploadOptions);
      // Delete local file after upload
      fs.unlinkSync(file.path);
    } else {
      throw new Error('Invalid file format');
    }

    return {
      url: result.secure_url,
      publicId: result.public_id,
      format: result.format,
      width: result.width,
      height: result.height,
    };
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    throw new Error(`Failed to upload image: ${error.message}`);
  }
};

/**
 * Upload image from base64 string
 * @param {string} base64String - Base64 encoded image
 * @param {string} folder - Cloudinary folder name
 * @returns {Promise<Object>} - Upload result
 */
export const uploadBase64ToCloudinary = async (base64String, folder = 'linkedin-clone') => {
  try {
    const result = await cloudinary.uploader.upload(base64String, {
      folder,
      resource_type: 'auto',
      transformation: [
        { width: 1200, height: 1200, crop: 'limit' },
        { quality: 'auto' },
      ],
    });

    return {
      url: result.secure_url,
      publicId: result.public_id,
      format: result.format,
    };
  } catch (error) {
    console.error('Cloudinary base64 upload error:', error);
    throw new Error(`Failed to upload base64 image: ${error.message}`);
  }
};

/**
 * Delete image from Cloudinary
 * @param {string} publicId - Cloudinary public ID
 * @returns {Promise<Object>} - Deletion result
 */
export const deleteFromCloudinary = async (publicId) => {
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    return result;
  } catch (error) {
    console.error('Cloudinary delete error:', error);
    throw new Error(`Failed to delete image: ${error.message}`);
  }
};

/**
 * Extract public ID from Cloudinary URL
 * @param {string} url - Cloudinary URL
 * @returns {string|null} - Public ID or null
 */
export const getPublicIdFromUrl = (url) => {
  if (!url || !url.includes('cloudinary.com')) {
    return null;
  }

  try {
    // Extract public ID from URL
    // Example: https://res.cloudinary.com/demo/image/upload/v1234567890/folder/image.jpg
    const parts = url.split('/');
    const uploadIndex = parts.indexOf('upload');
    
    if (uploadIndex === -1) return null;
    
    // Get everything after 'upload' and version number
    const pathParts = parts.slice(uploadIndex + 2); // Skip 'upload' and version
    const publicIdWithExtension = pathParts.join('/');
    
    // Remove file extension
    const publicId = publicIdWithExtension.substring(
      0,
      publicIdWithExtension.lastIndexOf('.')
    );
    
    return publicId;
  } catch (error) {
    console.error('Error extracting public ID:', error);
    return null;
  }
};

/**
 * Upload profile picture (optimized for avatars)
 * @param {Buffer|string} file - File to upload
 * @returns {Promise<Object>} - Upload result
 */
export const uploadProfilePicture = async (file) => {
  return uploadToCloudinary(file, 'linkedin-clone/profiles', {
    transformation: [
      { width: 400, height: 400, crop: 'fill', gravity: 'face' },
      { quality: 'auto' },
      { fetch_format: 'auto' },
    ],
  });
};

/**
 * Upload post image
 * @param {Buffer|string} file - File to upload
 * @returns {Promise<Object>} - Upload result
 */
export const uploadPostImage = async (file) => {
  return uploadToCloudinary(file, 'linkedin-clone/posts', {
    transformation: [
      { width: 1200, crop: 'limit' },
      { quality: 'auto' },
      { fetch_format: 'auto' },
    ],
  });
};
