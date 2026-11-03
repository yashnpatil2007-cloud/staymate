export const PROPERTY_TYPE_LABELS = {
  hostel: 'Hostel',
  pg: 'PG',
  single_room: 'Single Room',
  shared_room: 'Shared Room',
  flat: 'Flat',
  apartment: 'Apartment'
};

export const AMENITY_LABELS = {
  wifi: 'Wi-Fi',
  ac: 'Air conditioning',
  laundry: 'Laundry',
  parking: 'Parking',
  attached_bathroom: 'Attached bathroom',
  food: 'Food available',
  power_backup: 'Power backup',
  security: '24x7 security',
  gym: 'Gym',
  housekeeping: 'Housekeeping'
};

export const FURNISHING_LABELS = {
  furnished: 'Furnished',
  semi_furnished: 'Semi-furnished',
  unfurnished: 'Unfurnished'
};

export const FOOD_TYPE_LABELS = {
  mess: 'Mess',
  tiffin: 'Tiffin service',
  home_cooked: 'Home-cooked meals',
  meal_plan: 'Daily meal plan'
};

export const FOOD_PREFERENCE_LABELS = {
  veg: 'Vegetarian',
  non_veg: 'Non-vegetarian',
  both: 'Veg & non-veg',
  any: 'Open to anything'
};

export const OCCUPATION_LABELS = {
  student: 'Student',
  working_professional: 'Working professional'
};

export const SLEEP_LABELS = {
  early_bird: 'Early bird',
  night_owl: 'Night owl',
  flexible: 'Flexible'
};

export const CLEANLINESS_LABELS = {
  relaxed: 'Relaxed',
  moderate: 'Moderate',
  very_clean: 'Very clean'
};

export const SMOKING_LABELS = {
  no: 'Non-smoker',
  yes: 'Smoker',
  occasionally: 'Occasionally'
};

export const GENDER_LABELS = {
  male: 'Male',
  female: 'Female',
  other: 'Other',
  any: 'Any'
};

export const OCCUPANCY_LABELS = {
  single: 'Single occupancy',
  double: 'Double sharing',
  triple: 'Triple sharing',
  shared: 'Shared'
};

export const ROLE_LABELS = {
  customer: 'Customer',
  owner: 'Property owner',
  food_provider: 'Food provider',
  admin: 'Administrator'
};

export const MEAL_LABELS = {
  breakfast: 'Breakfast',
  lunch: 'Lunch',
  dinner: 'Dinner'
};

export const LIFESTYLE_LABELS = {
  early_riser: 'Early riser',
  gym: 'Gym',
  cooking: 'Cooking',
  gaming: 'Gaming',
  reading: 'Reading',
  social: 'Social',
  quiet: 'Quiet',
  pets: 'Pets'
};

export function formatCurrency(value) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return '—';
  return `₹${Number(value).toLocaleString('en-IN')}`;
}

export function formatDate(value) {
  if (!value) return '—';
  return new Date(value).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
}

export function timeAgo(value) {
  if (!value) return '';
  const diff = Date.now() - new Date(value).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hr ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} day${days === 1 ? '' : 's'} ago`;
  return formatDate(value);
}

export function initials(name = '') {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0].toUpperCase())
    .join('');
}

export function roleHome(role) {
  if (role === 'admin') return '/admin';
  if (role === 'owner') return '/owner';
  if (role === 'food_provider') return '/provider';
  return '/dashboard';
}

export function settingsPath(role) {
  return `${roleHome(role)}/settings`;
}

export function classNames(...values) {
  return values.filter(Boolean).join(' ');
}

export function toNumberOrUndefined(value) {
  if (value === '' || value === null || value === undefined) return undefined;
  const number = Number(value);
  return Number.isNaN(number) ? undefined : number;
}
