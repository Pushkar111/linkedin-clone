/**
 * Authentication Routes
 * Handle user authentication endpoints
 */

import express from 'express';
import {
  register,
  login,
  googleAuth,
  anonymousAuth,
  getMe,
  logout,
  refreshToken,
  forgotPassword,
  resetPassword,
} from '../controllers/authController.js';
import { protect } from '../middleware/auth.js';
import {
  registerValidation,
  loginValidation,
  validate,
} from '../middleware/validation.js';
import upload from '../middleware/upload.js';

const router = express.Router();

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user (with optional profile picture upload)
 * @access  Public
 * Note: Validation runs after multer to allow multipart/form-data parsing
 */
router.post('/register', upload.single('profileImage'), register);

/**
 * @route   POST /api/auth/login
 * @desc    Login user
 * @access  Public
 */
router.post('/login', loginValidation, validate, login);

/**
 * @route   POST /api/auth/google
 * @desc    Google OAuth authentication
 * @access  Public
 */
router.post('/google', googleAuth);

/**
 * @route   POST /api/auth/anonymous
 * @desc    Anonymous/guest authentication
 * @access  Public
 */
router.post('/anonymous', anonymousAuth);

/**
 * @route   GET /api/auth/me
 * @desc    Get current logged in user
 * @access  Private
 */
router.get('/me', protect, getMe);

/**
 * @route   POST /api/auth/logout
 * @desc    Logout user
 * @access  Private
 */
router.post('/logout', protect, logout);

/**
 * @route   POST /api/auth/refresh
 * @desc    Refresh access token
 * @access  Public
 */
router.post('/refresh', refreshToken);

/**
 * @route   POST /api/auth/forgot-password
 * @desc    Request password reset
 * @access  Public
 */
router.post('/forgot-password', forgotPassword);

/**
 * @route   POST /api/auth/reset-password
 * @desc    Reset password with token
 * @access  Public
 */
router.post('/reset-password', resetPassword);

export default router;
