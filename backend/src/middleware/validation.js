/**
 * Validation Middleware
 * Input validation using express-validator
 */

import { body, param, validationResult } from 'express-validator';

/**
 * Validate request and return errors if any
 */
export const validate = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array().map(err => ({
        field: err.path,
        message: err.msg,
      })),
    });
  }
  
  next();
};

/**
 * Registration validation rules
 */
export const registerValidation = [
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email')
    .normalizeEmail(),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters'),
  body('fullName')
    .trim()
    .notEmpty()
    .withMessage('Full name is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Full name must be between 2 and 100 characters'),
];

/**
 * Login validation rules
 */
export const loginValidation = [
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email')
    .normalizeEmail(),
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
];

/**
 * Post creation validation rules
 */
export const createPostValidation = [
  body('text')
    .trim()
    .notEmpty()
    .withMessage('Post text is required')
    .isLength({ max: 3000 })
    .withMessage('Post text cannot exceed 3000 characters'),
  body('mediaType')
    .optional()
    .isIn(['photo', 'video', 'none'])
    .withMessage('Invalid media type'),
];

/**
 * Post update validation rules
 */
export const updatePostValidation = [
  body('text')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Post text cannot be empty')
    .isLength({ max: 3000 })
    .withMessage('Post text cannot exceed 3000 characters'),
];

/**
 * Comment creation validation rules
 */
export const createCommentValidation = [
  body('text')
    .trim()
    .notEmpty()
    .withMessage('Comment text is required')
    .isLength({ max: 500 })
    .withMessage('Comment cannot exceed 500 characters'),
];

/**
 * Profile update validation rules
 */
export const updateProfileValidation = [
  body('fullName')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Full name must be between 2 and 100 characters'),
  body('profile.headline')
    .optional()
    .trim()
    .isLength({ max: 220 })
    .withMessage('Headline cannot exceed 220 characters'),
  body('profile.about')
    .optional()
    .trim()
    .isLength({ max: 2600 })
    .withMessage('About section cannot exceed 2600 characters'),
  body('profile.firstName')
    .optional()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('First name must be between 1 and 50 characters'),
  body('profile.lastName')
    .optional()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Last name must be between 1 and 50 characters'),
];

/**
 * MongoDB ObjectId validation
 */
export const objectIdValidation = (paramName = 'id') => [
  param(paramName)
    .isMongoId()
    .withMessage('Invalid ID format'),
];

/**
 * Search query validation
 */
export const searchValidation = [
  body('query')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Search query must be between 1 and 100 characters'),
];
