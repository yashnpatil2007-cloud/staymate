# StayMate – Find Your Stay. Find Your People.

StayMate is a modern, full-stack living and accommodation marketplace designed specifically for college students, first-year relocators, and working professionals moving to new cities. It brings together verified stays, transparent roommate matching, and dependable home-cooked food and tiffin services into a single unified platform.

---

## 🌟 Key Capabilities & Features

### 1. Accommodation Finder
- **6 Categories**: Hostels, PGs, Single Rooms, Shared Rooms, Flats, and Apartments.
- **Dynamic Multi-Filters**: City, locality, rent range (min/max budget), accommodation type, gender preference (male/female/any), furnishing (furnished, semi-furnished, unfurnished), occupancy, available beds, and 10 amenities (Wi-Fi, AC, Food, Laundry, Parking, Attached Bathroom, Power Backup, 24x7 Security, Gym, Housekeeping).
- **Rich Listing Details**: Image galleries, rent, security deposit, detailed house rules, nearby colleges and tech parks, live availability, map coordinates, and owner profile.
- **Genuine Enquiries**: Direct enquiry submission that routes immediately into the owner's dashboard with real-time notification.

### 2. Roommate Compatibility Matching
- **Explainable Compatibility Algorithm**: Deterministic calculation (0–100%) computed directly from matching parameters:
  - Budget range overlap (up to 25 pts)
  - Same city & locality (up to 20 pts)
  - Accommodation preference (15 pts)
  - Food preference match (10 pts)
  - Sleep schedule match (10 pts)
  - Shared lifestyle interests (up to 10 pts)
  - Smoking & cleanliness habits (up to 10 pts)
- **Zero Random Numbers**: Transparent breakdown viewable by both parties explaining why they match.
- **Privacy-First Requests**: Phone and email contact details remain hidden until both users mutually send and accept a connection request.

### 3. Food & Tiffin Discovery
- **Services**: Mess, Tiffin delivery services, Home-cooked meal providers, and Monthly meal subscriptions.
- **Filtering**: Vegetarian / Non-vegetarian / Both, Meal availability (Breakfast, Lunch, Dinner), monthly pricing, city, and locality.
- **Provider Dashboards**: Manage weekly menus, multiple meal plans, delivery areas, pricing, and customer enquiries.

### 4. Verified Reviews & Moderation
- **No Seeded Reviews**: Reviews can only be submitted after an enquiry has been marked "contacted" by the owner or food provider.
- **Admin Moderation**: New listings for properties and food providers enter a pending queue for administrator approval or rejection with reason.
- **Abuse & Report System**: Users and listings can be flagged with reasons; administrators review, dismiss, or resolve reports with audit notes.

### 5. Multi-Role Dashboards
- **Customer Dashboard**: Saved stays, roommate requests (sent/received), active connections, enquiries, and in-app notifications.
- **Property Owner Dashboard**: Add/edit/delete properties, upload multiple photos, toggle bed availability, update rent, and manage incoming tenant enquiries.
- **Food Provider Dashboard**: Business profile, menu updates, meal plan creation/editing, photo management, and lead tracking.
- **Admin Dashboard**: Member role management, account suspension/activation, listing approval/rejection, report moderation, and live platform analytics.

---

## 🛠️ Technology Stack

- **Frontend**: React 18, React Router v6, Vite 6, Lucide React icons, bespoke responsive CSS design system (Navy `#071821` & Emerald Teal `#0f9d8a`).
- **Backend**: Node.js 24, Express 4, Mongoose 8, Helmet, CORS, Cookie-Parser, Compression, Morgan, Express-Rate-Limit, Zod.
- **Authentication**: JWT with dual authentication (secure HTTP-only cookie + fallback `Authorization: Bearer <token>` in localStorage) and bcryptjs password hashing.
- **Database**: MongoDB (supports MongoDB Atlas, local MongoDB, or automatic zero-config `mongodb-memory-server` in development).
- **Storage**: Multi-file uploader with automatic fallback between Cloudinary (when credentials provided) and local disk storage (`server/uploads`).
- **Maps**: Real coordinates with OpenStreetMap iframe (zero API key requirement) or Google Maps Embed API when `VITE_GOOGLE_MAPS_API_KEY` is provided, plus HTML5 Geolocation straight-line distance calculation.

---

## 🚀 Getting Started Locally

### Prerequisites
- Node.js 18+ (tested on Node.js 24)
- npm 9+

### 1. Clone & Install Dependencies
```bash
# Install root, server, and client dependencies in one command
npm run install:all
```

### 2. Environment Configuration
Copy `.env.example` into `server/.env` and `client/.env`:
```bash
# Backend configuration
cp server/.env.example server/.env

# Frontend configuration
cp client/.env.example client/.env
```

*(Note: In development, `MONGODB_URI` can be left blank. The server will automatically spin up an in-memory MongoDB instance with pre-seeded demo accounts!)*

### 3. Seed Demo Data (Optional)
```bash
npm run seed
```
Demo accounts available out-of-the-box:
- **Customer**: `customer@staymate.app` / `Demo1234!`
- **Property Owner**: `owner@staymate.app` / `Demo1234!`
- **Food Provider**: `provider@staymate.app` / `Demo1234!`
- **Admin**: `admin@staymate.app` / `ChangeMe123!`

### 4. Run Both Frontend and Backend Concurrently
```bash
npm run dev
```
- Frontend: [http://localhost:5173](http://localhost:5173)
- Backend API: [http://localhost:5000/api](http://localhost:5000/api)

### 5. Run the Automated End-to-End Integration Test Suite
```bash
npm run test:e2e
```
Runs 18 end-to-end integration tests verifying health checks, authentication, property search, roommate scoring, requests, connections, enquiries, and reviews.

---

## 📦 Deployment Instructions

### Frontend (Netlify / Vercel)
1. Set the root directory or base directory to `client`.
2. Build command: `npm run build`
3. Publish directory: `dist`
4. Environment variables:
   - `VITE_API_URL`: `https://your-backend.onrender.com/api`
   - `VITE_DEMO_MODE`: `false`
   - `VITE_GOOGLE_MAPS_API_KEY`: *(Optional Google Maps API key)*

### Backend (Render / Railway)
1. Set root directory to `server`.
2. Build command: `npm install`
3. Start command: `node src/server.js`
4. Required environment variables:
   - `NODE_ENV`: `production`
   - `PORT`: `5000` (or host provided `$PORT`)
   - `CLIENT_URL`: `https://your-frontend.netlify.app`
   - `MONGODB_URI`: `mongodb+srv://<user>:<password>@cluster0.mongodb.net/staymate?retryWrites=true&w=majority`
   - `JWT_SECRET`: *(A 64-character random string)*
   - `ADMIN_EMAIL`: `admin@staymate.app`
   - `ADMIN_PASSWORD`: *(A strong password)*
   - `SEED_DEMO`: `false`
   - `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`: *(Optional Cloudinary credentials for permanent cloud image hosting)*

---

## 💡 Monetization Architecture

StayMate is structured for sustainable future monetization while preserving free customer search and discovery:
- **Featured Listings**: Owners and providers can have their listings highlighted at the top of search results (`isFeatured: true`).
- **Subscription Tiers**: Pro owner and premium food provider subscription plans for increased listing limits and analytics.
- **Verified Badge Verification**: Paid inspection and verification services for properties.
- **Future Booking Deposits**: Escrow and token booking advance reserves.
