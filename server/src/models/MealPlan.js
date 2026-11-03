const mongoose = require('mongoose');

const mealPlanSchema = new mongoose.Schema(
  {
    provider: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'FoodProvider',
      required: true,
      index: true
    },
    name: { type: String, required: true, trim: true, maxlength: 120 },
    description: { type: String, trim: true, maxlength: 1000, default: '' },
    pricePerMonth: { type: Number, required: true, min: 0 },
    mealsIncluded: [{ type: String, enum: ['breakfast', 'lunch', 'dinner'] }],
    foodType: { type: String, enum: ['veg', 'non_veg', 'both'], default: 'veg' },
    menu: { type: String, trim: true, maxlength: 2000, default: '' },
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
);

module.exports = mongoose.model('MealPlan', mealPlanSchema);
