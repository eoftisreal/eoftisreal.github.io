/**
 * HTTP Cache headers middleware
 * Implements smart caching strategy
 */
const cacheMiddleware = (req, res, next) => {
  // GET requests - cache for 1 hour
  if (req.method === 'GET') {
    res.set({
      'Cache-Control': 'public, max-age=3600',
      'ETag': undefined,
    });
  }
  // POST/PUT/DELETE - no cache
  else {
    res.set({
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
    });
  }

  // API endpoints - shorter cache
  if (req.path.startsWith('/api')) {
    if (req.method === 'GET') {
      res.set('Cache-Control', 'private, max-age=300'); // 5 minutes
    }
  }

  next();
};

module.exports = cacheMiddleware;
