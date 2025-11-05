/**
 * Express Application Configuration
 * Setup middleware and routes
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import cookieParser from 'cookie-parser';

// Import routes
import authRoutes from './routes/authRoutes.js';
import postRoutes from './routes/postRoutes.js';
import userRoutes from './routes/userRoutes.js';
import uploadRoutes from './routes/uploadRoutes.js';
import connectionRoutes from './routes/connectionRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';

// Import error handlers
import { notFound, errorHandler } from './middleware/error.js';

/**
 * Create Express application
 */
const app = express();

/**
 * Security Middleware
 */
// Helmet - secure HTTP headers
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// CORS - Cross-Origin Resource Sharing
const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:5173',
      process.env.FRONTEND_URL
    ].filter(Boolean);
    
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200,
};
app.use(cors(corsOptions));

/**
 * Rate Limiting
 */
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

// Apply rate limiter to all API routes
app.use('/api/', limiter);

/**
 * Body Parsing Middleware
 */
app.use(express.json({ limit: '10mb' })); // Parse JSON bodies with 10MB limit
app.use(express.urlencoded({ extended: true, limit: '10mb' })); // Parse URL-encoded bodies
app.use(cookieParser()); // Parse cookies

/**
 * Compression Middleware
 */
app.use(compression()); // Compress responses

/**
 * Logging Middleware
 */
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev')); // Detailed logging in development
} else {
  app.use(morgan('combined')); // Standard logging in production
}

/**
 * Favicon Handler (prevent 404)
 */
app.get('/favicon.ico', (req, res) => {
  res.status(204).end(); // No content
});

/**
 * Health Check Endpoint
 */
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
  });
});

/**
 * API Routes
 */
app.use('/api/auth', authRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/users', userRoutes);
app.use('/api/uploads', uploadRoutes);
app.use('/api/connections', connectionRoutes);
app.use('/api/notifications', notificationRoutes);

/**
 * Root Route
 */
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'LinkedIn Clone API',
    version: '3.0.0',
    endpoints: {
      auth: '/api/auth',
      posts: '/api/posts',
      users: '/api/users',
      uploads: '/api/uploads',
      connections: '/api/connections',
      notifications: '/api/notifications',
      health: '/health',
    },
  });
});

/**
 * Error Handling Middleware
 */
app.use(notFound); // 404 handler
app.use(errorHandler); // Global error handler

export default app;
