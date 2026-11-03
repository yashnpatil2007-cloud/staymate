const mongoose = require('mongoose');

const enquirySchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    listingType: { type: String, enum: ['property', 'food'], required: true },
    listingId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
    listingName: { type: String, required: true },
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    phone: { type: String, trim: true, maxlength: 20, default: '' },
    message: { type: String, required: true, trim: true, maxlength: 1500 },
    status: {
      type: String,
      enum: ['new', 'contacted', 'closed'],
      default: 'new',
      index: true
    }
  },
  { timestamps: true }
);

enquirySchema.index({ user: 1, listingType: 1, listingId: 1 });

module.exports = mongoose.model('Enquiry', enquirySchema);
