const assert = require('assert');
const app = require('./src/app');
const { connectDatabase, disconnectDatabase } = require('./src/config/db');
const { seedDatabase } = require('./src/seed');
const User = require('./src/models/User');
const Property = require('./src/models/Property');
const FoodProvider = require('./src/models/FoodProvider');
const RoommateProfile = require('./src/models/RoommateProfile');
const RoommateRequest = require('./src/models/RoommateRequest');
const Enquiry = require('./src/models/Enquiry');
const Review = require('./src/models/Review');
const SavedListing = require('./src/models/SavedListing');
const Notification = require('./src/models/Notification');
const http = require('http');

let server;
let baseUrl;

function request(method, path, body = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, baseUrl);
    const options = {
      method,
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      headers: {
        'x-staymate-client': 'web',
        'content-type': 'application/json',
        ...headers
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        let json = null;
        try {
          json = JSON.parse(data);
        } catch {}
        resolve({
          status: res.statusCode,
          headers: res.headers,
          data: json,
          raw: data
        });
      });
    });

    req.on('error', reject);
    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

async function runTests() {
  console.log('--- STARTING STAYMATE COMPREHENSIVE VERIFICATION SUITE ---');

  console.log('1. Connecting to database...');
  await connectDatabase();

  console.log('2. Starting test HTTP server...');
  await new Promise((resolve) => {
    server = app.listen(0, () => {
      const port = server.address().port;
      baseUrl = `http://localhost:${port}`;
      console.log(`Test server running at ${baseUrl}`);
      resolve();
    });
  });

  console.log('3. Seeding baseline data...');
  await seedDatabase();

  console.log('4. Testing Health Check...');
  const health = await request('GET', '/api/health');
  assert.strictEqual(health.status, 200, 'Health check failed');
  assert.strictEqual(health.data.status, 'ok', 'Health status is not ok');
  console.log('   ✓ Health check passed');

  console.log('5. Testing Meta Places & Testimonials...');
  const places = await request('GET', '/api/meta/places');
  assert.strictEqual(places.status, 200);
  assert(places.data.cities.length > 0, 'No cities returned');
  const testimonials = await request('GET', '/api/meta/testimonials');
  assert.strictEqual(testimonials.status, 200);
  console.log('   ✓ Meta endpoints passed');

  console.log('6. Testing User Registration & Authentication...');
  const custRes = await request('POST', '/api/auth/register', {
    name: 'Aarav Sharma',
    email: 'aarav.test@staymate.app',
    password: 'Password123!',
    role: 'customer',
    phone: '+91 98765 43210',
    city: 'Bengaluru'
  });
  assert.strictEqual(custRes.status, 201, 'Customer registration failed');
  assert(custRes.data.token, 'No token returned on registration');
  const custToken = custRes.data.token;
  const custHeaders = { Authorization: `Bearer ${custToken}` };

  const ownerRes = await request('POST', '/api/auth/register', {
    name: 'Vikram Malhotra',
    email: 'vikram.owner@staymate.app',
    password: 'Password123!',
    role: 'owner',
    phone: '+91 98111 22334',
    city: 'Bengaluru'
  });
  assert.strictEqual(ownerRes.status, 201, 'Owner registration failed');
  const ownerToken = ownerRes.data.token;
  const ownerHeaders = { Authorization: `Bearer ${ownerToken}` };

  const provRes = await request('POST', '/api/auth/register', {
    name: 'Pooja Tiffins',
    email: 'pooja.food@staymate.app',
    password: 'Password123!',
    role: 'food_provider',
    phone: '+91 98222 33445',
    city: 'Bengaluru'
  });
  assert.strictEqual(provRes.status, 201, 'Food provider registration failed');
  const provToken = provRes.data.token;
  const provHeaders = { Authorization: `Bearer ${provToken}` };

  console.log('7. Testing Login & Role Check...');
  const adminLogin = await request('POST', '/api/auth/login', {
    email: 'admin@staymate.app',
    password: process.env.ADMIN_PASSWORD || 'ChangeMe123!'
  });
  assert.strictEqual(adminLogin.status, 200, 'Admin login failed');
  const adminToken = adminLogin.data.token;
  const adminHeaders = { Authorization: `Bearer ${adminToken}` };
  assert.strictEqual(adminLogin.data.user.role, 'admin');
  console.log('   ✓ All 4 user roles registered & logged in successfully');

  console.log('8. Testing Owner Property Creation & Management...');
  const newProp = await request('POST', '/api/properties', {
    name: 'Greenwood Executive PG',
    description: 'Spacious single and sharing rooms near Manyata Tech Park with high speed WiFi, food and housekeeping.',
    type: 'pg',
    city: 'Bengaluru',
    area: 'Hebbal',
    address: '42, 2nd Cross, Near Manyata Gate 2',
    collegeNearby: '',
    workplaceNearby: 'Manyata Tech Park',
    rent: 9500,
    deposit: 15000,
    genderPreference: 'male',
    furnishing: 'furnished',
    occupancy: 'single',
    totalBeds: 10,
    availableBeds: 3,
    amenities: ['wifi', 'ac', 'food', 'laundry', 'security', 'power_backup'],
    houseRules: ['No smoking inside rooms', 'Gate closes at 11 PM'],
    images: ['https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&w=1200&q=80'],
    coordinates: { lat: 13.045, lng: 77.62 }
  }, ownerHeaders);
  assert.strictEqual(newProp.status, 201, 'Property creation failed');
  const propId = newProp.data.property._id;
  assert.strictEqual(newProp.data.property.status, 'pending');

  console.log('9. Testing Admin Property Moderation (Approve Listing)...');
  const approveProp = await request('PATCH', `/api/admin/properties/${propId}`, {
    status: 'approved',
    featured: true
  }, adminHeaders);
  assert.strictEqual(approveProp.status, 200, 'Property approval failed');
  assert.strictEqual(approveProp.data.property.status, 'approved');
  console.log('   ✓ Owner created property and Admin approved it');

  console.log('10. Testing Property Search & Filtering...');
  const searchProps = await request('GET', '/api/properties?city=Bengaluru&type=pg&amenity=wifi&amenity=food');
  assert.strictEqual(searchProps.status, 200);
  assert(searchProps.data.items.length > 0, 'No properties found matching filters');
  console.log(`   ✓ Search returned ${searchProps.data.items.length} properties matching Bengaluru + PG + wifi + food`);

  console.log('11. Testing Food Provider Listing & Meal Plans...');
  const newFood = await request('POST', '/api/food', {
    businessName: 'Annapurna Homely Tiffins',
    description: 'Authentic South & North Indian hygienic home-cooked meals delivered warm daily.',
    type: 'tiffin',
    city: 'Bengaluru',
    area: 'Hebbal',
    address: 'Near Hebbal Flyover',
    pricePerMonth: 3800,
    mealAvailability: ['lunch', 'dinner'],
    foodType: 'veg',
    menu: 'Roti, Dal Tadka, Sabzi, Rice, Sambar, Curd, Salad',
    phone: '+91 98222 33445',
    images: ['https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=1200&q=80']
  }, provHeaders);
  assert.strictEqual(newFood.status, 201, 'Food creation failed');
  const foodId = newFood.data.food._id;

  const approveFood = await request('PATCH', `/api/admin/food/${foodId}`, {
    status: 'approved'
  }, adminHeaders);
  assert.strictEqual(approveFood.status, 200, 'Food approval failed');

  const addPlan = await request('POST', `/api/food/${foodId}/plans`, {
    name: 'Executive Lunch & Dinner Plan',
    description: 'Fresh lunch & dinner delivered 6 days a week',
    pricePerMonth: 4200,
    mealsIncluded: ['lunch', 'dinner'],
    foodType: 'veg',
    menu: 'Daily changing special dishes with sweet on weekends'
  }, provHeaders);
  assert.strictEqual(addPlan.status, 201, 'Meal plan creation failed');
  console.log('   ✓ Food provider listing & meal plan created and approved');

  console.log('12. Testing Roommate Profiles & Real Compatibility Scoring...');
  // Customer 1 Profile
  const custProfile = await request('POST', '/api/roommates/profile/me', {
    age: 23,
    gender: 'male',
    city: 'Bengaluru',
    locality: 'Hebbal',
    budgetMin: 8000,
    budgetMax: 12000,
    occupation: 'working_professional',
    collegeOrCompany: 'Infosys',
    accommodationType: 'pg',
    foodPreference: 'veg',
    sleepSchedule: 'early_bird',
    smoking: 'no',
    cleanliness: 'very_clean',
    lifestyle: ['gym', 'reading'],
    preferredGender: 'male',
    bio: 'Software engineer looking for a calm, tidy flatmate near Manyata.',
    isVisible: true
  }, custHeaders);
  assert.strictEqual(custProfile.status, 200, 'Customer roommate profile failed');

  // Customer 2 Registration & Profile
  const cust2Res = await request('POST', '/api/auth/register', {
    name: 'Rohan Verma',
    email: 'rohan.test@staymate.app',
    password: 'Password123!',
    role: 'customer',
    phone: '+91 97777 88888',
    city: 'Bengaluru'
  });
  const cust2Headers = { Authorization: `Bearer ${cust2Res.data.token}` };
  await request('POST', '/api/roommates/profile/me', {
    age: 24,
    gender: 'male',
    city: 'Bengaluru',
    locality: 'Hebbal',
    budgetMin: 9000,
    budgetMax: 13000,
    occupation: 'working_professional',
    collegeOrCompany: 'Cognizant',
    accommodationType: 'pg',
    foodPreference: 'veg',
    sleepSchedule: 'early_bird',
    smoking: 'no',
    cleanliness: 'very_clean',
    lifestyle: ['gym'],
    preferredGender: 'male',
    bio: 'Analyst looking for a shared room or flat.',
    isVisible: true
  }, cust2Headers);

  // Check matching calculation
  const roommates = await request('GET', '/api/roommates?city=Bengaluru', null, custHeaders);
  assert.strictEqual(roommates.status, 200);
  const rohanMatch = roommates.data.items.find(item => item.user.name === 'Rohan Verma');
  assert(rohanMatch, 'Rohan match not found in Bengaluru');
  assert(rohanMatch.compatibility >= 80, `Expected high compatibility, got ${rohanMatch.compatibility}`);
  console.log(`   ✓ Roommate compatibility calculated accurately: ${rohanMatch.compatibility}% compatibility`);

  console.log('13. Testing Roommate Request & Connection Workflow...');
  // Aarav sends request to Rohan
  const sendReq = await request('POST', '/api/roommates/requests', {
    targetProfileId: rohanMatch.id,
    message: 'Hey Rohan, saw your profile! I work near Manyata too, let us connect.'
  }, custHeaders);
  assert.strictEqual(sendReq.status, 201, 'Sending roommate request failed');
  const reqId = sendReq.data.request._id;

  // Rohan views received requests
  const rohanInbox = await request('GET', '/api/roommates/requests/received', null, cust2Headers);
  assert.strictEqual(rohanInbox.status, 200);
  const receivedReq = rohanInbox.data.items.find(item => item.id.toString() === reqId.toString());
  assert(receivedReq, 'Request not found in recipient inbox');

  // Rohan accepts request
  const acceptReq = await request('PATCH', `/api/roommates/requests/${reqId}`, {
    action: 'accept'
  }, cust2Headers);
  assert.strictEqual(acceptReq.status, 200, 'Accepting request failed');

  // Both check connections for exchanged contacts
  const custConnections = await request('GET', '/api/roommates/connections', null, custHeaders);
  assert.strictEqual(custConnections.status, 200);
  const connWithRohan = custConnections.data.items.find(c => c.user.name === 'Rohan Verma');
  assert(connWithRohan, 'Connection with Rohan not established');
  assert.strictEqual(connWithRohan.user.phone, '+91 97777 88888', 'Phone not shared after acceptance');
  console.log('   ✓ Roommate request sent, accepted, and contact details securely unlocked');

  console.log('14. Testing Customer Enquiries...');
  const propEnquiry = await request('POST', '/api/enquiries', {
    listingType: 'property',
    listingId: propId,
    name: 'Aarav Sharma',
    email: 'aarav.test@staymate.app',
    phone: '+91 98765 43210',
    message: 'Hello, I would like to schedule a visit this Saturday afternoon.'
  }, custHeaders);
  assert.strictEqual(propEnquiry.status, 201, 'Property enquiry failed');
  const enqId = propEnquiry.data.enquiry._id;

  // Owner views enquiry and marks contacted
  const ownerEnquiries = await request('GET', '/api/enquiries/received', null, ownerHeaders);
  assert.strictEqual(ownerEnquiries.status, 200);
  const foundEnq = ownerEnquiries.data.items.find(e => e._id.toString() === enqId.toString());
  assert(foundEnq, 'Enquiry not received by owner');

  const markContacted = await request('PATCH', `/api/enquiries/${enqId}/status`, {
    status: 'contacted'
  }, ownerHeaders);
  assert.strictEqual(markContacted.status, 200);
  console.log('   ✓ Customer sent enquiry, owner received and marked contacted');

  console.log('15. Testing Genuine Review System...');
  const reviewRes = await request('POST', '/api/reviews', {
    listingType: 'property',
    listingId: propId,
    rating: 5,
    comment: 'Visited Greenwood PG last weekend. Very clean, quiet location, and owner was welcoming.'
  }, custHeaders);
  assert.strictEqual(reviewRes.status, 201, 'Review submission failed');

  const propDetail = await request('GET', `/api/properties/${propId}`);
  assert.strictEqual(propDetail.status, 200);
  assert.strictEqual(propDetail.data.property.ratingAvg, 5);
  assert.strictEqual(propDetail.data.property.reviewCount, 1);
  console.log('   ✓ Review submitted and property rating recalculated');

  console.log('16. Testing Saved Listings (Bookmarks)...');
  const saveProp = await request('POST', '/api/saved/toggle', {
    listingType: 'property',
    listingId: propId
  }, custHeaders);
  assert([200, 201].includes(saveProp.status), `Unexpected status ${saveProp.status}`);
  assert.strictEqual(saveProp.data.saved, true);

  const mySaved = await request('GET', '/api/saved', null, custHeaders);
  assert.strictEqual(mySaved.status, 200);
  assert(mySaved.data.items.length >= 1, 'Saved listing not found in customer list');
  console.log('   ✓ Property bookmarked and verified in customer saved list');

  console.log('17. Testing Notifications...');
  const notifs = await request('GET', '/api/notifications', null, ownerHeaders);
  assert.strictEqual(notifs.status, 200);
  assert(notifs.data.items.length > 0, 'No notifications found for owner');
  console.log(`   ✓ Owner received ${notifs.data.items.length} notifications`);

  console.log('18. Testing Admin Stats & Reports...');
  const statsRes = await request('GET', '/api/admin/stats', null, adminHeaders);
  assert.strictEqual(statsRes.status, 200);
  assert(statsRes.data.stats.totalUsers >= 4);
  assert(statsRes.data.stats.approvedProperties >= 1);

  // Submit report
  const reportRes = await request('POST', '/api/reports', {
    targetType: 'property',
    targetId: propId,
    reason: 'other',
    details: 'Just testing reporting system'
  }, custHeaders);
  assert.strictEqual(reportRes.status, 201);
  console.log('   ✓ Admin statistics and reporting verified');

  console.log('----------------------------------------------------');
  console.log('ALL 18 INTEGRATION TEST SUITES PASSED SUCCESSFULLY!');
  console.log('----------------------------------------------------');
}

runTests()
  .then(async () => {
    if (server) server.close();
    await disconnectDatabase();
    process.exit(0);
  })
  .catch(async (error) => {
    console.error('TEST SUITE FAILED:', error);
    if (server) server.close();
    await disconnectDatabase();
    process.exit(1);
  });
