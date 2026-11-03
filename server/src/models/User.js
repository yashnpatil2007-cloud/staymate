const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 80 },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true
    },
    passwordHash: { type: String, required: true, select: false },
    role: {
      type: String,
      enum: ['customer', 'owner', 'food_provider', 'admin'],
      default: 'customer',
      index: true
    },
    phone: { type: String, trim: true, maxlength: 20, default: '' },
    city: { type: String, trim: true, maxlength: 80, default: '' },
    avatar: { type: String, default: '' },
    bio: { type: String, trim: true, maxlength: 600, default: '' },
    isActive: { type: Boolean, default: true },
    isDemo: { type: Boolean, default: false },
    resetTokenHash: { type: String, select: false },
    resetTokenExpires: { type: Date, select: false },
    lastLoginAt: { type: Date }
  },
  { timestamps: true }
);

userSchema.methods.toSafeJSON = function toSafeJSON() {
  return {
    id: this._id,
    name: this.name,
    email: this.email,
    role: this.role,
    phone: this.phone,
    city: this.city,
    avatar: this.avatar,
    bio: this.bio,
    isDemo: this.isDemo,
    createdAt: this.createdAt
  };
};

module.exports = mongoose.model('User', userSchema);
