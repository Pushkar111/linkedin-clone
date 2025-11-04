/**
 * Error Handling Middleware
 * Global error handler and 404 handler
 */

/**
 * 404 Not Found Handler
 * Catches requests to undefined routes
 */
export const notFound = (req, res, next) => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  res.status(404);
  next(error);
};

/**
 * Global Error Handler
 * Catches all errors and sends formatted response
 */
export const errorHandler = (err, req, res, next) => {
  // Set status code (500 if not set)
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  res.status(statusCode);

  // Format error response
  const errorResponse = {
    success: false,
    message: err.message,
    stack: process.env.NODE_ENV === 'production' ? null : err.stack,
  };

  // Handle specific MongoDB errors
  if (err.name === 'CastError') {
    errorResponse.message = 'Resource not found';
    res.status(404);
  }

  if (err.code === 11000) {
    // Duplicate key error
    const field = Object.keys(err.keyPattern)[0];
    errorResponse.message = `${field} already exists`;
    res.status(400);
  }

  if (err.name === 'ValidationError') {
    errorResponse.message = Object.values(err.errors)
      .map((val) => val.message)
      .join(', ');
    res.status(400);
  }

  // Handle JWT errors
  if (err.name === 'JsonWebTokenError') {
    errorResponse.message = 'Invalid token';
    res.status(401);
  }

  if (err.name === 'TokenExpiredError') {
    errorResponse.message = 'Token expired';
    res.status(401);
  }

  // Log error in development
  if (process.env.NODE_ENV === 'development') {
    console.error('Error:', err);
  }

  res.json(errorResponse);
};
