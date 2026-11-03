const User = require('../models/User');
const Property = require('../models/Property');
const FoodProvider = require('../models/FoodProvider');
const Enquiry = require('../models/Enquiry');
const Review = require('../models/Review');
const Report = require('../models/Report');
const RoommateProfile = require('../models/RoommateProfile');
const MealPlan = require('../models/MealPlan');
const RoommateRequest = require('../models/RoommateRequest');
const SavedListing = require('../models/SavedListing');
const Notification = require('../models/Notification');
const asyncHandler = require('../utils/asyncHandler');
const { AppError } = require('../middleware/error');
const { getPagination, paginationMeta } = require('../utils/pagination');
const { notify } = require('../utils/notify');
const { recalculateRating } = require('../utils/listing');
const escapeRegex = require('../utils/escapeRegex');

const getStats = asyncHandler(async (req, res) => {
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const [
    totalUsers,
    customers,
    owners,
    providers,
    totalProperties,
    pendingProperties,
    approvedProperties,
    totalFood,
    pendingFood,
    approvedFood,
    enquiries,
    openReports,
    reviews,
    newUsers,
    roommateProfiles
  ] = await Promise.all([
    User.countDocuments(),
    User.countDocuments({ role: 'customer' }),
    User.countDocuments({ role: 'owner' }),
    User.countDocuments({ role: 'food_provider' }),
    Property.countDocuments(),
    Property.countDocuments({ status: 'pending' }),
    Property.countDocuments({ status: 'approved' }),
    FoodProvider.countDocuments(),
    FoodProvider.countDocuments({ status: 'pending' }),
    FoodProvider.countDocuments({ status: 'approved' }),
    Enquiry.countDocuments(),
    Report.countDocuments({ status: 'open' }),
    Review.countDocuments({ status: 'approved' }),
    User.countDocuments({ createdAt: { $gte: weekAgo } }),
    RoommateProfile.countDocuments()
  ]);

  const [recentUsers, recentProperties, recentReports] = await Promise.all([
    User.find().select('name email role createdAt isActive isDemo').sort({ createdAt: -1 }).limit(5),
    Property.find({ status: 'pending' }).populate('owner', 'name email').sort({ createdAt: -1 }).limit(5),
    Report.find({ status: 'open' }).populate('reporter', 'name email').sort({ createdAt: -1 }).limit(5)
  ]);

  res.json({
    success: true,
    stats: {
      totalUsers,
      customers,
      owners,
      providers,
      totalProperties,
      pendingProperties,
      approvedProperties,
      totalFood,
      pendingFood,
      approvedFood,
      enquiries,
      openReports,
      reviews,
      newUsers,
      roommateProfiles
    },
    recentUsers,
    recentProperties,
    recentReports
  });
});

const listUsers = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query, 20, 100);
  const query = {};
  if (req.query.role && req.query.role !== 'all') query.role = req.query.role;
  if (req.query.q) {
    const term = new RegExp(escapeRegex(req.query.q), 'i');
    query.$or = [{ name: term }, { email: term }, { city: term }];
  }
  if (req.query.active === 'true') query.isActive = true;
  if (req.query.active === 'false') query.isActive = false;

  const [items, total] = await Promise.all([
    User.find(query).select('name email role phone city isActive isDemo createdAt lastLoginAt').sort({ createdAt: -1 }).skip(skip).limit(limit),
    User.countDocuments(query)
  ]);
  res.json({ success: true, items, pagination: paginationMeta(total, page, limit) });
});

const updateUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) throw new AppError('User not found.', 404);
  if (user._id.equals(req.user._id)) {
    throw new AppError('You cannot change your own role or suspension status here.', 400);
  }

  if (req.body.role) {
    if (!['customer', 'owner', 'food_provider', 'admin'].includes(req.body.role)) {
      throw new AppError('Invalid role.', 400);
    }
    user.role = req.body.role;
  }
  if (typeof req.body.isActive === 'boolean') user.isActive = req.body.isActive;
  await user.save({ validateBeforeSave: false });

  await notify({
    user: user._id,
    type: 'account',
    title: user.isActive ? 'Account updated' : 'Account suspended',
    message: user.isActive
      ? `Your account role is now ${user.role.replace('_', ' ')}.`
      : 'Your StayMate account has been suspended. Contact support if you believe this is a mistake.',
    link: !user.isActive
      ? '/'
      : user.role === 'admin'
        ? '/admin'
        : user.role === 'owner'
          ? '/owner'
          : user.role === 'food_provider'
            ? '/provider'
            : '/dashboard'
  });

  res.json({
    success: true,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone,
      city: user.city,
      isActive: user.isActive,
      isDemo: user.isDemo,
      createdAt: user.createdAt
    }
  });
});

