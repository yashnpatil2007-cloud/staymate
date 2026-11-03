const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    listingType: { type: String, enum: ['property', 'food'], required: true },
    listingId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, required: true, trim: true, maxlength: 1200 },
    verifiedInteraction: { type: Boolean, default: false },
    enquiry: { type: mongoose.Schema.Types.ObjectId, ref: 'Enquiry' },
    status: { type: String, enum: ['approved', 'hidden'], default: 'approved', index: true }
  },
  { timestamps: true }
);

reviewSchema.index({ user: 1, listingType: 1, listingId: 1 }, { unique: true });
reviewSchema.index({ listingType: 1, listingId: 1, status: 1 });

module.exports = mongoose.model('Review', reviewSchema);
