const Property = require('../models/Property');
const FoodProvider = require('../models/FoodProvider');
const Review = require('../models/Review');
const Enquiry = require('../models/Enquiry');
const SavedListing = require('../models/SavedListing');

async function recalculateRating(listingType, listingId) {
  const stats = await Review.aggregate([
    {
      $match: {
        listingType,
        listingId: new (require('mongoose').Types.ObjectId)(String(listingId)),
        status: 'approved'
      }
    },
    { $group: { _id: null, avg: { $avg: '$rating' }, count: { $sum: 1 } } }
  ]);

  const avg = stats.length ? Math.round(stats[0].avg * 10) / 10 : 0;
  const count = stats.length ? stats[0].count : 0;
  const Model = listingType === 'property' ? Property : FoodProvider;
  await Model.findByIdAndUpdate(listingId, { ratingAvg: avg, reviewCount: count });
  return { avg, count };
}

async function getReviewState(userId, listingType, listingId) {
  if (!userId) {
    return {
      canReview: false,
      reason: 'Log in after contacting the provider to leave a review.',
      hasReviewed: false
    };
  }

  const existing = await Review.findOne({ user: userId, listingType, listingId });
  if (existing) {
    return { canReview: false, reason: 'You have already reviewed this listing.', hasReviewed: true };
  }

  const enquiry = await Enquiry.findOne({
    user: userId,
    listingType,
    listingId,
    status: 'contacted'
  }).sort({ createdAt: -1 });

  if (!enquiry) {
    return {
      canReview: false,
      reason:
        'Reviews are available after a verified interaction: send an enquiry and wait for the provider to mark it as contacted.',
      hasReviewed: false
    };
  }

  return { canReview: true, reason: '', hasReviewed: false, enquiryId: enquiry._id };
}

async function getSavedIds(userId, listingType, ids) {
  if (!userId || !ids.length) return new Set();
  const saved = await SavedListing.find({
    user: userId,
    listingType,
    listingId: { $in: ids }
  }).select('listingId');
  return new Set(saved.map((item) => item.listingId.toString()));
}

module.exports = { recalculateRating, getReviewState, getSavedIds };
