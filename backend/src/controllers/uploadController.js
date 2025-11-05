/**
 * Upload Controller
 * Handle standalone image uploads
 */

import asyncHandler from 'express-async-handler';
import { uploadToCloudinary, uploadBase64ToCloudinary } from '../utils/cloudinaryUpload.js';

/**
 * @route   POST /api/uploads
 * @desc    Upload image to Cloudinary
 * @access  Private
 */
export const uploadImage = asyncHandler(async (req, res) => {
  if (!req.file && !req.body.imageBase64) {
    res.status(400);
    throw new Error('No image file provided');
  }

  let uploadResult;

  // Upload from file buffer
  if (req.file) {
    uploadResult = await uploadToCloudinary(req.file.buffer, 'linkedin-clone/uploads');
  }
  // Upload from base64
  else if (req.body.imageBase64) {
    uploadResult = await uploadBase64ToCloudinary(req.body.imageBase64, 'linkedin-clone/uploads');
  }

  res.status(200).json({
    success: true,
    url: uploadResult.url,
    publicId: uploadResult.publicId,
  });
});
