const responseCache = new Map();
const CACHE_TTL = 60 * 1000; // 1 minute

module.exports = function responseCacheMiddleware(req, res, next) {
  if (req.method !== 'GET') {
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
      responseCache.clear();
    }
    return next();
  }

  // Skip caching for highly dynamic or user-specific routes that require real-time updates
  if (
    req.path.startsWith('/orders') ||
    req.path.startsWith('/cart') ||
    req.path.startsWith('/auth') ||
    req.path.startsWith('/admin') ||
    req.path === '/public/settings'
  ) {
    return next();
  }

  // Factor in authentication header to prevent cross-user data leakage
  const authHeader = req.headers.authorization || '';
  const cacheKey = `${req.path}:${JSON.stringify(req.query)}:${authHeader}`;

  // Check cache
  if (responseCache.has(cacheKey)) {
    const cached = responseCache.get(cacheKey);
    if (Date.now() - cached.timestamp < CACHE_TTL) {
      res.set('X-Cache', 'HIT');
      return res.status(cached.statusCode).json(cached.body);
    }
    responseCache.delete(cacheKey);
  }

  // Intercept response
  const originalJson = res.json;
  res.json = function (body) {
    if (res.statusCode >= 200 && res.statusCode < 300) {
      responseCache.set(cacheKey, {
        body: body,
        statusCode: res.statusCode,
        timestamp: Date.now(),
      });
    }
    res.set('X-Cache', 'MISS');
    return originalJson.call(this, body);
  };

  next();
};