const listProperties = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query, 20, 100);
  const query = {};
  if (req.query.status && req.query.status !== 'all') query.status = req.query.status;
  if (req.query.q) {
    const term = new RegExp(escapeRegex(req.query.q), 'i');
    query.$or = [{ name: term }, { city: term }, { area: term }];
  }
  const [items, total] = await Promise.all([
    Property.find(query).populate('owner', 'name email isDemo').sort({ createdAt: -1 }).skip(skip).limit(limit),
    Property.countDocuments(query)
  ]);
  res.json({ success: true, items, pagination: paginationMeta(total, page, limit) });
});

const moderateProperty = asyncHandler(async (req, res) => {
  const property = await Property.findById(req.params.id);
  if (!property) throw new AppError('Property not found.', 404);
  const { status, rejectionReason, featured } = req.body;
  if (status && !['pending', 'approved', 'rejected'].includes(status)) {
    throw new AppError('Invalid status.', 400);
  }
  if (status) property.status = status;
  if (typeof featured === 'boolean') property.featured = featured;
  property.rejectionReason = status === 'rejected' ? rejectionReason || 'Listing did not meet our guidelines.' : '';
  await property.save();

  if (status) {
    await notify({
      user: property.owner,
      type: 'listing_status',
      title: status === 'approved' ? 'Your property is live' : status === 'rejected' ? 'Property listing needs changes' : 'Property listing updated',
      message:
        status === 'approved'
          ? `"${property.name}" has been approved and is now visible to customers.`
          : status === 'rejected'
            ? `"${property.name}" was rejected: ${property.rejectionReason}`
            : `"${property.name}" is back under review.`,
      link: '/owner/listings'
    });
  }

  res.json({ success: true, property });
});

const listFood = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query, 20, 100);
  const query = {};
  if (req.query.status && req.query.status !== 'all') query.status = req.query.status;
  if (req.query.q) {
    const term = new RegExp(escapeRegex(req.query.q), 'i');
    query.$or = [{ businessName: term }, { city: term }, { area: term }];
  }
  const [items, total] = await Promise.all([
    FoodProvider.find(query).populate('user', 'name email isDemo').sort({ createdAt: -1 }).skip(skip).limit(limit),
    FoodProvider.countDocuments(query)
  ]);
  res.json({ success: true, items, pagination: paginationMeta(total, page, limit) });
});

const moderateFood = asyncHandler(async (req, res) => {
  const food = await FoodProvider.findById(req.params.id);
  if (!food) throw new AppError('Food service not found.', 404);
  const { status, rejectionReason } = req.body;
  if (status && !['pending', 'approved', 'rejected'].includes(status)) {
    throw new AppError('Invalid status.', 400);
  }
  if (status) food.status = status;
  food.rejectionReason = status === 'rejected' ? rejectionReason || 'Listing did not meet our guidelines.' : '';
  await food.save();

  if (status) {
    await notify({
      user: food.user,
      type: 'listing_status',
      title: status === 'approved' ? 'Your food service is live' : 'Food service listing needs changes',
      message:
        status === 'approved'
          ? `"${food.businessName}" has been approved and is now visible to customers.`
          : `"${food.businessName}" was rejected: ${food.rejectionReason}`,
      link: '/provider/listings'
    });
  }

  res.json({ success: true, food });
});

const listReports = asyncHandler(async (req, res) => {
  const query = {};
  if (req.query.status && req.query.status !== 'all') query.status = req.query.status;

  const reports = await Report.find(query)
    .populate('reporter', 'name email role')
    .sort({ createdAt: -1 })
    .limit(200);

  const items = await Promise.all(
    reports.map(async (report) => {
      let targetName = '';
      let targetLink = '';
      if (report.targetType === 'property') {
        const doc = await Property.findById(report.targetId).select('name city');
        targetName = doc ? `${doc.name} (${doc.city})` : 'Deleted property';
        targetLink = `/accommodations/${report.targetId}`;
      } else if (report.targetType === 'food') {
        const doc = await FoodProvider.findById(report.targetId).select('businessName city');
        targetName = doc ? `${doc.businessName} (${doc.city})` : 'Deleted food service';
        targetLink = `/food/${report.targetId}`;
      } else if (report.targetType === 'user') {
        const doc = await User.findById(report.targetId).select('name email');
        targetName = doc ? `${doc.name} (${doc.email})` : 'Deleted user';
      } else {
        const doc = await Review.findById(report.targetId).select('comment rating');
        targetName = doc ? `Review ${doc.rating}★: ${doc.comment.slice(0, 60)}` : 'Deleted review';
      }
      return { ...report.toObject(), targetName, targetLink };
    })
  );

  res.json({ success: true, items });
});

