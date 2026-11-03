const bcrypt = require('bcryptjs');
const User = require('../models/User');
const env = require('../config/env');
const asyncHandler = require('../utils/asyncHandler');
const { AppError } = require('../middleware/error');
const { signToken, setAuthCookie, clearAuthCookie, createResetToken, hashResetToken } = require('../utils/token');
const { sendEmail } = require('../utils/mailer');
const { notify } = require('../utils/notify');

const BCRYPT_ROUNDS = 12;

const register = asyncHandler(async (req, res) => {
  const { name, email, password, role, phone, city } = req.body;

  const existing = await User.findOne({ email });
  if (existing) {
    throw new AppError('An account with this email already exists.', 409);
  }

  const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
  const user = await User.create({ name, email, passwordHash, role, phone, city });
  const token = signToken(user);
  setAuthCookie(res, token);

  await notify({
    user: user._id,
    type: 'account',
    title: 'Welcome to StayMate',
    message:
      role === 'owner'
        ? 'Your property owner account is ready. Add your first listing to get discovered.'
        : role === 'food_provider'
          ? 'Your food provider account is ready. Create your business profile to start receiving enquiries.'
          : 'Start exploring verified accommodation, roommates and food services near you.',
    link:
      role === 'owner'
        ? '/owner/listings/new'
        : role === 'food_provider'
          ? '/provider/listings/new'
          : '/accommodations'
  });

  res.status(201).json({ success: true, token, user: user.toSafeJSON() });
});

const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email }).select('+passwordHash');
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    throw new AppError('Incorrect email or password.', 401);
  }
  if (!user.isActive) {
    throw new AppError('This account has been suspended. Please contact support.', 403);
  }

  user.lastLoginAt = new Date();
  await user.save({ validateBeforeSave: false });

  const token = signToken(user);
  setAuthCookie(res, token);
  res.json({ success: true, token, user: user.toSafeJSON() });
});

const logout = asyncHandler(async (req, res) => {
  clearAuthCookie(res);
  res.json({ success: true, message: 'Logged out.' });
});

const me = asyncHandler(async (req, res) => {
  res.json({ success: true, user: req.user.toSafeJSON() });
});

const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email });
  let devResetUrl;

  if (user) {
    const { raw, hashed } = createResetToken();
    user.resetTokenHash = hashed;
    user.resetTokenExpires = new Date(Date.now() + 60 * 60 * 1000);
    await user.save({ validateBeforeSave: false });

    const resetUrl = `${env.clientUrl}/reset-password?token=${raw}`;
    const emailResult = await sendEmail({
      to: user.email,
      subject: 'Reset your StayMate password',
      text: `Reset your StayMate password using this link (valid for 1 hour): ${resetUrl}`,
      html: `<p>Hello ${user.name},</p><p>Reset your StayMate password using the link below. It is valid for 1 hour.</p><p><a href="${resetUrl}">Reset password</a></p><p>If you did not request this, you can ignore this email.</p>`
    });

    if (!emailResult.sent && !env.isProduction && !env.emailEnabled) {
      devResetUrl = resetUrl;
    }
  }

  res.json({
    success: true,
    message: 'If an account exists for that email, a password reset link has been created.',
    ...(devResetUrl
      ? {
          emailConfigured: false,
          devResetUrl,
          note: 'Email delivery is not configured. This development reset link is shown only in development.'
        }
      : {})
  });
});

const resetPassword = asyncHandler(async (req, res) => {
  const { token, password } = req.body;
  const hashed = hashResetToken(token);
  const user = await User.findOne({
    resetTokenHash: hashed,
    resetTokenExpires: { $gt: new Date() }
  }).select('+passwordHash +resetTokenHash +resetTokenExpires');

  if (!user) {
    throw new AppError('This password reset link is invalid or has expired.', 400);
  }

  user.passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
  user.resetTokenHash = undefined;
  user.resetTokenExpires = undefined;
  await user.save({ validateBeforeSave: false });

  clearAuthCookie(res);
  await notify({
    user: user._id,
    type: 'account',
    title: 'Password updated',
    message: 'Your StayMate password was changed. If this was not you, contact support immediately.',
    link:
      user.role === 'admin'
        ? '/admin/settings'
        : user.role === 'owner'
          ? '/owner/settings'
          : user.role === 'food_provider'
            ? '/provider/settings'
            : '/dashboard/settings'
  });

  res.json({ success: true, message: 'Password reset successfully. You can now log in.' });
});

const updateProfile = asyncHandler(async (req, res) => {
  const allowed = ['name', 'phone', 'city', 'bio', 'avatar'];
  allowed.forEach((field) => {
    if (req.body[field] !== undefined) req.user[field] = req.body[field];
  });
  await req.user.save();
  res.json({ success: true, user: req.user.toSafeJSON() });
});

const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const user = await User.findById(req.user._id).select('+passwordHash');
  if (!(await bcrypt.compare(currentPassword, user.passwordHash))) {
    throw new AppError('Current password is incorrect.', 400);
  }
  user.passwordHash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);
  await user.save({ validateBeforeSave: false });
  clearAuthCookie(res);
  res.json({ success: true, message: 'Password changed. Please log in again.' });
});

module.exports = {
  register,
  login,
  logout,
  me,
  forgotPassword,
  resetPassword,
  updateProfile,
  changePassword
};
