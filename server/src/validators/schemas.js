const { z } = require('zod');

const email = z.string().trim().toLowerCase().email('Enter a valid email address');
const password = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(72, 'Password is too long')
  .regex(/[A-Za-z]/, 'Password must include a letter')
  .regex(/[0-9]/, 'Password must include a number');
const name = z.string().trim().min(2, 'Name must be at least 2 characters').max(80);

const propertyTypes = ['hostel', 'pg', 'single_room', 'shared_room', 'flat', 'apartment'];
const amenities = [
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

const registerSchema = z.object({
  name,
  email,
  password,
  role: z.enum(['customer', 'owner', 'food_provider']).default('customer'),
  phone: z.string().trim().max(20).optional().default(''),
  city: z.string().trim().max(80).optional().default('')
});

const loginSchema = z.object({
  email,
  password: z.string().min(1, 'Password is required')
});

const forgotSchema = z.object({ email });

const resetSchema = z.object({
  token: z.string().min(20, 'Invalid reset token'),
  password
});

const updateProfileSchema = z.object({
  name: name.optional(),
  phone: z.string().trim().max(20).optional(),
  city: z.string().trim().max(80).optional(),
  bio: z.string().trim().max(600).optional(),
  avatar: z.string().trim().max(500).optional()
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: password
});

const propertySchema = z.object({
  name: z.string().trim().min(3, 'Name must be at least 3 characters').max(120),
  description: z.string().trim().min(30, 'Add at least 30 characters of description').max(4000),
  type: z.enum(propertyTypes),
  city: z.string().trim().min(2, 'City is required').max(80),
  area: z.string().trim().min(2, 'Area is required').max(120),
  address: z.string().trim().min(5, 'Address is required').max(300),
  collegeNearby: z.string().trim().max(160).optional().default(''),
  workplaceNearby: z.string().trim().max(160).optional().default(''),
  coordinates: z
    .object({
      lat: z.coerce.number().min(-90).max(90),
      lng: z.coerce.number().min(-180).max(180)
    })
    .optional()
    .nullable(),
  rent: z.coerce.number().min(0, 'Rent cannot be negative'),
  deposit: z.coerce.number().min(0).default(0),
  genderPreference: z.enum(['any', 'male', 'female']).default('any'),
  furnishing: z.enum(['furnished', 'semi_furnished', 'unfurnished']).default('unfurnished'),
  occupancy: z.enum(['single', 'double', 'triple', 'shared']).default('single'),
  totalBeds: z.coerce.number().int().min(1).max(100).default(1),
  availableBeds: z.coerce.number().int().min(0).max(100).default(1),
  amenities: z.array(z.enum(amenities)).max(10).default([]),
  houseRules: z.array(z.string().trim().max(200)).max(15).optional().default([]),
  images: z.array(z.string().trim().max(1000)).min(1, 'Add at least one image').max(8),
  availabilityNote: z.string().trim().max(200).optional()
});

const foodSchema = z.object({
  businessName: z.string().trim().min(3, 'Business name is required').max(120),
  description: z.string().trim().min(30, 'Add at least 30 characters of description').max(3000),
  type: z.enum(['mess', 'tiffin', 'home_cooked', 'meal_plan']),
  city: z.string().trim().min(2, 'City is required').max(80),
  area: z.string().trim().min(2, 'Area is required').max(120),
  address: z.string().trim().max(300).optional().default(''),
  pricePerMonth: z.coerce.number().min(0),
  mealAvailability: z
    .array(z.enum(['breakfast', 'lunch', 'dinner']))
    .min(1, 'Select at least one meal'),
  foodType: z.enum(['veg', 'non_veg', 'both']),
  menu: z.string().trim().max(2000).optional().default(''),
  images: z.array(z.string().trim().max(1000)).min(1, 'Add at least one image').max(8),
  phone: z.string().trim().max(20).optional().default('')
});

const mealPlanSchema = z.object({
  name: z.string().trim().min(2).max(120),
  description: z.string().trim().max(1000).optional().default(''),
  pricePerMonth: z.coerce.number().min(0),
  mealsIncluded: z.array(z.enum(['breakfast', 'lunch', 'dinner'])).min(1),
  foodType: z.enum(['veg', 'non_veg', 'both']).default('veg'),
  menu: z.string().trim().max(2000).optional().default(''),
  isActive: z.boolean().optional().default(true)
});

const roommateProfileSchema = z
  .object({
    age: z.coerce.number().int().min(16).max(100),
    gender: z.enum(['male', 'female', 'other']),
    city: z.string().trim().min(2).max(80),
    locality: z.string().trim().max(120).optional().default(''),
    budgetMin: z.coerce.number().min(0),
    budgetMax: z.coerce.number().min(0),
    occupation: z.enum(['student', 'working_professional']),
    collegeOrCompany: z.string().trim().max(160).optional().default(''),
    accommodationType: z.enum(['hostel', 'pg', 'single_room', 'shared_room', 'flat', 'apartment']),
    foodPreference: z.enum(['veg', 'non_veg', 'any']),
    sleepSchedule: z.enum(['early_bird', 'night_owl', 'flexible']),
    smoking: z.enum(['no', 'yes', 'occasionally']),
    cleanliness: z.enum(['relaxed', 'moderate', 'very_clean']),
    lifestyle: z
      .array(
        z.enum(['early_riser', 'gym', 'cooking', 'gaming', 'reading', 'social', 'quiet', 'pets'])
      )
      .max(8)
      .optional()
      .default([]),
    preferredGender: z.enum(['any', 'male', 'female']).default('any'),
    bio: z.string().trim().max(700).optional().default(''),
    isVisible: z.boolean().optional().default(true)
  })
  .refine((data) => data.budgetMax >= data.budgetMin, {
    message: 'Maximum budget must be greater than or equal to minimum budget',
    path: ['budgetMax']
  });

const enquirySchema = z.object({
  listingType: z.enum(['property', 'food']),
  listingId: z.string().min(12, 'Invalid listing'),
  name: z.string().trim().min(2).max(80),
  email,
  phone: z.string().trim().max(20).optional().default(''),
  message: z.string().trim().min(10, 'Message must be at least 10 characters').max(1500)
});

const reviewSchema = z.object({
  listingType: z.enum(['property', 'food']),
  listingId: z.string().min(12, 'Invalid listing'),
  rating: z.coerce.number().int().min(1).max(5),
  comment: z.string().trim().min(5, 'Review must be at least 5 characters').max(1200),
  reviewerType: z
    .enum(['student', 'working_professional', 'resident', 'visitor', 'other'])
    .optional()
    .default('resident')
});

const reportSchema = z.object({
  targetType: z.enum(['property', 'food', 'user', 'review']),
  targetId: z.string().min(12, 'Invalid target'),
  reason: z.enum(['spam', 'misleading', 'inappropriate', 'fraud', 'other']),
  details: z.string().trim().max(1000).optional().default('')
});

const roommateRequestSchema = z
  .object({
    toUserId: z.string().min(12).optional(),
    targetProfileId: z.string().min(12).optional(),
    message: z.string().trim().max(500).optional().default('')
  })
  .refine((data) => data.toUserId || data.targetProfileId, {
    message: 'Recipient user ID or profile ID is required'
  });

module.exports = {
  registerSchema,
  loginSchema,
  forgotSchema,
  resetSchema,
  updateProfileSchema,
  changePasswordSchema,
  propertySchema,
  foodSchema,
  mealPlanSchema,
  roommateProfileSchema,
  enquirySchema,
  reviewSchema,
  reportSchema,
  roommateRequestSchema
};
