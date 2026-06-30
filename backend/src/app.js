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
const { notFound, errorHandler } = require('./middleware/errorHandler');
const path = require('path');

const compressionMiddleware = require('./middleware/compression');
const cacheMiddleware = require('./middleware/cache');
const queryOptimizationMiddleware = require('./middleware/queryOptimization');

const { apiLimiter, authLimiter } = require('./middleware/rateLimiter');



const app = express();

// Trust the proxy since the app is deployed behind DigitalOcean's load balancer.
// This resolves express-rate-limit 'ERR_ERL_UNEXPECTED_X_FORWARDED_FOR' errors.
app.set('trust proxy', 1);

app.use(helmet({
  contentSecurityPolicy: false, // Sometimes needed for Vite/React if assets are loaded dynamically, but better to keep it false or configure it
}));
app.use(cors({
  origin: env.nodeEnv === 'production' ? env.appUrl : '*',
  credentials: true
}));

app.use(compressionMiddleware());
app.use(cacheMiddleware);
app.use(queryOptimizationMiddleware);

// API rate limiting
app.use('/api/', apiLimiter);
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/signup', authLimiter);
app.use('/api/auth/forgot-password', authLimiter);


app.use(express.json({ limit: '2mb' }));
app.use(morgan(env.nodeEnv === 'production' ? 'combined' : 'dev'));
app.use(
  rateLimit({
    windowMs: env.rateLimitWindowMs,
    max: env.rateLimitMax,
    standardHeaders: true,
    legacyHeaders: false,
  })
);

app.use('/api', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/checkout', checkoutRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/master', masterRoutes);
app.use('/api/wishlist', wishlistRoutes);

// Serve frontend static files in production
if (env.nodeEnv === 'production') {
  const frontendPath = path.join(__dirname, '../../frontend/dist');
  app.use(express.static(frontendPath));

  app.get('*', (req, res, next) => {
    // If it's an API request that wasn't matched above, let it pass to notFound
    if (req.path.startsWith('/api')) {
      return next();
    }
    // Otherwise, send the frontend index.html
    res.sendFile(path.join(frontendPath, 'index.html'));
  });
}

app.use(notFound);
app.use(errorHandler);

module.exports = app;
