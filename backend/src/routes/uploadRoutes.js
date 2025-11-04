/**
 * Upload Routes
 * Handle standalone image upload endpoint
 */

import express from 'express';
import { uploadImage } from '../controllers/uploadController.js';
import { protect } from '../middleware/auth.js';
import upload from '../middleware/upload.js';

const router = express.Router();

/**
 * @route   POST /api/uploads
 * @desc    Upload image to Cloudinary
 * @access  Private
 */
router.post('/', protect, upload.single('image'), uploadImage);

export default router;
