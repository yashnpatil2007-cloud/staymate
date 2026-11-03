const mongoose = require('mongoose');

const PROPERTY_TYPES = ['hostel', 'pg', 'single_room', 'shared_room', 'flat', 'apartment'];
const AMENITIES = [
  'wifi',
  'ac',
  'laundry',
  'parking',
  'attached_bathroom',
  'food',
  'power_backup',
  'security',
  'gym',
  'housekeeping'
];

const propertySchema = new mongoose.Schema(
  {
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    name: { type: String, required: true, trim: true, maxlength: 120 },
    description: { type: String, required: true, trim: true, maxlength: 4000 },
    type: { type: String, enum: PROPERTY_TYPES, required: true, index: true },
    city: { type: String, required: true, trim: true, maxlength: 80, index: true },
    area: { type: String, required: true, trim: true, maxlength: 120, index: true },
    address: { type: String, required: true, trim: true, maxlength: 300 },
    collegeNearby: { type: String, trim: true, maxlength: 160, default: '' },
    workplaceNearby: { type: String, trim: true, maxlength: 160, default: '' },
    coordinates: {
      lat: { type: Number, min: -90, max: 90 },
      lng: { type: Number, min: -180, max: 180 }
    },
    rent: { type: Number, required: true, min: 0 },
    deposit: { type: Number, min: 0, default: 0 },
    genderPreference: {
      type: String,
      enum: ['any', 'male', 'female'],
      default: 'any'
    },
    furnishing: {
      type: String,
      enum: ['furnished', 'semi_furnished', 'unfurnished'],
      default: 'unfurnished'
    },
    occupancy: {
      type: String,
      enum: ['single', 'double', 'triple', 'shared'],
      default: 'single'
    },
    totalBeds: { type: Number, min: 1, default: 1 },
    availableBeds: { type: Number, min: 0, default: 1 },
    amenities: [{ type: String, enum: AMENITIES }],
    houseRules: [{ type: String, trim: true, maxlength: 200 }],
    images: [{ type: String }],
    availabilityNote: { type: String, trim: true, maxlength: 200, default: '' },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
      index: true
    },
    rejectionReason: { type: String, default: '' },
    featured: { type: Boolean, default: false },
    isDemo: { type: Boolean, default: false },
    ratingAvg: { type: Number, default: 0, min: 0, max: 5 },
    reviewCount: { type: Number, default: 0 },
    views: { type: Number, default: 0 }
  },
  { timestamps: true }
);

propertySchema.index({ name: 'text', description: 'text', city: 'text', area: 'text' });

module.exports = mongoose.model('Property', propertySchema);
module.exports.PROPERTY_TYPES = PROPERTY_TYPES;
module.exports.AMENITIES = AMENITIES;
