const Property = require('../models/Property');
const User = require('../models/User');
const SavedListing = require('../models/SavedListing');
const asyncHandler = require('../utils/asyncHandler');
const escapeRegex = require('../utils/escapeRegex');
const { AppError } = require('../middleware/error');
const { getPagination, paginationMeta } = require('../utils/pagination');
const { getSavedIds, getReviewState } = require('../utils/listing');
const { notify } = require('../utils/notify');

function publicProperty(doc, savedSet) {
  const property = doc.toObject ? doc.toObject() : doc;
  return {
    ...property,
    id: property._id,
    isSaved: savedSet ? savedSet.has(property._id.toString()) : false,
    owner:
      property.owner && property.owner.name
        ? {
            id: property.owner._id,
            name: property.owner.name,
            avatar: property.owner.avatar || '',
            role: property.owner.role,
            isDemo: property.owner.isDemo,
            createdAt: property.owner.createdAt
          }
        : property.owner
  };
}

const listProperties = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query, 12);
  const query = { status: 'approved' };
  const {
    q,
    city,
    area,
    type,
    minBudget,
    maxBudget,
    gender,
    furnishing,
    food,
    beds,
    college,
    workplace,
    featured,
    ids,
    sort
  } = req.query;

  if (q) {
    const term = new RegExp(escapeRegex(q), 'i');
    query.$or = [
      { name: term },
      { description: term },
      { city: term },
      { area: term },
      { address: term }
    ];
  }
  if (city) query.city = new RegExp(`^${escapeRegex(city)}$`, 'i');
  if (area) query.area = new RegExp(escapeRegex(area), 'i');
  if (type) query.type = type;
  if (minBudget || maxBudget) {
    query.rent = {};
    if (minBudget) query.rent.$gte = Number(minBudget);
    if (maxBudget) query.rent.$lte = Number(maxBudget);
  }
  if (gender === 'male' || gender === 'female') {
    query.genderPreference = { $in: [gender, 'any'] };
  }
  if (furnishing) query.furnishing = furnishing;
  if (food === 'true' || food === 'available') query.amenities = { $in: ['food'] };
  if (beds) query.availableBeds = { $gte: Number(beds) || 1 };
  if (college) query.collegeNearby = new RegExp(escapeRegex(college), 'i');
  if (workplace) query.workplaceNearby = new RegExp(escapeRegex(workplace), 'i');
  if (featured === 'true') query.featured = true;
  if (ids) {
    const idList = String(ids)
      .split(',')
      .filter((id) => /^[a-f0-9]{24}$/i.test(id));
    query._id = { $in: idList };
  }

  const amenityList = [].concat(req.query.amenity || []).filter(Boolean);
  if (amenityList.length) {
    query.amenities = query.amenities
      ? { ...query.amenities, $all: amenityList }
      : { $all: amenityList };
  }

  const sortMap = {
    newest: { createdAt: -1 },
    price_asc: { rent: 1 },
    price_desc: { rent: -1 },
    rating: { ratingAvg: -1, reviewCount: -1 },
    popular: { views: -1, createdAt: -1 }
  };
  const sortBy = sortMap[sort] || sortMap.newest;

  const [items, total] = await Promise.all([
    Property.find(query)
      .populate('owner', 'name avatar role isDemo createdAt')
      .sort(sortBy)
      .skip(skip)
      .limit(limit),
    Property.countDocuments(query)
  ]);

  const savedSet = await getSavedIds(
    req.user && req.user._id,
    'property',
    items.map((item) => item._id)
  );

  res.json({
    success: true,
    items: items.map((item) => publicProperty(item, savedSet)),
    pagination: paginationMeta(total, page, limit)
  });
});

const getProperty = asyncHandler(async (req, res) => {
  const property = await Property.findById(req.params.id).populate(
    'owner',
    'name avatar role isDemo createdAt'
  );
  if (!property) throw new AppError('Property not found.', 404);

  const canViewUnapproved =
    req.user && (req.user.role === 'admin' || property.owner._id.equals(req.user._id));
  if (property.status !== 'approved' && !canViewUnapproved) {
    throw new AppError('Property not found.', 404);
  }

  if (property.status === 'approved') {
    Property.updateOne({ _id: property._id }, { $inc: { views: 1 } }).catch(() => {});
  }

  const [savedSet, reviewState, related] = await Promise.all([
    getSavedIds(req.user && req.user._id, 'property', [property._id]),
    getReviewState(req.user && req.user._id, 'property', property._id),
    Property.find({
      _id: { $ne: property._id },
      status: 'approved',
      $or: [{ city: property.city }, { type: property.type }]
    })
      .populate('owner', 'name avatar role isDemo createdAt')
      .limit(3)
  ]);

  res.json({
    success: true,
    property: publicProperty(property, savedSet),
    reviewState,
    related: related.map((item) => publicProperty(item))
  });
});

