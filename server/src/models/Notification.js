const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    type: {
      type: String,
      enum: [
        'enquiry',
        'enquiry_status',
        'roommate_request',
        'request_response',
        'listing_status',
        'account',
        'system'
      ],
      required: true
    },
    title: { type: String, required: true, maxlength: 140 },
    message: { type: String, required: true, maxlength: 600 },
    link: { type: String, default: '' },
    read: { type: Boolean, default: false, index: true }
  },
  { timestamps: true }
);

notificationSchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);
