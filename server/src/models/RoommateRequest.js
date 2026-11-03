const mongoose = require('mongoose');

const roommateRequestSchema = new mongoose.Schema(
  {
    from: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    to: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    message: { type: String, trim: true, maxlength: 500, default: '' },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'rejected', 'cancelled'],
      default: 'pending',
      index: true
    },
    respondedAt: { type: Date }
  },
  { timestamps: true }
);

roommateRequestSchema.index({ from: 1, to: 1 }, { unique: true });

module.exports = mongoose.model('RoommateRequest', roommateRequestSchema);
