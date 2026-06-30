const compression = require('compression');

/**
 * Compression middleware configuration
 * Automatically compresses responses with gzip and deflate
 */
const compressionMiddleware = () => {
  return compression({
    // Only compress responses >= 1KB
    threshold: 1024,
    // Compression level (1-9, higher = better compression but slower)
    level: 6,
    // Enable for both gzip and deflate
    algorithm: 'gzip',
    // Check if response should be compressed
    filter: (req, res) => {
      // Don't compress responses with this request header
      if (req.headers['x-no-compression']) {
        return false;
      }
      // Use compression filter function
      return compression.filter(req, res);
    },
  });
};

module.exports = compressionMiddleware;
