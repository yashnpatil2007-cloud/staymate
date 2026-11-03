const mongoose = require('mongoose');

const savedListingSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    listingType: { type: String, enum: ['property', 'food'], required: true },
    listingId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true }
  },
  { timestamps: true }
);

savedListingSchema.index({ user: 1, listingType: 1, listingId: 1 }, { unique: true });

module.exports = mongoose.model('SavedListing', savedListingSchema);
