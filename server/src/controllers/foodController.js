const FoodProvider = require('../models/FoodProvider');
const MealPlan = require('../models/MealPlan');
const User = require('../models/User');
const SavedListing = require('../models/SavedListing');
const asyncHandler = require('../utils/asyncHandler');
const escapeRegex = require('../utils/escapeRegex');
const { AppError } = require('../middleware/error');
const { getPagination, paginationMeta } = require('../utils/pagination');
const { getSavedIds, getReviewState } = require('../utils/listing');
const { notify } = require('../utils/notify');

function publicFood(doc, savedSet) {
  const food = doc.toObject ? doc.toObject() : doc;
  return {
    ...food,
    id: food._id,
    isSaved: savedSet ? savedSet.has(food._id.toString()) : false,
    user:
      food.user && food.user.name
        ? {
            id: food.user._id,
            name: food.user.name,
            avatar: food.user.avatar || '',
            isDemo: food.user.isDemo
          }
        : food.user
  };
}

const listFood = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query, 12);
  const query = { status: 'approved' };
  const { q, city, area, type, minBudget, maxBudget, foodType, meal, ids, sort } = req.query;

  if (q) {
    const term = new RegExp(escapeRegex(q), 'i');
    query.$or = [
      { businessName: term },
      { description: term },
      { city: term },
      { area: term },
      { menu: term }
    ];
  }
  if (city) query.city = new RegExp(`^${escapeRegex(city)}$`, 'i');
  if (area) query.area = new RegExp(escapeRegex(area), 'i');
  if (type) query.type = type;
  if (foodType) {
    query.foodType = foodType === 'veg' ? { $in: ['veg', 'both'] } : foodType === 'non_veg' ? { $in: ['non_veg', 'both'] } : foodType;
  }
  if (minBudget || maxBudget) {
    query.pricePerMonth = {};
    if (minBudget) query.pricePerMonth.$gte = Number(minBudget);
    if (maxBudget) query.pricePerMonth.$lte = Number(maxBudget);
  }
  if (meal) query.mealAvailability = { $in: [meal] };
  if (ids) {
    const idList = String(ids)
      .split(',')
      .filter((id) => /^[a-f0-9]{24}$/i.test(id));
    query._id = { $in: idList };
  }

  const sortMap = {
    newest: { createdAt: -1 },
    price_asc: { pricePerMonth: 1 },
    price_desc: { pricePerMonth: -1 },
    rating: { ratingAvg: -1, reviewCount: -1 }
  };

  const [items, total] = await Promise.all([
    FoodProvider.find(query)
      .populate('user', 'name avatar isDemo')
      .sort(sortMap[sort] || sortMap.newest)
      .skip(skip)
      .limit(limit),
    FoodProvider.countDocuments(query)
  ]);

  const savedSet = await getSavedIds(
    req.user && req.user._id,
    'food',
    items.map((item) => item._id)
  );

  res.json({
    success: true,
    items: items.map((item) => publicFood(item, savedSet)),
    pagination: paginationMeta(total, page, limit)
  });
});

const getFood = asyncHandler(async (req, res) => {
  const food = await FoodProvider.findById(req.params.id).populate(
    'user',
    'name avatar isDemo'
  );
  if (!food) throw new AppError('Food service not found.', 404);

  const canViewUnapproved =
    req.user && (req.user.role === 'admin' || food.user._id.equals(req.user._id));
  if (food.status !== 'approved' && !canViewUnapproved) {
    throw new AppError('Food service not found.', 404);
  }

  if (food.status === 'approved') {
    FoodProvider.updateOne({ _id: food._id }, { $inc: { views: 1 } }).catch(() => {});
  }

  const [mealPlans, savedSet, reviewState, related] = await Promise.all([
    MealPlan.find({ provider: food._id, isActive: true }).sort({ pricePerMonth: 1 }),
    getSavedIds(req.user && req.user._id, 'food', [food._id]),
    getReviewState(req.user && req.user._id, 'food', food._id),
    FoodProvider.find({
      _id: { $ne: food._id },
      status: 'approved',
      $or: [{ city: food.city }, { type: food.type }]
    })
      .populate('user', 'name avatar isDemo')
      .limit(3)
  ]);

  res.json({
    success: true,
    food: publicFood(food, savedSet),
    mealPlans,
    reviewState,
    related: related.map((item) => publicFood(item))
  });
});

