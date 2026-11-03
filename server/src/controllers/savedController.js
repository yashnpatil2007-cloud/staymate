const SavedListing = require('../models/SavedListing');
const Property = require('../models/Property');
const FoodProvider = require('../models/FoodProvider');
const asyncHandler = require('../utils/asyncHandler');
const { AppError } = require('../middleware/error');

const toggleSaved = asyncHandler(async (req, res) => {
  const { listingType, listingId } = req.body;
  if (!['property', 'food'].includes(listingType)) {
    throw new AppError('Invalid listing type.', 400);
  }
  const Model = listingType === 'property' ? Property : FoodProvider;
  const exists = await Model.findById(listingId);
  if (!exists || exists.status !== 'approved') {
    throw new AppError('Listing not found.', 404);
  }

  const existing = await SavedListing.findOne({
    user: req.user._id,
    listingType,
    listingId
  });
  if (existing) {
    await existing.deleteOne();
    return res.json({ success: true, saved: false });
  }

  await SavedListing.create({ user: req.user._id, listingType, listingId });
  res.status(201).json({ success: true, saved: true });
});

const listSaved = asyncHandler(async (req, res) => {
  const saved = await SavedListing.find({ user: req.user._id }).sort({ createdAt: -1 });
  const propertyIds = saved.filter((item) => item.listingType === 'property').map((item) => item.listingId);
  const foodIds = saved.filter((item) => item.listingType === 'food').map((item) => item.listingId);

  const [properties, foods] = await Promise.all([
    Property.find({ _id: { $in: propertyIds }, status: 'approved' }).populate(
      'owner',
      'name avatar role isDemo createdAt'
    ),
    FoodProvider.find({ _id: { $in: foodIds }, status: 'approved' }).populate(
      'user',
      'name avatar isDemo'
    )
  ]);

  const propertyMap = new Map(properties.map((item) => [item._id.toString(), item]));
  const foodMap = new Map(foods.map((item) => [item._id.toString(), item]));

  const items = saved
    .map((item) => {
      const doc = item.listingType === 'property' ? propertyMap.get(item.listingId.toString()) : foodMap.get(item.listingId.toString());
      if (!doc) return null;
      return {
        id: item._id,
        listingType: item.listingType,
        savedAt: item.createdAt,
        listing: { ...doc.toObject(), isSaved: true }
      };
    })
    .filter(Boolean);

  res.json({ success: true, items });
});

module.exports = { toggleSaved, listSaved };
