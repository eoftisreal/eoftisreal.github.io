const rateLimit = require('express-rate-limit');

/**
 * Rate limiter configurations
 */
const createRateLimiter = (windowMs = 15 * 60 * 1000, max = 100) => {
  return rateLimit({
    windowMs, // Time window
    max, // Max requests per window
    message: 'Too many requests from this IP, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
    // Skip successful requests on GET
    skip: (req, res) => req.method === 'GET' && res.statusCode < 400,
  });
};

/**
 * Strict rate limiter for auth endpoints
 */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 requests per window
  skipSuccessfulRequests: false,
  message: 'Too many login attempts, please try again later.',
});

/**
 * Relaxed rate limiter for general API
 */
const apiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30, // 30 requests per minute
  skipSuccessfulRequests: true,
});

module.exports = { createRateLimiter, authLimiter, apiLimiter };
