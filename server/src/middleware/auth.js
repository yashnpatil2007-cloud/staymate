const User = require('../models/User');
const env = require('../config/env');
const { verifyToken } = require('../utils/token');
const { AppError } = require('./error');

function getToken(req) {
  if (req.cookies && req.cookies[env.cookieName]) return req.cookies[env.cookieName];
  const header = req.headers.authorization;
  if (header && header.startsWith('Bearer ')) return header.slice(7);
  return null;
}

async function attachUser(req) {
  const token = getToken(req);
  if (!token) return null;
  try {
    const payload = verifyToken(token);
    const user = await User.findById(payload.sub);
    if (!user || !user.isActive) return null;
    return user;
  } catch {
    return null;
  }
}

async function optionalAuth(req, res, next) {
  req.user = await attachUser(req);
  next();
}

async function requireAuth(req, res, next) {
  const user = await attachUser(req);
  if (!user) return next(new AppError('Please log in to continue.', 401));
  req.user = user;
  next();
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) return next(new AppError('Please log in to continue.', 401));
    if (!roles.includes(req.user.role)) {
      return next(new AppError('You do not have permission to perform this action.', 403));
    }
    next();
  };
}

function isAdmin(req) {
  return req.user && req.user.role === 'admin';
}

module.exports = { optionalAuth, requireAuth, requireRole, isAdmin };
