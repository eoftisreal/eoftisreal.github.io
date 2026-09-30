const mongoose = require('mongoose');

module.exports = async function dbCheck(req, res, next) {
  // If readyState is 1 (connected), let it pass
  if (mongoose.connection.readyState === 1) {
    return next();
  }

  // If readyState is 2 (connecting), wait for it to be ready with a bounded timeout
  if (mongoose.connection.readyState === 2) {
    try {
      await Promise.race([
        new Promise((resolve) => mongoose.connection.once('connected', resolve)),
        new Promise((_, reject) => setTimeout(() => reject(new Error('DB Timeout')), 5000))
      ]);
      return next();
    } catch (err) {
      // Timeout or error, fall through to 503
    }
  }

  // Return structured 503 error for database-dependent routes
  return res.status(503).json({
    error: {
      code: 'SERVICE_UNAVAILABLE',
      message: 'Database is currently unavailable. Please try again later.'
    }
  });
};
