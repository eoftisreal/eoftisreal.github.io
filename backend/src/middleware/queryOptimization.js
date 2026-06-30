/**
 * Middleware to optimize query parameters
 */
const queryOptimizationMiddleware = (req, res, next) => {
  // Limit query results
  const limit = Math.min(parseInt(req.query.limit) || 20, 100); // Max 100
  const page = Math.max(parseInt(req.query.page) || 1, 1); // Min 1

  req.queryParams = {
    limit,
    page,
    skip: (page - 1) * limit,
  };

  next();
};

module.exports = queryOptimizationMiddleware;