const updateReport = asyncHandler(async (req, res) => {
  const report = await Report.findById(req.params.id);
  if (!report) throw new AppError('Report not found.', 404);
  const { status, adminNote } = req.body;
  if (status) {
    if (!['open', 'reviewed', 'dismissed'].includes(status)) {
      throw new AppError('Invalid status.', 400);
    }
    report.status = status;
  }
  if (adminNote !== undefined) report.adminNote = adminNote;
  await report.save();
  res.json({ success: true, report });
});

const listReviews = asyncHandler(async (req, res) => {
  const query = {};
  if (req.query.status && req.query.status !== 'all') query.status = req.query.status;
  const reviews = await Review.find(query)
    .populate('user', 'name email isDemo')
    .sort({ createdAt: -1 })
    .limit(200);
  res.json({ success: true, items: reviews });
});

const moderateReview = asyncHandler(async (req, res) => {
  const review = await Review.findById(req.params.id);
  if (!review) throw new AppError('Review not found.', 404);
  if (req.body.status && !['approved', 'hidden'].includes(req.body.status)) {
    throw new AppError('Invalid status.', 400);
  }
  if (req.body.status) review.status = req.body.status;
  await review.save();
  await recalculateRating(review.listingType, review.listingId);
  res.json({ success: true, review });
});

const deleteReview = asyncHandler(async (req, res) => {
  const review = await Review.findById(req.params.id);
  if (!review) throw new AppError('Review not found.', 404);
  const { listingType, listingId } = review;
  await review.deleteOne();
  await recalculateRating(listingType, listingId);
  res.json({ success: true, message: 'Review deleted.' });
});

const deleteUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) throw new AppError('User not found.', 404);
  if (user._id.equals(req.user._id)) throw new AppError('You cannot delete your own admin account.', 400);
  if (user.role === 'admin') throw new AppError('Admin accounts cannot be deleted from the panel.', 400);

  const [properties, foodDocs] = await Promise.all([
    Property.find({ owner: user._id }).select('_id'),
    FoodProvider.find({ user: user._id }).select('_id')
  ]);
  const propertyIds = properties.map((doc) => doc._id);
  const foodIds = foodDocs.map((doc) => doc._id);

  await Promise.all([
    Property.deleteMany({ owner: user._id }),
    FoodProvider.deleteMany({ user: user._id }),
    MealPlan.deleteMany({ provider: { $in: foodIds } }),
    RoommateProfile.deleteMany({ user: user._id }),
    RoommateRequest.deleteMany({ $or: [{ from: user._id }, { to: user._id }] }),
    Enquiry.deleteMany({ $or: [{ user: user._id }, { recipient: user._id }] }),
    Review.deleteMany({ user: user._id }),
    Report.deleteMany({ reporter: user._id }),
    SavedListing.deleteMany({ user: user._id }),
    Notification.deleteMany({ user: user._id }),
    SavedListing.deleteMany({
      $or: [
        { listingType: 'property', listingId: { $in: propertyIds } },
        { listingType: 'food', listingId: { $in: foodIds } }
      ]
    }),
    Enquiry.deleteMany({
      $or: [
        { listingType: 'property', listingId: { $in: propertyIds } },
        { listingType: 'food', listingId: { $in: foodIds } }
      ]
    }),
    Review.deleteMany({
      $or: [
        { listingType: 'property', listingId: { $in: propertyIds } },
        { listingType: 'food', listingId: { $in: foodIds } }
      ]
    })
  ]);
  await User.findByIdAndDelete(user._id);
  res.json({ success: true, message: 'User and related records deleted.' });
});

module.exports = {
  getStats,
  listUsers,
  updateUser,
  listProperties,
  moderateProperty,
  listFood,
  moderateFood,
  listReports,
  updateReport,
  listReviews,
  moderateReview,
  deleteReview,
  deleteUser
};
