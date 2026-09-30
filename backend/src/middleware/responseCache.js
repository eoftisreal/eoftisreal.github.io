const { LRUCache } = require('lru-cache');

// Limit memory: 100 entries, max 1 minute TTL
const responseCache = new LRUCache({
  max: 100,
  ttl: 60 * 1000,
});

module.exports = function responseCacheMiddleware(req, res, next) {
  if (req.method !== 'GET') {
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
      // Clear cache on write (invalidate catalogue data)
      // Note: In a multi-instance Appwrite environment, this only clears the local instance cache.
      responseCache.clear();
    }
    return next();
  }

  // Only explicitly allow public catalogue/reference-data routes
  const isCacheable = (
    req.path.startsWith('/products') ||
    req.path.startsWith('/master-data') ||
    req.path.startsWith('/sitemap')
  ) && !req.path.startsWith('/checkout'); // ensure checkout isn't cached

  // Bypass authenticated/private requests (including wishlist, account, cart, orders, admin)
  if (!isCacheable || req.headers.authorization || req.path.startsWith('/wishlist')) {
    return next();
  }

  const cacheKey = `${req.path}:${JSON.stringify(req.query)}`;

  // Check cache
  const cached = responseCache.get(cacheKey);
  if (cached) {
    res.set('X-Cache', 'HIT');
    if (cached.headers) {
      for (const [key, value] of Object.entries(cached.headers)) {
        res.setHeader(key, value);
      }
    }
    return res.status(cached.statusCode).json(cached.body);
  }

  // Intercept response
  const originalJson = res.json;
  res.json = function (body) {
    if (res.statusCode >= 200 && res.statusCode < 300) {
      // Capture relevant headers to replay
      const headersToCache = {};
      if (res.getHeader('Cache-Control')) headersToCache['Cache-Control'] = res.getHeader('Cache-Control');

      responseCache.set(cacheKey, {
        body: body,
        statusCode: res.statusCode,
        headers: headersToCache,
      });
    }
    res.set('X-Cache', 'MISS');
    return originalJson.call(this, body);
  };

  next();
};