const createFood = asyncHandler(async (req, res) => {
  const isAdmin = req.user.role === 'admin';
  const food = await FoodProvider.create({
    ...req.body,
    user: req.user._id,
    status: isAdmin ? 'approved' : 'pending'
  });

  if (!isAdmin) {
    await notify({
      user: req.user._id,
      type: 'listing_status',
      title: 'Food service submitted for review',
      message: `"${food.businessName}" is pending administrator approval.`,
      link: '/provider/listings'
    });
    const admins = await User.find({ role: 'admin' }).select('_id');
    await Promise.all(
      admins.map((admin) =>
        notify({
          user: admin._id,
          type: 'listing_status',
          title: 'New food service awaiting approval',
          message: `"${food.businessName}" in ${food.city} was submitted by ${req.user.name}.`,
          link: '/admin/food'
        })
      )
    );
  }

  res.status(201).json({ success: true, food });
});

const updateFood = asyncHandler(async (req, res) => {
  const food = await FoodProvider.findById(req.params.id);
  if (!food) throw new AppError('Food service not found.', 404);
  const isAdmin = req.user.role === 'admin';
  if (!isAdmin && !food.user.equals(req.user._id)) {
    throw new AppError('You can only edit your own listings.', 403);
  }

  const fields = [
    'businessName',
    'description',
    'type',
    'city',
    'area',
    'address',
    'pricePerMonth',
    'mealAvailability',
    'foodType',
    'menu',
    'images',
    'phone'
  ];
  fields.forEach((field) => {
    if (req.body[field] !== undefined) food[field] = req.body[field];
  });
  if (isAdmin && req.body.status) food.status = req.body.status;

  await food.save();
  res.json({ success: true, food });
});

const deleteFood = asyncHandler(async (req, res) => {
  const food = await FoodProvider.findById(req.params.id);
  if (!food) throw new AppError('Food service not found.', 404);
  if (req.user.role !== 'admin' && !food.user.equals(req.user._id)) {
    throw new AppError('You can only delete your own listings.', 403);
  }
  await Promise.all([
    food.deleteOne(),
    MealPlan.deleteMany({ provider: food._id }),
    SavedListing.deleteMany({ listingType: 'food', listingId: food._id })
  ]);
  res.json({ success: true, message: 'Food service deleted.' });
});

const myFood = asyncHandler(async (req, res) => {
  const items = await FoodProvider.find({ user: req.user._id }).sort({ createdAt: -1 });
  const ids = items.map((item) => item._id);
  const plans = await MealPlan.find({ provider: { $in: ids } }).sort({ createdAt: -1 });
  res.json({
    success: true,
    items: items.map((item) => ({
      ...item.toObject(),
      mealPlans: plans.filter((plan) => plan.provider.equals(item._id))
    }))
  });
});

const createMealPlan = asyncHandler(async (req, res) => {
  const food = await FoodProvider.findById(req.params.id);
  if (!food) throw new AppError('Food service not found.', 404);
  if (req.user.role !== 'admin' && !food.user.equals(req.user._id)) {
    throw new AppError('You can only manage your own meal plans.', 403);
  }
  const plan = await MealPlan.create({ ...req.body, provider: food._id });
  res.status(201).json({ success: true, mealPlan: plan });
});

const updateMealPlan = asyncHandler(async (req, res) => {
  const plan = await MealPlan.findById(req.params.planId).populate('provider');
  if (!plan) throw new AppError('Meal plan not found.', 404);
  const provider = plan.provider;
  if (req.user.role !== 'admin' && !provider.user.equals(req.user._id)) {
    throw new AppError('You can only manage your own meal plans.', 403);
  }
  const fields = [
    'name',
    'description',
    'pricePerMonth',
    'mealsIncluded',
    'foodType',
    'menu',
    'isActive'
  ];
  fields.forEach((field) => {
    if (req.body[field] !== undefined) plan[field] = req.body[field];
  });
  await plan.save();
  res.json({ success: true, mealPlan: plan });
});

const deleteMealPlan = asyncHandler(async (req, res) => {
  const plan = await MealPlan.findById(req.params.planId).populate('provider');
  if (!plan) throw new AppError('Meal plan not found.', 404);
  const provider = plan.provider;
  if (req.user.role !== 'admin' && !provider.user.equals(req.user._id)) {
    throw new AppError('You can only manage your own meal plans.', 403);
  }
  await plan.deleteOne();
  res.json({ success: true, message: 'Meal plan deleted.' });
});

module.exports = {
  listFood,
  getFood,
  createFood,
  updateFood,
  deleteFood,
  myFood,
  createMealPlan,
  updateMealPlan,
  deleteMealPlan
};
