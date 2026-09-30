const mongoose = require('mongoose');

module.exports = function dbCheck(req, res, next) {
  // If we are connecting or connected, let it pass
  if (mongoose.connection.readyState === 1 || mongoose.connection.readyState === 2) {
    return next();
  }

  // Otherwise, return a structured 503 error for API requests
  if (req.path.startsWith('/api/')) {
    return res.status(503).json({
      error: {
        code: 'SERVICE_UNAVAILABLE',
        message: 'Database is currently unavailable. Please try again later.'
      }
    });
  }

  next();
};