const createProperty = asyncHandler(async (req, res) => {
  const data = { ...req.body, owner: req.user._id };
  if (data.availableBeds > data.totalBeds) {
    throw new AppError('Available beds cannot exceed total beds.', 400);
  }
  if (data.coordinates && (!data.coordinates.lat || !data.coordinates.lng)) {
    data.coordinates = undefined;
  }
  const isAdmin = req.user.role === 'admin';
  data.status = isAdmin ? 'approved' : 'pending';

  const property = await Property.create(data);

  if (!isAdmin) {
    await notify({
      user: req.user._id,
      type: 'listing_status',
      title: 'Property submitted for review',
      message: `"${property.name}" is pending administrator approval. You will be notified once it is reviewed.`,
      link: '/owner/listings'
    });
    const admins = await User.find({ role: 'admin' }).select('_id');
    await Promise.all(
      admins.map((admin) =>
        notify({
          user: admin._id,
          type: 'listing_status',
          title: 'New property listing awaiting approval',
          message: `"${property.name}" in ${property.city} was submitted by ${req.user.name}.`,
          link: '/admin/listings'
        })
      )
    );
  }

  res.status(201).json({ success: true, property });
});

const updateProperty = asyncHandler(async (req, res) => {
  const property = await Property.findById(req.params.id);
  if (!property) throw new AppError('Property not found.', 404);
  const isAdmin = req.user.role === 'admin';
  if (!isAdmin && !property.owner.equals(req.user._id)) {
    throw new AppError('You can only edit your own listings.', 403);
  }

  const fields = [
    'name',
    'description',
    'type',
    'city',
    'area',
    'address',
    'collegeNearby',
    'workplaceNearby',
    'coordinates',
    'rent',
    'deposit',
    'genderPreference',
    'furnishing',
    'occupancy',
    'totalBeds',
    'availableBeds',
    'amenities',
    'houseRules',
    'images',
    'availabilityNote'
  ];
  fields.forEach((field) => {
    if (req.body[field] !== undefined) property[field] = req.body[field];
  });

  if (property.availableBeds > property.totalBeds) {
    throw new AppError('Available beds cannot exceed total beds.', 400);
  }

  if (isAdmin && req.body.status) property.status = req.body.status;

  await property.save();
  res.json({ success: true, property });
});

const deleteProperty = asyncHandler(async (req, res) => {
  const property = await Property.findById(req.params.id);
  if (!property) throw new AppError('Property not found.', 404);
  if (req.user.role !== 'admin' && !property.owner.equals(req.user._id)) {
    throw new AppError('You can only delete your own listings.', 403);
  }
  await Promise.all([
    property.deleteOne(),
    SavedListing.deleteMany({ listingType: 'property', listingId: property._id })
  ]);
  res.json({ success: true, message: 'Property deleted.' });
});

const myProperties = asyncHandler(async (req, res) => {
  const items = await Property.find({ owner: req.user._id }).sort({ createdAt: -1 });
  res.json({ success: true, items });
});

const getCities = asyncHandler(async (req, res) => {
  const FoodProvider = require('../models/FoodProvider');
  const [propertyCities, foodCities] = await Promise.all([
    Property.aggregate([
      { $match: { status: 'approved' } },
      {
        $group: {
          _id: '$city',
          count: { $sum: 1 },
          image: { $first: { $arrayElemAt: ['$images', 0] } },
          minRent: { $min: '$rent' }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 12 }
    ]),
    FoodProvider.aggregate([
      { $match: { status: 'approved' } },
      { $group: { _id: '$city', count: { $sum: 1 } } }
    ])
  ]);

  const cityMap = new Map();
  propertyCities.forEach((item) => {
    cityMap.set(item._id, {
      city: item._id,
      count: item.count,
      image: item.image || '',
      minRent: item.minRent,
      foodCount: 0
    });
  });
  foodCities.forEach((item) => {
    if (cityMap.has(item._id)) cityMap.get(item._id).foodCount = item.count;
  });

  res.json({ success: true, cities: Array.from(cityMap.values()) });
});

const getHomeSummary = asyncHandler(async (req, res) => {
  const [featured, stats, foodCount, cityCount] = await Promise.all([
    Property.find({ status: 'approved', featured: true })
      .populate('owner', 'name avatar role isDemo createdAt')
      .sort({ createdAt: -1 })
      .limit(6),
    Property.countDocuments({ status: 'approved' }),
    require('../models/FoodProvider').countDocuments({ status: 'approved' }),
    Property.distinct('city', { status: 'approved' })
  ]);

  let featuredList = featured;
  if (featuredList.length < 6) {
    const extra = await Property.find({
      status: 'approved',
      _id: { $nin: featuredList.map((item) => item._id) }
    })
      .populate('owner', 'name avatar role isDemo createdAt')
      .sort({ ratingAvg: -1, createdAt: -1 })
      .limit(6 - featuredList.length);
    featuredList = featuredList.concat(extra);
  }

  res.json({
    success: true,
    featured: featuredList.map((item) => publicProperty(item)),
    stats: {
      properties: stats,
      foodProviders: foodCount,
      cities: cityCount.length
    }
  });
});

module.exports = {
  listProperties,
  getProperty,
  createProperty,
  updateProperty,
  deleteProperty,
  myProperties,
  getCities,
  getHomeSummary
};
