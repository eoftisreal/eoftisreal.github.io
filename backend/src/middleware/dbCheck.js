const mongoose = require('mongoose');

module.exports = async function dbCheck(req, res, next) {
  // If we are already connected, let it pass
  if (mongoose.connection.readyState === 1) {
    return next();
  }

  // If we are connecting, await the connection with a timeout
  if (mongoose.connection.readyState === 2) {
    try {
      await Promise.race([
        mongoose.connection.asPromise(),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Database connection timeout')), 5000))
      ]);
      // After waiting, check again if it's connected
      if (mongoose.connection.readyState === 1) {
        return next();
      }
    } catch (err) {
      // Timeout or connection error, fall through to 503
    }
  }

  // Return a structured 503 error for API requests (redundant prefix check removed)
  return res.status(503).json({
    error: {
      code: 'SERVICE_UNAVAILABLE',
      message: 'Database is currently unavailable. Please try again later.'
    }
  });
};
