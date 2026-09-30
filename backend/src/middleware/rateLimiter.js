const rateLimit = require('express-rate-limit');

const skipPreflight = (req, res) => {
  return req.method === 'OPTIONS';
};

/**
 * Rate limiter configurations
 */
const createRateLimitHandler = (message) => (req, res) => {
  res.status(429).json({
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message
    }
  });
};

/**
 * Strict rate limiter for auth endpoints
 */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // 20 requests per window
  skip: skipPreflight,
  validate: { trustProxy: false },
  skipSuccessfulRequests: false,
  handler: createRateLimitHandler('Too many login attempts, please try again later.'),
});

/**
 * Rate limiter for image uploads
 */
const uploadLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 15, // 15 requests per minute
  skip: skipPreflight,
  validate: { trustProxy: false },
  handler: createRateLimitHandler('Too many image uploads from this IP, please try again later.'),
});

/**
 * Rate limiter for read operations (GET)
 */
const readOperationLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 1000, // 1000 requests per minute
  skip: skipPreflight,
  validate: { trustProxy: false },
  standardHeaders: true,
  legacyHeaders: false,
  handler: createRateLimitHandler('Too many read requests from this IP, please try again later.'),
});

/**
 * Rate limiter for write operations (POST, PUT, DELETE, PATCH)
 */
const writeOperationLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 1000, // 1000 requests per minute
  skip: skipPreflight,
  validate: { trustProxy: false },
  standardHeaders: true,
  legacyHeaders: false,
  handler: createRateLimitHandler('Too many write requests from this IP, please try again later.'),
});

/**
 * Relaxed rate limiter for general API
 */
const apiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 1000, // 1000 requests per minute
  validate: { trustProxy: false },
  skip: skipPreflight,
  handler: createRateLimitHandler('Too many requests, please try again later.'),
});

const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10000,
  validate: { trustProxy: false },
  skip: skipPreflight,
  handler: createRateLimitHandler('Too many requests from this IP, please try again later.'),
});

module.exports = { authLimiter, uploadLimiter, apiLimiter, readOperationLimiter, writeOperationLimiter, globalLimiter, skipPreflight };
