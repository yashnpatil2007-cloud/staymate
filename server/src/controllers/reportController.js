const Report = require('../models/Report');
const Property = require('../models/Property');
const FoodProvider = require('../models/FoodProvider');
const User = require('../models/User');
const Review = require('../models/Review');
const asyncHandler = require('../utils/asyncHandler');
const { AppError } = require('../middleware/error');

const createReport = asyncHandler(async (req, res) => {
  const { targetType, targetId, reason, details } = req.body;

  const Model =
    targetType === 'property'
      ? Property
      : targetType === 'food'
        ? FoodProvider
        : targetType === 'user'
          ? User
          : Review;
  const target = await Model.findById(targetId);
  if (!target) throw new AppError('Reported item not found.', 404);

  if (targetType === 'user' && targetId === req.user._id.toString()) {
    throw new AppError('You cannot report yourself.', 400);
  }

  const existing = await Report.findOne({
    reporter: req.user._id,
    targetType,
    targetId,
    status: 'open'
  });
  if (existing) {
    throw new AppError('You already reported this item. Our team is reviewing it.', 409);
  }

  const report = await Report.create({
    reporter: req.user._id,
    targetType,
    targetId,
    reason,
    details
  });

  res.status(201).json({ success: true, report });
});

module.exports = { createReport };
