const dotenv = require('dotenv');

dotenv.config();

const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT || 4000),
  mongoUri: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/ecommerce',
  jwtAccessSecret: process.env.JWT_ACCESS_SECRET,
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  appUrl: (process.env.APP_URL || 'http://localhost:3000').replace(/\/+$/, ''),
  sendgridApiKey: process.env.SENDGRID_API_KEY || '',
  emailFrom: process.env.EMAIL_FROM || 'noreply@example.com',
  emailFromAuth: process.env.EMAIL_FROM_AUTH || process.env.EMAIL_FROM || 'auth@example.com',
  emailFromOrders: process.env.EMAIL_FROM_ORDERS || process.env.EMAIL_FROM || 'orders@example.com',
  emailFromSupport: process.env.EMAIL_FROM_SUPPORT || process.env.EMAIL_FROM || 'support@example.com',
  razorpayKeyId: process.env.RAZORPAY_KEY_ID || '',
  razorpayKeySecret: process.env.RAZORPAY_KEY_SECRET || '',
  r2AccessKeyId: process.env.R2_ACCESS_KEY_ID || '',
  r2SecretAccessKey: process.env.R2_SECRET_ACCESS_KEY || '',
  r2Endpoint: process.env.R2_ENDPOINT || '',
  r2BucketName: process.env.R2_BUCKET_NAME || '',
  r2PublicUrl: process.env.R2_PUBLIC_URL || '',
  rateLimitWindowMs: Number(process.env.RATE_LIMIT_WINDOW_MS || 15 * 60 * 1000),
  rateLimitMax: Number(process.env.RATE_LIMIT_MAX || 200),
  resendApiKey: process.env.RESEND_API_KEY || '',
  jwtRefreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
};

if (!env.jwtAccessSecret) {
  throw new Error('JWT_ACCESS_SECRET is required in environment variables');
}

if (!env.jwtRefreshSecret) {
  throw new Error('JWT_REFRESH_SECRET is required in environment variables');
}

module.exports = env;
