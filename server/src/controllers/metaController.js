const Review = require('../models/Review');
const Property = require('../models/Property');
const FoodProvider = require('../models/FoodProvider');
const asyncHandler = require('../utils/asyncHandler');

const getTestimonials = asyncHandler(async (req, res) => {
  const reviews = await Review.find({ status: 'approved' })
    .populate('user', 'name avatar city isDemo role')
    .sort({ rating: -1, createdAt: -1 })
    .limit(6);

  const items = await Promise.all(
    reviews.map(async (review) => {
      const listing =
        review.listingType === 'property'
          ? await Property.findById(review.listingId).select('name city')
          : await FoodProvider.findById(review.listingId).select('businessName city');
      return {
        id: review._id,
        rating: review.rating,
        comment: review.comment,
        reviewerType: review.reviewerType || 'resident',
        createdAt: review.createdAt,
        user: review.user
          ? {
              name: review.user.name,
              avatar: review.user.avatar || '',
              city: review.user.city || '',
              role: review.user.role || 'customer',
              isDemo: review.user.isDemo
            }
          : null,
        listing: listing
          ? {
              name: review.listingType === 'property' ? listing.name : listing.businessName,
              city: listing.city,
              link:
                review.listingType === 'property'
                  ? `/accommodations/${review.listingId}`
                  : `/food/${review.listingId}`
            }
          : null
      };
    })
  );

  res.json({ success: true, items });
});

const getPlaces = asyncHandler(async (req, res) => {
  const [propertyPlaces, foodPlaces] = await Promise.all([
    Property.find({ status: 'approved' }).select('city area').lean(),
    FoodProvider.find({ status: 'approved' }).select('city area').lean()
  ]);

  const cities = new Set();
  const areasByCity = {};
  [...propertyPlaces, ...foodPlaces].forEach((item) => {
    if (!item.city) return;
    cities.add(item.city);
    if (item.area) {
      if (!areasByCity[item.city]) areasByCity[item.city] = new Set();
      areasByCity[item.city].add(item.area);
    }
  });

  const areaMap = {};
  Object.keys(areasByCity).forEach((city) => {
    areaMap[city] = Array.from(areasByCity[city]).sort();
  });

  res.json({
    success: true,
    cities: Array.from(cities).sort(),
    areas: areaMap
  });
});

module.exports = { getTestimonials, getPlaces };
