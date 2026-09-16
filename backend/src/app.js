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
const { notFound, errorHandler } = require('./middleware/errorHandler');
const path = require('path');

const compressionMiddleware = require('./middleware/compression');
const cacheMiddleware = require('./middleware/cache');
const queryOptimizationMiddleware = require('./middleware/queryOptimization');

const { apiLimiter, authLimiter } = require('./middleware/rateLimiter');

const app = express();

// Trust the proxy since the app is deployed behind Appwrite's load balancer or DigitalOcean's
app.set('trust proxy', 1);

// Security headers
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// CORS - More permissive for Appwrite deployments
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests from the same origin
    const appUrl = process.env.APP_URL || '';
    const allowedOrigins = [
      appUrl,
      'http://localhost:3000',
      'http://localhost:5173',
      'http://localhost:5174',
    ].filter(Boolean);

    // In production, restrict to our domain
    if (process.env.NODE_ENV === 'production') {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    } else {
      // Development: allow all
      callback(null, true);
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  maxAge: 86400
};

app.use(cors(corsOptions));

// Compression and caching middleware
app.use(compressionMiddleware());
app.use(cacheMiddleware);
app.use(queryOptimizationMiddleware);

// API rate limiting
app.use('/api/', apiLimiter);
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/signup', authLimiter);
app.use('/api/auth/forgot-password', authLimiter);

// Body parsing
app.use(express.json({ limit: '2mb' }));

// Logging
if (process.env.NODE_ENV !== 'production' || process.env.ENABLE_HTTP_LOGS === 'true') {
  app.use(morgan(process.env.NODE_ENV === 'production' ? 'tiny' : 'dev'));
}

// Global rate limiting
app.use(
  rateLimit({
    windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS || 900000),
    max: Number(process.env.RATE_LIMIT_MAX || 100),
    standardHeaders: true,
    legacyHeaders: false,
  })
);

// API Routes
app.use('/api', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/checkout', checkoutRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/master', masterRoutes);
app.use('/api/wishlist', wishlistRoutes);
app.use('/api', sitemapRoutes);

// ========================================
// SERVE FRONTEND STATIC FILES
// ========================================
// In production (including Appwrite), serve the built frontend
if (process.env.NODE_ENV === 'production' || process.env.SERVE_FRONTEND === 'true') {
  const frontendPath = path.join(__dirname, '../../frontend/dist');

  // Appwrite Function specific fix: when we rewrite routes via appwrite-entry.js,
  // the path gets mapped strangely for static files if we aren't careful, but since
  // express.static mounts at root, it should find it.
  // One big catch: since frontend builds using Vite and pre-compresses to .br and .gz,
  // we can use express-static-gzip to cleanly serve these if needed, or simply let
  // normal express.static handle the raw files.
  // We'll use basic express static.

  const expressStaticGzip = require('express-static-gzip');
  app.use('/', expressStaticGzip(frontendPath, {
      enableBrotli: true,
      orderPreference: ['br', 'gz'],
      setHeaders: function (res, path) {
         if (path.endsWith('.html')) {
           res.setHeader('Cache-Control', 'public, max-age=0, must-revalidate');
         } else if (path.match(/\.(js|css|woff2?)$/)) {
           res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
         }
      }
  }));

  // SPA fallback: For all non-API routes that don't match files, serve index.html
  app.get('*', (req, res, next) => {
    // Skip API routes (let them hit the 404 handler below)
    if (req.path.startsWith('/api')) {
      return next();
    }

    // Skip requests for files that don't exist (images, js, css, etc.)
    // If the browser requested a JS or CSS file and it wasn't found by express.static,
    // we should let it 404 instead of serving index.html which causes SyntaxError in the browser.
    const ext = path.extname(req.path);
    if (ext && req.path.includes('.')) {
      return next();
    }

    // Serve index.html for all other routes (SPA routing)
    res.setHeader('Cache-Control', 'public, max-age=0, must-revalidate');
    res.sendFile(path.join(frontendPath, 'index.html'), (err) => {
      if (err) {
        // If index.html itself is missing, pass to error handler
        if (err.code === 'ENOENT') {
          err.statusCode = 404;
        }
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