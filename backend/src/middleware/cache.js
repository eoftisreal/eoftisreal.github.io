// Default to no-store. Only explicitly public routes opt into HTTP caching.
module.exports = function cacheMiddleware(_req, res, next) {
  res.set('Cache-Control', 'no-store');
  next();
};
