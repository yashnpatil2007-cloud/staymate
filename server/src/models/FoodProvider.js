const mongoose = require('mongoose');

const foodProviderSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    businessName: { type: String, required: true, trim: true, maxlength: 120 },
    description: { type: String, required: true, trim: true, maxlength: 3000 },
    type: {
      type: String,
      enum: ['mess', 'tiffin', 'home_cooked', 'meal_plan'],
      required: true,
      index: true
    },
    city: { type: String, required: true, trim: true, maxlength: 80, index: true },
    area: { type: String, required: true, trim: true, maxlength: 120 },
    address: { type: String, trim: true, maxlength: 300, default: '' },
    pricePerMonth: { type: Number, required: true, min: 0 },
    mealAvailability: [
      { type: String, enum: ['breakfast', 'lunch', 'dinner'] }
    ],
    foodType: { type: String, enum: ['veg', 'non_veg', 'both'], required: true },
    menu: { type: String, trim: true, maxlength: 2000, default: '' },
    images: [{ type: String }],
    phone: { type: String, trim: true, maxlength: 20, default: '' },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
      index: true
    },
    rejectionReason: { type: String, default: '' },
    isDemo: { type: Boolean, default: false },
    ratingAvg: { type: Number, default: 0, min: 0, max: 5 },
    reviewCount: { type: Number, default: 0 },
    views: { type: Number, default: 0 }
  },
  { timestamps: true }
);

foodProviderSchema.index({ businessName: 'text', description: 'text', city: 'text', area: 'text' });

module.exports = mongoose.model('FoodProvider', foodProviderSchema);
