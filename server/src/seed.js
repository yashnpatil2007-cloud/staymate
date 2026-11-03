const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const env = require('./config/env');
const User = require('./models/User');
const Property = require('./models/Property');
const FoodProvider = require('./models/FoodProvider');
const MealPlan = require('./models/MealPlan');
const RoommateProfile = require('./models/RoommateProfile');
const Review = require('./models/Review');
const { recalculateRating } = require('./utils/listing');

const DEMO_PASSWORD = 'Demo1234!';

const img = (id, w = 1200) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=80`;

const PROPERTY_IMAGES = [
  'photo-1522708323590-d24dbb6b0267',
  'photo-1502672260266-1c1ef2d93688',
  'photo-1560448204-e02f11c3d0e2',
  'photo-1493809842364-78817add7ffb',
  'photo-1554995207-c18c203602cb',
  'photo-1616486338812-3dadae4b4ace',
  'photo-1600585154340-be6161a56a0c',
  'photo-1600607687939-ce8a6c25118c',
  'photo-1600566753086-00f18fb6b3ea',
  'photo-1560185007-cde436f6a4d0'
].map((id) => img(id));

const FOOD_IMAGES = [
  'photo-1504674900247-0877df9cc836',
  'photo-1546069901-ba9599a7e63c',
  'photo-1512621776951-a57141f2eefd',
  'photo-1565299624946-b28f40a0ae38',
  'photo-1547592180-85f173990554',
  'photo-1498837167922-ddd27525d352'
].map((id) => img(id));

const AVATARS = {
  customer: img('photo-1494790108377-be9c29b29330', 400),
  owner: img('photo-1507003211169-0a1dd7228f2d', 400),
  provider: img('photo-1577219491135-ce391730fb2c', 400),
  aarav: img('photo-1500648767791-00dcc994a43e', 400),
  sneha: img('photo-1534528741775-53994a69daeb', 400),
  kabir: img('photo-1519085360753-af0119f7cbe7', 400),
  ananya: img('photo-1517841905240-472988babdf9', 400)
};

const DEMO_PROPERTIES = [
  {
    name: 'Sunrise Student Hostel',
    type: 'hostel',
    city: 'Bengaluru',
    area: 'Koramangala',
    address: '18, 5th Block, Koramangala, Bengaluru',
    collegeNearby: 'Christ University',
    workplaceNearby: 'Koramangala Tech Park',
    coordinates: { lat: 12.9352, lng: 77.6245 },
    rent: 8500,
    deposit: 17000,
    genderPreference: 'female',
    furnishing: 'semi_furnished',
    occupancy: 'double',
    totalBeds: 40,
    availableBeds: 6,
    amenities: ['wifi', 'food', 'laundry', 'power_backup', 'security', 'housekeeping'],
    houseRules: ['Gate closes at 11 PM', 'No smoking inside rooms', 'Visitors allowed in common areas'],
    description:
      'A calm, well-managed student hostel minutes from Christ University. Rooms are shared by two students with study desks, wardrobes and attached storage. Breakfast and dinner are prepared in-house, and the common lounge is a great place to meet other students.',
    images: [PROPERTY_IMAGES[0], PROPERTY_IMAGES[1], PROPERTY_IMAGES[2]],
    featured: true,
    isDemo: true
  },
  {
    name: 'The Nest Premium PG',
    type: 'pg',
    city: 'Pune',
    area: 'Kothrud',
    address: 'Plot 44, Kothrud, Pune',
    collegeNearby: 'MIT Pune',
    workplaceNearby: 'EON IT Park',
    coordinates: { lat: 18.5074, lng: 73.8077 },
    rent: 11500,
    deposit: 20000,
    genderPreference: 'any',
    furnishing: 'furnished',
    occupancy: 'single',
    totalBeds: 24,
    availableBeds: 3,
    amenities: ['wifi', 'ac', 'food', 'laundry', 'parking', 'attached_bathroom', 'power_backup', 'housekeeping'],
    houseRules: ['No loud music after 10 PM', 'Monthly rent due by the 5th'],
    description:
      'Fully furnished single-occupancy PG with attached bathrooms, air conditioning and three home-style meals. Located on a quiet lane in Kothrud with easy access to MIT Pune and the EON IT Park bus route.',
    images: [PROPERTY_IMAGES[3], PROPERTY_IMAGES[4], PROPERTY_IMAGES[5]],
    featured: true,
    isDemo: true
  },
  {
    name: 'Olive Court Shared Flat',
    type: 'flat',
    city: 'Hyderabad',
    area: 'Gachibowli',
    address: 'Olive Court, Financial District Road, Hyderabad',
    collegeNearby: 'IIIT Hyderabad',
    workplaceNearby: 'Financial District',
    coordinates: { lat: 17.4401, lng: 78.3489 },
    rent: 21000,
    deposit: 42000,
    genderPreference: 'any',
    furnishing: 'semi_furnished',
    occupancy: 'shared',
    totalBeds: 3,
    availableBeds: 1,
    amenities: ['wifi', 'ac', 'parking', 'attached_bathroom', 'security', 'power_backup'],
    houseRules: ['Shared cleaning roster', 'No smoking indoors', 'Guests until 9 PM'],
    description:
      'A bright three-bedroom flat shared by young professionals. One private bedroom is available in a fully equipped home with a washing machine, modular kitchen and covered parking. The Financial District is a ten-minute commute.',
    images: [PROPERTY_IMAGES[6], PROPERTY_IMAGES[7], PROPERTY_IMAGES[0]],
    featured: true,
    isDemo: true
  },
  {
    name: 'Campus Corner Rooms',
    type: 'single_room',
    city: 'Delhi',
    area: 'Mukherjee Nagar',
    address: 'House 92, Mukherjee Nagar, Delhi',
    collegeNearby: 'Delhi University North Campus',
    workplaceNearby: 'GTB Nagar Metro',
    coordinates: { lat: 28.7126, lng: 77.2097 },
    rent: 7000,
    deposit: 7000,
    genderPreference: 'male',
    furnishing: 'unfurnished',
    occupancy: 'single',
    totalBeds: 1,
    availableBeds: 1,
    amenities: ['wifi', 'power_backup'],
    houseRules: ['No smoking', 'Keep common areas clean'],
    description:
      'Budget single room in the heart of Mukherjee Nagar, ideal for students preparing for competitive exams. The room has a bed, study table, fan and Wi-Fi. Shared washroom and a small kitchen are available on the floor.',
    images: [PROPERTY_IMAGES[8], PROPERTY_IMAGES[9], PROPERTY_IMAGES[1]],
    isDemo: true
  },
  {
    name: 'Marine View Apartment',
    type: 'apartment',
    city: 'Mumbai',
    area: 'Andheri West',
    address: 'Lotus Residency, Andheri West, Mumbai',
    collegeNearby: 'NMIMS Mumbai',
    workplaceNearby: 'Andheri MIDC',
    coordinates: { lat: 19.1197, lng: 72.8468 },
    rent: 32000,
    deposit: 96000,
    genderPreference: 'any',
    furnishing: 'furnished',
    occupancy: 'double',
    totalBeds: 2,
    availableBeds: 2,
    amenities: ['wifi', 'ac', 'laundry', 'parking', 'attached_bathroom', 'gym', 'security'],
    houseRules: ['No pets', 'Rent paid in advance monthly', 'Quiet hours 11 PM - 7 AM'],
    description:
      'Two-bedroom furnished apartment in Andheri West with a gym, lift and 24x7 security. Perfect for two working professionals who want an easy commute to the metro and MIDC offices. The living room opens to a small balcony with city views.',
    images: [PROPERTY_IMAGES[2], PROPERTY_IMAGES[3], PROPERTY_IMAGES[4]],
    featured: true,
    isDemo: true
  },
  {
    name: 'Anna Nagar Working Womens PG',
    type: 'pg',
    city: 'Chennai',
    area: 'Anna Nagar',
    address: '2nd Avenue, Anna Nagar, Chennai',
    collegeNearby: 'Anna University',
    workplaceNearby: 'Anna Nagar Tower Metro',
    coordinates: { lat: 13.085, lng: 80.2101 },
    rent: 9500,
    deposit: 15000,
    genderPreference: 'female',
    furnishing: 'furnished',
    occupancy: 'double',
    totalBeds: 16,
    availableBeds: 4,
    amenities: ['wifi', 'food', 'laundry', 'attached_bathroom', 'power_backup', 'housekeeping'],
    houseRules: ['Entry closes at 10 PM', 'Guests only in the lobby'],
    description:
      'Comfortable PG for working women in Anna Nagar with home-cooked South Indian meals, daily housekeeping and reliable backup power. Close to the Tower Metro station and several IT offices.',
    images: [PROPERTY_IMAGES[5], PROPERTY_IMAGES[6], PROPERTY_IMAGES[7]],
    isDemo: true
  },
  {
    name: 'Palm Grove Boys Hostel',
    type: 'hostel',
    city: 'Indore',
    area: 'Vijay Nagar',
    address: 'Scheme 54, Vijay Nagar, Indore',
    collegeNearby: 'DAVV Indore',
    workplaceNearby: 'Vijay Nagar Square',
    coordinates: { lat: 22.7538, lng: 75.8937 },
    rent: 6500,
    deposit: 10000,
    genderPreference: 'male',
    furnishing: 'semi_furnished',
    occupancy: 'triple',
    totalBeds: 36,
    availableBeds: 8,
    amenities: ['wifi', 'food', 'laundry', 'parking', 'power_backup'],
    houseRules: ['No alcohol', 'Common room closes at midnight'],
    description:
      'Affordable triple-sharing hostel for boys with a large common room, study hall and mess serving North Indian meals. Vijay Nagar Square and DAVV are within walking distance.',
    images: [PROPERTY_IMAGES[0], PROPERTY_IMAGES[8], PROPERTY_IMAGES[9]],
    isDemo: true
  },
  {
    name: 'Heritage Haveli Room',
    type: 'shared_room',
    city: 'Jaipur',
    area: 'C-Scheme',
    address: '35, Ashok Marg, C-Scheme, Jaipur',
    collegeNearby: 'Rajasthan University',
    workplaceNearby: 'C-Scheme business district',
    coordinates: { lat: 26.9055, lng: 75.8038 },
    rent: 7500,
    deposit: 15000,
    genderPreference: 'any',
    furnishing: 'semi_furnished',
    occupancy: 'shared',
    totalBeds: 2,
    availableBeds: 1,
    amenities: ['wifi', 'ac', 'parking', 'housekeeping'],
    houseRules: ['No smoking indoors', 'Shared courtyard kept clean'],
    description:
      'A character-filled shared room in a restored haveli in C-Scheme. High ceilings, a quiet courtyard and a rooftop common area make this a unique stay for students and remote workers. One bed is currently available.',
    images: [PROPERTY_IMAGES[7], PROPERTY_IMAGES[4], PROPERTY_IMAGES[6]],
    isDemo: true
  },
  {
    name: 'Riverside Studio Apartment',
    type: 'apartment',
    city: 'Ahmedabad',
    area: 'Sabarmati',
    address: 'Riverfront Road, Sabarmati, Ahmedabad',
    collegeNearby: 'Gujarat University',
    workplaceNearby: 'Sabarmati Riverfront offices',
    coordinates: { lat: 23.0225, lng: 72.5804 },
    rent: 14500,
    deposit: 29000,
    genderPreference: 'any',
    furnishing: 'furnished',
    occupancy: 'single',
    totalBeds: 1,
    availableBeds: 1,
    amenities: ['wifi', 'ac', 'parking', 'attached_bathroom', 'security'],
    houseRules: ['No subletting', 'Monthly inspection with notice'],
    description:
      'Compact furnished studio close to the Sabarmati riverfront. Includes a kitchenette, air conditioning, dedicated parking and 24-hour security. This is a demo listing awaiting administrator review.',
    images: [PROPERTY_IMAGES[1], PROPERTY_IMAGES[2], PROPERTY_IMAGES[5]],
    status: 'pending',
    isDemo: true
  }
];

const DEMO_FOOD = [
  {
    businessName: 'Annapurna Mess',
    type: 'mess',
    city: 'Bengaluru',
    area: 'Koramangala',
    address: 'Near Christ University, Koramangala',
    pricePerMonth: 4500,
    mealAvailability: ['lunch', 'dinner'],
    foodType: 'both',
    menu: 'Mon: Sambar rice, beans palya, curd\nTue: Veg biryani, raita\nWed: North Indian thali\nThu: Lemon rice, potato fry\nFri: Chicken curry (optional) with rice\nWeekend: Special South Indian breakfast',
    phone: '+91 90000 10001',
    description:
      'A friendly neighbourhood mess serving fresh South Indian and North Indian meals. Monthly plans are popular with students from Christ University. Lunch is served 12-2:30 PM and dinner 7:30-10 PM.',
    images: [FOOD_IMAGES[0], FOOD_IMAGES[1]],
    featured: true,
    isDemo: true
  },
  {
    businessName: 'Ghar Ka Khana Tiffin',
    type: 'tiffin',
    city: 'Pune',
    area: 'Kothrud',
    address: 'Kothrud, Pune',
    pricePerMonth: 3800,
    mealAvailability: ['lunch', 'dinner'],
    foodType: 'veg',
    menu: 'Rotis, dal, seasonal sabzi, rice, salad and pickle. Menu changes daily and is shared on WhatsApp each morning.',
    phone: '+91 90000 10002',
    description:
      'Home-style vegetarian tiffins cooked in small batches by a family kitchen in Kothrud. Delivered to nearby PGs and flats between 12:30-1:30 PM and 8-9 PM. Low oil, no artificial colours.',
    images: [FOOD_IMAGES[2], FOOD_IMAGES[3]],
    featured: true,
    isDemo: true
  },
  {
    businessName: 'Hyderabad Home Meals',
    type: 'home_cooked',
    city: 'Hyderabad',
    area: 'Gachibowli',
    address: 'Gachibowli, Hyderabad',
    pricePerMonth: 5200,
    mealAvailability: ['breakfast', 'lunch', 'dinner'],
    foodType: 'both',
    menu: 'Breakfast: Idli, dosa or upma\nLunch: Telangana-style rice, dal, curry\nDinner: Chapati, sabzi, dal',
    phone: '+91 90000 10003',
    description:
      'A home kitchen offering three balanced meals a day with a rotating Telangana and Andhra menu. Ideal for working professionals in the Financial District. Weekly menu is published every Sunday.',
    images: [FOOD_IMAGES[3], FOOD_IMAGES[4]],
    isDemo: true
  },
  {
    businessName: 'Delhi Dabba Daily',
    type: 'meal_plan',
    city: 'Delhi',
    area: 'Mukherjee Nagar',
    address: 'Mukherjee Nagar, Delhi',
    pricePerMonth: 4200,
    mealAvailability: ['lunch', 'dinner'],
    foodType: 'veg',
    menu: 'Two sabzis, dal, 6 rotis, rice, salad and pickle. Sunday special: chole bhature.',
    phone: '+91 90000 10004',
    description:
      'Reliable vegetarian dabba service for students in Mukherjee Nagar. Choose a lunch-only, dinner-only or full monthly plan. Tiffins are delivered in insulated carriers and collected the next morning.',
    images: [FOOD_IMAGES[5], FOOD_IMAGES[0]],
    isDemo: true
  },
  {
    businessName: 'Coastal Curry House',
    type: 'mess',
    city: 'Chennai',
    area: 'Anna Nagar',
    address: 'Anna Nagar, Chennai',
    pricePerMonth: 4900,
    mealAvailability: ['lunch', 'dinner'],
    foodType: 'non_veg',
    menu: 'Daily fish or chicken curry with rice, rasam and poriyal. Vegetarian option available on request.',
    phone: '+91 90000 10005',
    description:
      'A small mess specialising in coastal Tamil Nadu home cooking. Fresh fish is sourced each morning and the menu changes daily. Monthly plans include unlimited rice and one protein curry per meal.',
    images: [FOOD_IMAGES[1], FOOD_IMAGES[4]],
    status: 'pending',
    isDemo: true
  }
];

const DEMO_ROOMMATES = [
  {
    key: 'aarav',
    name: 'Aarav Mehta',
    age: 22,
    gender: 'male',
    city: 'Bengaluru',
    locality: 'Koramangala',
    budgetMin: 7000,
    budgetMax: 12000,
    occupation: 'student',
    collegeOrCompany: 'Christ University',
    accommodationType: 'pg',
    foodPreference: 'any',
    sleepSchedule: 'night_owl',
    smoking: 'no',
    cleanliness: 'moderate',
    lifestyle: ['gaming', 'cooking', 'social'],
    preferredGender: 'male',
    bio: 'Final-year commerce student at Christ University. I enjoy cooking on weekends, gaming and keeping things reasonably tidy. Looking for a chill roommate who is okay with late study nights.',
    avatar: AVATARS.aarav
  },
  {
    key: 'sneha',
    name: 'Sneha Kulkarni',
    age: 24,
    gender: 'female',
    city: 'Pune',
    locality: 'Kothrud',
    budgetMin: 9000,
    budgetMax: 15000,
    occupation: 'working_professional',
    collegeOrCompany: 'Infosys Pune',
    accommodationType: 'flat',
    foodPreference: 'veg',
    sleepSchedule: 'early_bird',
    smoking: 'no',
    cleanliness: 'very_clean',
    lifestyle: ['gym', 'reading', 'quiet'],
    preferredGender: 'female',
    bio: 'Software engineer in Kothrud. Early riser, vegetarian and fairly quiet at home. Looking for a female flatmate who values a clean, calm apartment and splitting chores fairly.',
    avatar: AVATARS.sneha
  },
  {
    key: 'kabir',
    name: 'Kabir Singh',
    age: 26,
    gender: 'male',
    city: 'Hyderabad',
    locality: 'Gachibowli',
    budgetMin: 12000,
    budgetMax: 20000,
    occupation: 'working_professional',
    collegeOrCompany: 'Deloitte Hyderabad',
    accommodationType: 'flat',
    foodPreference: 'non_veg',
    sleepSchedule: 'flexible',
    smoking: 'occasionally',
    cleanliness: 'moderate',
    lifestyle: ['gym', 'social', 'cooking'],
    preferredGender: 'any',
    bio: 'Consultant working near the Financial District. I am out most of the day, cook a few times a week and enjoy a friendly flat where people get along but also respect personal space.',
    avatar: AVATARS.kabir
  },
  {
    key: 'ananya',
    name: 'Ananya Rao',
    age: 21,
    gender: 'female',
    city: 'Bengaluru',
    locality: 'Jayanagar',
    budgetMin: 6000,
    budgetMax: 10000,
    occupation: 'student',
    collegeOrCompany: 'National Law School',
    accommodationType: 'hostel',
    foodPreference: 'veg',
    sleepSchedule: 'early_bird',
    smoking: 'no',
    cleanliness: 'very_clean',
    lifestyle: ['reading', 'quiet', 'early_riser'],
    preferredGender: 'female',
    bio: 'Law student looking for a calm hostel or shared room in Jayanagar or nearby. I am usually in the library, prefer a quiet space and keep my things very organised.',
    avatar: AVATARS.ananya
  },
  {
    key: 'customer',
    name: 'Riya Sharma',
    age: 23,
    gender: 'female',
    city: 'Bengaluru',
    locality: 'Koramangala',
    budgetMin: 8000,
    budgetMax: 14000,
    occupation: 'working_professional',
    collegeOrCompany: 'Freshworks',
    accommodationType: 'pg',
    foodPreference: 'any',
    sleepSchedule: 'night_owl',
    smoking: 'no',
    cleanliness: 'moderate',
    lifestyle: ['cooking', 'social', 'gym'],
    preferredGender: 'female',
    bio: 'This is a demo roommate profile for the demo customer account. Product marketer in Bengaluru, loves trying new cafes, and looking for a female roommate near Koramangala or Indiranagar.',
    avatar: AVATARS.customer
  }
];

async function upsertUser({ name, email, role, avatar, city, phone, bio, isDemo = true }) {
  const existing = await User.findOne({ email });
  if (existing) {
    if (existing.role !== role && role !== 'admin') {
      existing.role = role;
      await existing.save({ validateBeforeSave: false });
    }
    return existing;
  }
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 12);
  return User.create({
    name,
    email,
    passwordHash,
    role,
    avatar,
    city,
    phone,
    bio,
    isDemo
  });
}

async function seedDatabase() {
  const created = [];

  let admin = null;
  if (env.admin.email && env.admin.password) {
    admin = await User.findOne({ email: env.admin.email });
    if (!admin) {
      admin = await User.create({
        name: env.admin.name,
        email: env.admin.email,
        passwordHash: await bcrypt.hash(env.admin.password, 12),
        role: 'admin'
      });
      created.push(`admin: ${env.admin.email}`);
    } else if (admin.role !== 'admin') {
      admin.role = 'admin';
      await admin.save({ validateBeforeSave: false });
    }
  } else {
    console.warn('ADMIN_EMAIL / ADMIN_PASSWORD not set - skipping admin creation.');
  }

  if (!env.seedDemo) {
    console.log('SEED_DEMO is false - only administrator account was ensured.');
    return;
  }

  const customer = await upsertUser({
    name: 'Riya Sharma',
    email: 'customer@staymate.app',
    role: 'customer',
    avatar: AVATARS.customer,
    city: 'Bengaluru',
    phone: '+91 90000 20001',
    bio: 'Demo customer account. Exploring PGs and roommates in Bengaluru.'
  });
  const owner = await upsertUser({
    name: 'Suresh Patel',
    email: 'owner@staymate.app',
    role: 'owner',
    avatar: AVATARS.owner,
    city: 'Pune',
    phone: '+91 90000 20002',
    bio: 'Demo property owner account with listings across multiple cities.'
  });
  const provider = await upsertUser({
    name: 'Meena Iyer',
    email: 'provider@staymate.app',
    role: 'food_provider',
    avatar: AVATARS.provider,
    city: 'Bengaluru',
    phone: '+91 90000 20003',
    bio: 'Demo food provider account for mess and tiffin listings.'
  });

  const demoUsers = { customer, owner, provider };

  for (const roommate of DEMO_ROOMMATES) {
    const isCustomer = roommate.key === 'customer';
    if (isCustomer) {
      demoUsers.customer = customer;
      continue;
    }
    const user = await upsertUser({
      name: roommate.name,
      email: `${roommate.key}@demo.staymate.app`,
      role: 'customer',
      avatar: roommate.avatar,
      city: roommate.city,
      bio: roommate.bio
    });
    demoUsers[roommate.key] = user;
  }

  await Property.deleteMany({ isDemo: true });
  await FoodProvider.deleteMany({ isDemo: true });
  await RoommateProfile.deleteMany({ user: { $in: Object.values(demoUsers).map((u) => u._id) } });

  const propertyDocs = await Property.insertMany(
    DEMO_PROPERTIES.map((property) => ({
      ...property,
      owner: owner._id,
      status: property.status || 'approved'
    }))
  );
  created.push(`${propertyDocs.length} demo properties`);

  const foodDocs = await FoodProvider.insertMany(
    DEMO_FOOD.map((food) => ({
      ...food,
      user: provider._id,
      status: food.status || 'approved'
    }))
  );
  created.push(`${foodDocs.length} demo food listings`);

  const approvedFood = foodDocs.filter((food) => food.status === 'approved');
  if (approvedFood.length) {
    await MealPlan.insertMany([
      {
        provider: approvedFood[0]._id,
        name: 'Lunch + Dinner Monthly',
        description: 'Unlimited rice, sambar or dal, vegetable side and curd.',
        pricePerMonth: approvedFood[0].pricePerMonth,
        mealsIncluded: ['lunch', 'dinner'],
        foodType: 'both',
        menu: approvedFood[0].menu
      },
      {
        provider: approvedFood[0]._id,
        name: 'Dinner Only Monthly',
        description: 'A lighter plan for working professionals who eat lunch at the office.',
        pricePerMonth: Math.round(approvedFood[0].pricePerMonth * 0.62),
        mealsIncluded: ['dinner'],
        foodType: 'both',
        menu: approvedFood[0].menu
      }
    ]);
    if (approvedFood[1]) {
      await MealPlan.insertMany([
        {
          provider: approvedFood[1]._id,
          name: 'Full Monthly Veg Tiffin',
          description: 'Lunch and dinner delivered Monday to Saturday.',
          pricePerMonth: approvedFood[1].pricePerMonth,
          mealsIncluded: ['lunch', 'dinner'],
          foodType: 'veg',
          menu: approvedFood[1].menu
        }
      ]);
    }
    if (approvedFood[2]) {
      await MealPlan.insertMany([
        {
          provider: approvedFood[2]._id,
          name: 'Three Meals Daily',
          description: 'Breakfast, lunch and dinner with a rotating home menu.',
          pricePerMonth: approvedFood[2].pricePerMonth,
          mealsIncluded: ['breakfast', 'lunch', 'dinner'],
          foodType: 'both',
          menu: approvedFood[2].menu
        }
      ]);
    }
    created.push('demo meal plans');
  }

  await RoommateProfile.insertMany(
    DEMO_ROOMMATES.map((roommate) => ({
      user: demoUsers[roommate.key]._id,
      age: roommate.age,
      gender: roommate.gender,
      city: roommate.city,
      locality: roommate.locality,
      budgetMin: roommate.budgetMin,
      budgetMax: roommate.budgetMax,
      occupation: roommate.occupation,
      collegeOrCompany: roommate.collegeOrCompany,
      accommodationType: roommate.accommodationType,
      foodPreference: roommate.foodPreference,
      sleepSchedule: roommate.sleepSchedule,
      smoking: roommate.smoking,
      cleanliness: roommate.cleanliness,
      lifestyle: roommate.lifestyle,
      preferredGender: roommate.preferredGender,
      bio: roommate.bio,
      isVisible: true
    }))
  );
  created.push(`${DEMO_ROOMMATES.length} demo roommate profiles`);

  await Review.deleteMany({ user: { $in: Object.values(demoUsers).map((u) => u._id) } });

  const demoReviews = [
    {
      user: demoUsers.aarav._id,
      listingType: 'property',
      listingId: propertyDocs[0]._id,
      rating: 5,
      comment:
        'Stayed here during my first year at Christ University. Safe, quiet during exam season, and the high-speed Wi-Fi actually works reliably on all floors.',
      reviewerType: 'student',
      verifiedInteraction: true,
      status: 'approved'
    },
    {
      user: customer._id,
      listingType: 'property',
      listingId: propertyDocs[0]._id,
      rating: 5,
      comment:
        'Clean rooms, punctual housekeeping, and peaceful study lounge. Very convenient walking distance from the main road.',
      reviewerType: 'resident',
      verifiedInteraction: true,
      status: 'approved'
    },
    {
      user: demoUsers.sneha._id,
      listingType: 'property',
      listingId: propertyDocs[1]._id,
      rating: 5,
      comment:
        'I work at EON IT park and this PG is super comfortable. AC works great, food tastes like home, and having an attached bathroom is a huge plus.',
      reviewerType: 'working_professional',
      verifiedInteraction: true,
      status: 'approved'
    },
    {
      user: demoUsers.kabir._id,
      listingType: 'property',
      listingId: propertyDocs[2]._id,
      rating: 5,
      comment:
        'Great gated society with covered parking and power backup. Financial district is just 10 mins away. Flatmates are friendly and cooperative.',
      reviewerType: 'working_professional',
      verifiedInteraction: true,
      status: 'approved'
    },
    {
      user: demoUsers.ananya._id,
      listingType: 'property',
      listingId: propertyDocs[3]._id,
      rating: 4,
      comment:
        'Affordable room close to DU North Campus. Study atmosphere is great. Landlord is responsive to any maintenance requests.',
      reviewerType: 'student',
      verifiedInteraction: true,
      status: 'approved'
    },
    {
      user: demoUsers.aarav._id,
      listingType: 'food',
      listingId: foodDocs[0]._id,
      rating: 5,
      comment:
        'Best South Indian mess in Koramangala! Unlimited hot rice and piping hot sambar. Totally pocket-friendly for college students.',
      reviewerType: 'student',
      verifiedInteraction: true,
      status: 'approved'
    },
    {
      user: customer._id,
      listingType: 'food',
      listingId: foodDocs[0]._id,
      rating: 5,
      comment:
        'Hygiene is top tier. The Wednesday and Sunday curd rice and special sweets make it feel like home.',
      reviewerType: 'resident',
      verifiedInteraction: true,
      status: 'approved'
    },
    {
      user: demoUsers.sneha._id,
      listingType: 'food',
      listingId: foodDocs[1]._id,
      rating: 5,
      comment:
        'Soft phulkas and fresh sabzi delivered right on time every day at 1 PM to our office. Highly recommended for working employees.',
      reviewerType: 'working_professional',
      verifiedInteraction: true,
      status: 'approved'
    },
    {
      user: demoUsers.ananya._id,
      listingType: 'food',
      listingId: foodDocs[3]._id,
      rating: 5,
      comment:
        'Life-saver for UPSC & college students in Mukherjee Nagar. Pure home-style taste and no excess oil.',
      reviewerType: 'student',
      verifiedInteraction: true,
      status: 'approved'
    }
  ];

  await Review.insertMany(demoReviews);
  created.push(`${demoReviews.length} demo reviews from students and employees`);

  for (const property of propertyDocs) {
    await recalculateRating('property', property._id);
  }
  for (const food of foodDocs) {
    await recalculateRating('food', food._id);
  }

  console.log('Seed complete:');
  created.forEach((entry) => console.log(`  - ${entry}`));
  console.log('\nDemo accounts (demo data only - not real customers):');
  console.log(`  Customer: ${customer.email} / ${DEMO_PASSWORD}`);
  console.log(`  Owner:    ${owner.email} / ${DEMO_PASSWORD}`);
  console.log(`  Provider: ${provider.email} / ${DEMO_PASSWORD}`);
  if (admin) console.log(`  Admin:    ${admin.email} / (password from ADMIN_PASSWORD)`);
  console.log('\nDemo listings & authentic student/employee reviews seeded successfully.\n');

  return { customer, owner, provider, admin };
}

module.exports = { seedDatabase, DEMO_PASSWORD };

if (require.main === module) {
  (async () => {
    const { connectDatabase, disconnectDatabase } = require('./config/db');
    try {
      await connectDatabase();
      await seedDatabase();
    } catch (error) {
      console.error('Seed failed:', error);
      process.exitCode = 1;
    } finally {
      await disconnectDatabase();
    }
  })();
}
