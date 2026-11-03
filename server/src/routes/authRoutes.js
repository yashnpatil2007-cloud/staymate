const express = require('express');
const rateLimit = require('express-rate-limit');
const auth = require('../controllers/authController');
const validate = require('../middleware/validate');
const { requireAuth } = require('../middleware/auth');
const env = require('../config/env');
const {
  registerSchema,
  loginSchema,
  forgotSchema,
  resetSchema,
  updateProfileSchema,
  changePasswordSchema
} = require('../validators/schemas');

const router = express.Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: env.isProduction ? 20 : 200,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { success: false, message: 'Too many attempts. Please try again in a few minutes.' }
});

router.post('/register', authLimiter, validate(registerSchema), auth.register);
router.post('/login', authLimiter, validate(loginSchema), auth.login);
router.post('/logout', auth.logout);
router.get('/me', requireAuth, auth.me);
router.post('/forgot-password', authLimiter, validate(forgotSchema), auth.forgotPassword);
router.post('/reset-password', authLimiter, validate(resetSchema), auth.resetPassword);
router.patch('/profile', requireAuth, validate(updateProfileSchema), auth.updateProfile);
router.post('/change-password', requireAuth, validate(changePasswordSchema), auth.changePassword);

module.exports = router;
