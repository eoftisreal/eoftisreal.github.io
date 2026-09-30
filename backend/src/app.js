const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const env = require('./config/env');
const healthRoutes = require('./routes/health');
const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/products');
const cartRoutes = require('./routes/cart');
const checkoutRoutes = require('./routes/checkout');
const orderRoutes = require('./routes/orders');
const adminRoutes = require('./routes/admin');
const masterRoutes = require('./routes/master');
const wishlistRoutes = require('./routes/wishlist');
const sitemapRoutes = require('./routes/sitemap');
const masterDataRoutes = require('./routes/master-data');
const { notFound, errorHandler } = require('./middleware/errorHandler');
const path = require('path');

const compressionMiddleware = require('./middleware/compression');
const cacheMiddleware = require('./middleware/cache');
const queryOptimizationMiddleware = require('./middleware/queryOptimization');

const { globalLimiter, apiLimiter, authLimiter, uploadLimiter, readOperationLimiter, writeOperationLimiter, skipPreflight } = require('./middleware/rateLimiter');

const app = express();

// Trust the proxy since the app is deployed behind Appwrite's load balancer or DigitalOcean's
// Trust all proxies in the chain to accurately resolve the client IP
app.set('trust proxy', true);

// Security headers
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// CORS - More permissive for Appwrite deployments
const corsOptions = {
  origin: function (origin, callback) {
    // Always allow origin (this is safe as auth uses Bearer JWTs in headers)
    callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  maxAge: 86400
};

app.use(cors(corsOptions));

// Health check should bypass DB check if it doesn't strictly need it, or we can just mount dbCheck after it
// Wait, the user specifically said: "Keep database-independent liveness routes accessible."
// Health check is at /api/health

// We should exclude health from dbCheck.
const dbCheck = require('./middleware/dbCheck');
app.use('/api', (req, res, next) => {
  if (req.path === '/health' || req.path === '/health/') {
    return next();
  }
  return dbCheck(req, res, next);
});

// Compression and caching middleware
app.use(compressionMiddleware());
app.use(cacheMiddleware);
app.use(queryOptimizationMiddleware);

const responseCacheMiddleware = require('./middleware/responseCache');
app.use('/api/', responseCacheMiddleware);

// API rate limiting
app.use('/api/', (req, res, next) => {
  if (req.method === 'OPTIONS') return next();
  if (req.method === 'GET') {
    return readOperationLimiter(req, res, next);
  }
  if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method)) {
    return writeOperationLimiter(req, res, next);
  }
  next();
});
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/signup', authLimiter);
app.use('/api/auth/forgot-password', authLimiter);
app.use('/api/auth/reset-password', authLimiter);
app.use('/api/auth/magic-link', authLimiter);
app.use('/api/auth/verify-email', authLimiter);
app.use('/api/checkout', authLimiter);
app.use('/api/products/upload-custom', uploadLimiter);
app.use('/api/admin/upload', uploadLimiter);

// Body parsing
app.use(express.json({ limit: '2mb' }));

// Logging
const customLogger = require('./middleware/logger');
if (process.env.NODE_ENV === 'production') {
  app.use(customLogger);
} else {
  app.use(morgan('dev'));
}

// Global rate limiting
app.use(globalLimiter);

// API Routes
app.use('/api', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/checkout', checkoutRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/master', masterRoutes);
app.use('/api/master-data', masterDataRoutes);
app.use('/api/wishlist', wishlistRoutes);
app.use('/api', sitemapRoutes);

// ========================================
// SERVE FRONTEND STATIC FILES
// ========================================
// In production (including Appwrite), serve the built frontend
if (process.env.NODE_ENV === 'production' || process.env.SERVE_FRONTEND === 'true') {
  const frontendPath = path.join(__dirname, '../../frontend/dist');

  const precompressed = require('./middleware/precompressed');
  app.use(precompressed(frontendPath));

  // Serve static files with caching
  app.use(express.static(frontendPath, {
    maxAge: '1d',
    etag: false,
    // Only cache assets, not HTML
    setHeaders: (res, pathStr) => {
      const originalPath = pathStr.replace(/\.(br|gz)$/, '');
      if (originalPath.endsWith('.html')) {
        res.setHeader('Cache-Control', 'public, max-age=0, must-revalidate');
      } else if (originalPath.match(/\.(js|css|woff2?)$/)) {
        res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      } else {
        res.setHeader('Cache-Control', 'public, max-age=3600');
      }
    }
  }));

  // SPA fallback: For all non-API routes that don't match files, serve index.html
  app.get('*', (req, res, next) => {
    // Skip API routes (let them hit the 404 handler below)
    if (req.path.startsWith('/api')) {
      return next();
    }

    // Skip requests for files that don't exist (images, etc.)
    const filePath = path.join(frontendPath, req.path);
    if (path.extname(filePath) && filePath.includes('.')) {
      return next();
    }

    // Serve index.html for all other routes (SPA routing)
    res.setHeader('Cache-Control', 'public, max-age=0, must-revalidate');
    res.sendFile(path.join(frontendPath, 'index.html'), (err) => {
      if (err) {
        next(err);
      }
    });
  });
}

// ========================================
// ERROR HANDLING
// ========================================
app.use(notFound);
app.use(errorHandler);

module.exports = app;