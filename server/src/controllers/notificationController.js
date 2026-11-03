const Notification = require('../models/Notification');
const asyncHandler = require('../utils/asyncHandler');
const { AppError } = require('../middleware/error');
const { getPagination, paginationMeta } = require('../utils/pagination');

const listNotifications = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query, 20, 50);
  const [items, total, unread] = await Promise.all([
    Notification.find({ user: req.user._id }).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Notification.countDocuments({ user: req.user._id }),
    Notification.countDocuments({ user: req.user._id, read: false })
  ]);
  res.json({
    success: true,
    items,
    unread,
    pagination: paginationMeta(total, page, limit)
  });
});

const unreadCount = asyncHandler(async (req, res) => {
  const unread = await Notification.countDocuments({ user: req.user._id, read: false });
  res.json({ success: true, unread });
});

const markRead = asyncHandler(async (req, res) => {
  const notification = await Notification.findOneAndUpdate(
    { _id: req.params.id, user: req.user._id },
    { read: true },
    { new: true }
  );
  if (!notification) throw new AppError('Notification not found.', 404);
  res.json({ success: true, notification });
});

const markAllRead = asyncHandler(async (req, res) => {
  await Notification.updateMany({ user: req.user._id, read: false }, { read: true });
  res.json({ success: true });
});

const removeNotification = asyncHandler(async (req, res) => {
  const result = await Notification.deleteOne({ _id: req.params.id, user: req.user._id });
  if (!result.deletedCount) throw new AppError('Notification not found.', 404);
  res.json({ success: true });
});

module.exports = { listNotifications, unreadCount, markRead, markAllRead, removeNotification };
