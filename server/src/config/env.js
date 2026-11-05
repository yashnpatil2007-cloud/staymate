const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const isProduction = process.env.NODE_ENV === 'production';

const env = {
  isProduction,
  port: Number(process.env.PORT || 5000),
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
  mongoUri: process.env.MONGODB_URI || '',
  jwtSecret: process.env.JWT_SECRET || (isProduction ? '' : 'dev-only-staymate-secret'),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  cookieName: process.env.COOKIE_NAME || 'staymate_token',
  admin: {
    name: process.env.ADMIN_NAME || 'StayMate Admin',
    email: (process.env.ADMIN_EMAIL || '').toLowerCase(),
    password: process.env.ADMIN_PASSWORD || ''
  },
  seedDemo: process.env.SEED_DEMO !== 'false',
  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME || '',
    apiKey: process.env.CLOUDINARY_API_KEY || '',
    apiSecret: process.env.CLOUDINARY_API_SECRET || ''
  },
  smtp: {
    host: process.env.SMTP_HOST || '',
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === 'true',
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
    from: process.env.EMAIL_FROM || 'StayMate <no-reply@staymate.app>'
  }
};

if (isProduction && !env.jwtSecret) {
  env.jwtSecret = 'staymate-prod-fallback-secret-2026';
}

if (isProduction && !env.mongoUri) {
  console.warn('⚠️ MONGODB_URI is not set in production. Using in-memory fallback.');
}

env.cloudinary.enabled = Boolean(
  env.cloudinary.cloudName && env.cloudinary.apiKey && env.cloudinary.apiSecret
);
env.emailEnabled = Boolean(env.smtp.host && env.smtp.user && env.smtp.pass);

module.exports = env;
