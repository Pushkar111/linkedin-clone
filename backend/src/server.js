/**
 * Server Entry Point
 * Initialize and start the Express server
 */

import dotenv from 'dotenv';
import app from './app.js';
import connectDB from './config/db.js';
import { configureCloudinary } from './config/cloudinary.js';

// Load environment variables
dotenv.config();

/**
 * Validate required environment variables
 */
const requiredEnvVars = ['MONGO_URI', 'JWT_SECRET'];
const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

if (missingEnvVars.length > 0) {
  console.error('❌ Missing required environment variables:', missingEnvVars.join(', '));
  console.error('Please create a .env file based on .env.example');
  process.exit(1);
}

/**
 * Set port
 */
const PORT = process.env.PORT || 5000;

/**
 * Initialize and start server
 */
const startServer = async () => {
  try {
    // Connect to MongoDB
    await connectDB();

    // Configure Cloudinary (optional - only if credentials provided)
    if (process.env.CLOUDINARY_CLOUD_NAME) {
      configureCloudinary();
    } else {
      console.warn('⚠️  Cloudinary not configured - image uploads will fail');
      console.warn('   Add CLOUDINARY_* variables to .env to enable image uploads');
    }

    // Start Express server
    const server = app.listen(PORT, () => {
      console.log(`
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║   🚀 LinkedIn Clone API Server                           ║
║                                                           ║
║   ✅ Server running on port ${PORT}                        ║
║   ✅ Environment: ${process.env.NODE_ENV || 'development'}                      ║
║   ✅ MongoDB Connected                                    ║
║   ${process.env.CLOUDINARY_CLOUD_NAME ? '✅' : '⚠️ '} Cloudinary ${process.env.CLOUDINARY_CLOUD_NAME ? 'Configured' : 'Not Configured'}                       ║
║                                                           ║
║   📍 Base URL: http://localhost:${PORT}                    ║
║   📍 Health Check: http://localhost:${PORT}/health         ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
      `);
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (err) => {
      console.error('❌ UNHANDLED REJECTION! Shutting down...');
      console.error(err);
      server.close(() => {
        process.exit(1);
      });
    });

    // Handle SIGTERM signal
    process.on('SIGTERM', () => {
      console.log('👋 SIGTERM RECEIVED. Shutting down gracefully...');
      server.close(() => {
        console.log('✅ Process terminated!');
      });
    });

  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

// Start the server
startServer();
