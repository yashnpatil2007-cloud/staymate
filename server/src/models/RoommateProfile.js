const mongoose = require('mongoose');

const roommateProfileSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true
    },
    age: { type: Number, min: 16, max: 100, required: true },
    gender: { type: String, enum: ['male', 'female', 'other'], required: true },
    city: { type: String, required: true, trim: true, maxlength: 80, index: true },
    locality: { type: String, trim: true, maxlength: 120, default: '' },
    budgetMin: { type: Number, min: 0, required: true },
    budgetMax: { type: Number, min: 0, required: true },
    occupation: {
      type: String,
      enum: ['student', 'working_professional'],
      required: true
    },
    collegeOrCompany: { type: String, trim: true, maxlength: 160, default: '' },
    accommodationType: {
      type: String,
      enum: ['hostel', 'pg', 'single_room', 'shared_room', 'flat', 'apartment'],
      required: true
    },
    foodPreference: {
      type: String,
      enum: ['veg', 'non_veg', 'any'],
      required: true
    },
    sleepSchedule: {
      type: String,
      enum: ['early_bird', 'night_owl', 'flexible'],
      required: true
    },
    smoking: { type: String, enum: ['no', 'yes', 'occasionally'], required: true },
    cleanliness: {
      type: String,
      enum: ['relaxed', 'moderate', 'very_clean'],
      required: true
    },
    lifestyle: [
      {
        type: String,
        enum: ['early_riser', 'gym', 'cooking', 'gaming', 'reading', 'social', 'quiet', 'pets']
      }
    ],
    preferredGender: { type: String, enum: ['any', 'male', 'female'], default: 'any' },
    bio: { type: String, trim: true, maxlength: 700, default: '' },
    isVisible: { type: Boolean, default: true }
  },
  { timestamps: true }
);

roommateProfileSchema.index({ city: 1, budgetMin: 1, budgetMax: 1 });

module.exports = mongoose.model('RoommateProfile', roommateProfileSchema);
