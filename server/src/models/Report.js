const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema(
  {
    reporter: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    targetType: { type: String, enum: ['property', 'food', 'user', 'review'], required: true },
    targetId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
    reason: {
      type: String,
      enum: ['spam', 'misleading', 'inappropriate', 'fraud', 'other'],
      required: true
    },
    details: { type: String, trim: true, maxlength: 1000, default: '' },
    status: {
      type: String,
      enum: ['open', 'reviewed', 'dismissed'],
      default: 'open',
      index: true
    },
    adminNote: { type: String, trim: true, maxlength: 1000, default: '' }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Report', reportSchema);
