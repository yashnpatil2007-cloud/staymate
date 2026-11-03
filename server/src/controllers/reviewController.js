const Review = require('../models/Review');
const Property = require('../models/Property');
const FoodProvider = require('../models/FoodProvider');
const User = require('../models/User');
const asyncHandler = require('../utils/asyncHandler');
const { AppError } = require('../middleware/error');
const { recalculateRating, getReviewState } = require('../utils/listing');
const { notify } = require('../utils/notify');

async function findListing(listingType, listingId) {
  if (listingType === 'property') return Property.findById(listingId);
  return FoodProvider.findById(listingId);
}

const listReviews = asyncHandler(async (req, res) => {
  const { listingType, listingId } = req.params;
  const reviews = await Review.find({ listingType, listingId, status: 'approved' })
    .populate('user', 'name avatar role city isDemo')
    .sort({ createdAt: -1 })
    .limit(100);
  res.json({
    success: true,
    items: reviews.map((review) => ({
      id: review._id,
      rating: review.rating,
      comment: review.comment,
      reviewerType: review.reviewerType || 'resident',
      verifiedInteraction: review.verifiedInteraction,
      createdAt: review.createdAt,
      user: review.user
        ? {
            id: review.user._id,
            name: review.user.name,
            avatar: review.user.avatar || '',
            role: review.user.role,
            city: review.user.city || '',
            isDemo: review.user.isDemo
          }
        : { name: 'StayMate user', avatar: '', role: 'customer' }
    }))
  });
});

const getEligibility = asyncHandler(async (req, res) => {
  const { listingType, listingId } = req.params;
  const state = await getReviewState(req.user._id, listingType, listingId);
  res.json({ success: true, ...state });
});

const createReview = asyncHandler(async (req, res) => {
  const { listingType, listingId, rating, comment, reviewerType } = req.body;
  const listing = await findListing(listingType, listingId);
  if (!listing || listing.status !== 'approved') {
    throw new AppError('Listing not found.', 404);
  }

  const existing = await Review.findOne({
    user: req.user._id,
    listingType,
    listingId
  });
  if (existing) throw new AppError('You have already reviewed this listing.', 409);

  const state = await getReviewState(req.user._id, listingType, listingId);
  if (!state.canReview) throw new AppError(state.reason, 403);

  const review = await Review.create({
    user: req.user._id,
    listingType,
    listingId,
    rating,
    comment,
    reviewerType: reviewerType || 'resident',
    verifiedInteraction: true,
    enquiry: state.enquiryId || undefined
  });

  await recalculateRating(listingType, listingId);

  const recipient = listingType === 'property' ? listing.owner : listing.user;
  if (recipient) {
    await notify({
      user: recipient,
      type: 'system',
      title: 'New review',
      message: `${req.user.name} left a ${rating}-star review on "${
        listingType === 'property' ? listing.name : listing.businessName
      }".`,
      link:
        listingType === 'property'
          ? `/accommodations/${listing._id}`
          : `/food/${listing._id}`
    });
  }

  res.status(201).json({ success: true, review });
});

const deleteReview = asyncHandler(async (req, res) => {
  const review = await Review.findById(req.params.id);
  if (!review) throw new AppError('Review not found.', 404);
  if (req.user.role !== 'admin' && !review.user.equals(req.user._id)) {
    throw new AppError('You can only delete your own review.', 403);
  }
  const { listingType, listingId } = review;
  await review.deleteOne();
  await recalculateRating(listingType, listingId);
  res.json({ success: true, message: 'Review deleted.' });
});

module.exports = { listReviews, getEligibility, createReview, deleteReview };
