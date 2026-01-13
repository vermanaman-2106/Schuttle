# Schuttle - Ride Sharing App for MUJ

A full-stack ride-sharing application for Manipal University Jaipur (MUJ) students and drivers. Built with React Native (Expo) and Node.js/Express backend.

## Project Structure

```
Schuttle/
├── Backend/                    # Node.js + Express + MongoDB backend
│   ├── config/                # Database configuration
│   ├── controllers/           # Route controllers
│   ├── middleware/            # Auth & error handling middleware
│   ├── models/                # Mongoose models (User, Driver, Ride, Booking)
│   ├── routes/                # API routes
│   ├── utils/                 # Utilities (token generation, notifications)
│   └── server.js              # Express server entry point
└── app/
    └── Schuttle/              # React Native + Expo frontend
        ├── src/
        │   ├── api/           # API client (axios, auth, rides, bookings)
        │   ├── components/    # Reusable components (Button, Card, Input, etc.)
        │   ├── navigation/    # Navigation stacks (Auth, App, Student/Driver tabs)
        │   ├── screens/        # Screen components
        │   ├── services/       # Services (notifications)
        │   ├── store/          # Zustand state management
        │   ├── theme/          # Theme configuration (colors, typography)
        │   └── utils/          # Utilities (cache, retry logic)
        └── index.js            # App entry point
```

## Tech Stack

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js 5.x
- **Database**: MongoDB Atlas (via Mongoose)
- **Authentication**: JWT (7-day expiration)
- **Validation**: Express Validator
- **Security**: Bcryptjs for password hashing
- **Notifications**: Expo Push Notification Service
- **Middleware**: CORS, Compression, Morgan (logging)

### Frontend
- **Framework**: React Native with Expo SDK 54
- **Navigation**: React Navigation (Native Stack + Bottom Tabs)
- **State Management**: Zustand
- **Forms**: Formik + Yup validation
- **HTTP Client**: Axios with interceptors
- **Storage**: AsyncStorage for token & cache persistence
- **Notifications**: Expo Notifications
- **UI**: Custom dark theme with neon accent colors

## Setup Instructions

### Backend Setup

1. Navigate to the backend directory:
```bash
cd Backend
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file (copy from `.env.example`):
```bash
cp .env.example .env
```

4. Create a `.env` file with the following variables:
```env
MONGO_URI=your_mongodb_atlas_connection_string
JWT_SECRET=your_super_secret_jwt_key
PORT=5000
CORS_ORIGIN=*
ADMIN_SECRET=schuttle-admin-2024  # Optional: For driver verification endpoint
NODE_ENV=development
```

5. Start the backend server:
```bash
# Development mode (with nodemon)
npm run dev

# Production mode
npm start
```

The backend will run on `http://localhost:5000`

### Frontend Setup

1. Navigate to the app directory:
```bash
cd app/Schuttle
```

2. Install dependencies:
```bash
npm install
```

3. Update the API base URL in `src/api/axios.js`:
   - **Production (Render)**: Already configured as `https://schuttle-backend.onrender.com/api`
   - **Local Development**: Set `USE_LOCAL=true` and update the IP address:
     - For iOS Simulator: `http://localhost:5000/api`
     - For Android Emulator: `http://10.0.2.2:5000/api`
     - For Physical Device: Use your computer's IP (e.g., `http://192.168.1.100:5000/api`)

4. Start the Expo development server:
```bash
npm start
# or
npx expo start
```

5. Run on your preferred platform:
   - Press `i` for iOS simulator
   - Press `a` for Android emulator
   - Scan QR code with Expo Go app on your physical device

## API Endpoints

### Authentication
- `POST /api/auth/student/register` - Register a student (requires MUJ email)
- `POST /api/auth/student/login` - Login as student
- `POST /api/auth/driver/register` - Register a driver
- `POST /api/auth/driver/login` - Login as driver
- `GET /api/auth/me` - Get current user profile (protected)
- `PUT /api/auth/notification-token` - Save Expo push notification token (protected)

### Rides
- `GET /api/rides` - Get all available rides (with optional filters: date, pickupLocation, dropLocation)
- `GET /api/rides/:id` - Get ride details by ID
- `POST /api/rides` - Create a new ride (driver only, requires verification)
- `GET /api/rides/driver/rides` - Get driver's rides (driver only)
- `PUT /api/rides/:id/confirm` - Confirm a ride (driver only, changes status from pending to open)
- `PUT /api/rides/:id` - Update ride status (driver only)
- `DELETE /api/rides/:id` - Delete a ride (driver only, only if no confirmed bookings)

### Bookings
- `POST /api/bookings` - Create a booking (student only, atomically decrements seats)
- `GET /api/bookings/me` - Get student's bookings (student only)
- `GET /api/bookings/driver` - Get driver's bookings (driver only)
- `PUT /api/bookings/:id/cancel` - Cancel a booking (student only)
- `PUT /api/bookings/:id/confirm` - Confirm a booking (driver only)
- `PUT /api/bookings/:id/reject` - Reject a booking (driver only)

### Drivers (Admin)
- `GET /api/drivers` - Get all drivers (with optional filters: verified, search)
- `GET /api/drivers/:id` - Get driver details
- `PUT /api/drivers/:id/verify` - Verify a driver (requires adminSecret)
- `PUT /api/drivers/:id/unverify` - Unverify a driver (requires adminSecret)

### Health & Utility
- `GET /api/health` - Health check endpoint
- `GET /api/keepalive` - Keep-alive endpoint (for preventing Render cold starts)

## Features

### Student Features
- **Authentication**: Register/Login with MUJ email (@muj.manipal.edu or @jaipur.manipal.edu)
- **Browse Rides**: View all available confirmed rides with filters (date, location)
- **Ride Details**: View complete ride information including driver contact
- **Book Seats**: Book one or more seats with atomic seat management (prevents overbooking)
- **My Bookings**: View all bookings with status (pending, confirmed, cancelled, rejected)
- **Cancel Bookings**: Cancel pending or confirmed bookings (seats automatically returned)
- **Push Notifications**: Receive notifications for booking confirmations/rejections
- **Offline Support**: Cached data for offline viewing

### Driver Features
- **Authentication**: Register/Login as driver
- **Verification System**: Account starts unverified; admin verification required to create rides
- **Create Rides**: Create rides with pickup/drop locations, date, time, price, and seat count
- **Ride Confirmation**: Rides start as "pending" - must be confirmed to become visible to students
- **My Rides**: View all created rides with status tracking (pending, open, full, cancelled, completed)
- **Manage Rides**: Delete rides (only if no confirmed bookings) or update status
- **View Bookings**: See all bookings for your rides with student contact information
- **Booking Management**: Confirm or reject booking requests from students
- **Push Notifications**: Receive notifications for new bookings and cancellations
- **Profile**: View verification status and vehicle information

### Admin Features
- **Driver Verification**: Verify/unverify drivers via API endpoint (requires adminSecret)
- **View All Drivers**: List all drivers with verification status

## Database Models

### User (Students)
- **Fields**: Name, Email (MUJ only), Phone, Password Hash
- **Optional**: Registration Number, Department
- **Role**: "student" (default)
- **Additional**: Notification Token (for push notifications)
- **Collection**: `users`

### Driver
- **Fields**: Name, Email, Phone, Password Hash
- **Vehicle Info**: Vehicle Model, Vehicle Number, Total Seats
- **Verification**: Verified (boolean, default: false)
- **Documents**: License Photo URL, RC Photo URL (optional)
- **Role**: "driver"
- **Additional**: Notification Token (for push notifications)
- **Collection**: `Driver User`

### Ride
- **Driver**: Driver ID (reference)
- **Locations**: Pickup Location, Drop Location
- **Schedule**: Date (Date), Time (String)
- **Pricing**: Price Per Seat
- **Capacity**: Total Seats, Available Seats
- **Status**: "pending", "open", "full", "cancelled", "completed"
- **Confirmation**: Confirmed (boolean, default: false)
- **Indexes**: Driver ID, Status, Date, Confirmed, Text search on locations
- **Collection**: `Rides`

### Booking
- **References**: Ride ID, Student ID, Driver ID
- **Details**: Seats Booked, Pickup Location, Drop Location, Ride Date/Time
- **Status**: Booking Status ("pending", "confirmed", "cancelled", "completed", "rejected")
- **Payment**: Payment Status ("pending", "paid", "failed")
- **Indexes**: Student ID, Driver ID, Ride ID, Booking Status
- **Collection**: `bookings`

## Key Workflows

### Ride Creation Flow
1. Driver registers → Account starts as `verified: false`
2. Admin verifies driver via `/api/drivers/:id/verify` endpoint
3. Driver creates ride → Status: `pending`, `confirmed: false`
4. Driver confirms ride → Status: `open`, `confirmed: true` (now visible to students)
5. Students can book seats → Available seats decremented atomically

### Booking Flow
1. Student creates booking → Status: `pending`, seats atomically decremented
2. Driver receives push notification
3. Driver can:
   - **Confirm** → Status: `confirmed`, student receives notification
   - **Reject** → Status: `rejected`, seats returned to ride
4. Student can cancel → Status: `cancelled`, seats returned to ride

### Important Notes
- **Email Validation**: Students must use MUJ email (@muj.manipal.edu or @jaipur.manipal.edu)
- **Driver Verification**: Drivers start unverified; admin verification required before creating rides
- **Atomic Operations**: Seat booking uses MongoDB `$inc` to prevent race conditions
- **Ride Visibility**: Only confirmed rides with status "open" are visible to students
- **Booking States**: Bookings start as "pending" and require driver confirmation
- **Seat Management**: Seats are automatically returned when bookings are cancelled or rejected

## Development

### Backend
- **Auto-reload**: Nodemon for development (`npm run dev`)
- **Error Handling**: Centralized error handler with user-friendly messages
- **Validation**: Express Validator for request validation
- **Security**: JWT tokens expire after 7 days, password hashing with bcryptjs (10 rounds)
- **Performance**: 
  - Lean queries for read operations
  - Database indexes for efficient queries
  - Compression middleware for responses
- **Notifications**: Expo Push Notification Service integration
- **Keep-Alive**: `/api/keepalive` endpoint to prevent Render cold starts

### Frontend
- **Theme**: Dark theme with charcoal background (#121212) and neon yellow accent (#F3FF8A)
- **State Management**: Zustand store for authentication with AsyncStorage persistence
- **Forms**: Formik + Yup for form validation
- **Performance Optimizations**:
  - Request cancellation on unmount
  - Caching with AsyncStorage (5-minute TTL)
  - Retry logic for Render cold starts (5 retries with exponential backoff)
  - FlatList optimizations (removeClippedSubviews, pagination)
- **Offline Support**: Cached data shown immediately, fresh data fetched in background
- **Notifications**: Expo Notifications with automatic token registration
- **Error Handling**: User-friendly error messages with retry options

## Troubleshooting

### Backend Issues

**MongoDB Connection Error**
- Verify `MONGO_URI` in `.env` is correct
- Check MongoDB Atlas IP whitelist includes your IP
- Ensure network connectivity to MongoDB Atlas

**Authentication Errors**
- Verify `JWT_SECRET` is set in `.env`
- Check token expiration (7 days)
- Ensure Authorization header format: `Bearer <token>`

**CORS Issues**
- Verify `CORS_ORIGIN` in `.env` matches frontend URL
- For development, use `*` or specific origin
- Check backend logs for CORS errors

**Render Cold Starts**
- First request after inactivity may take 30-60 seconds
- Frontend includes retry logic (5 attempts with backoff)
- Use `/api/keepalive` endpoint with cron job to prevent cold starts

**Driver Verification**
- Drivers cannot create rides until verified
- Use `/api/drivers/:id/verify` with `adminSecret` in request body
- Check `ADMIN_SECRET` in `.env` (default: `schuttle-admin-2024`)

### Frontend Issues

**API Connection Errors**
- Update API base URL in `src/api/axios.js`
- For local development: Set `USE_LOCAL=true` and update IP address
- For physical devices: Ensure phone and computer are on same network
- Check backend server is running

**Network Timeout Errors**
- Render cold starts can cause timeouts
- App automatically retries with exponential backoff
- Increase timeout in `axios.js` if needed (currently 60 seconds)

**Cache Issues**
- Clear Expo cache: `npx expo start -c`
- Clear app data: Uninstall and reinstall app
- Cache automatically expires after 5 minutes

**Notification Issues**
- Ensure Expo project ID is configured in `app.json`
- Check notification permissions are granted
- Verify notification token is saved to backend

**Build Errors**
- Clear node_modules: `rm -rf node_modules && npm install`
- Clear Expo cache: `npx expo start -c`
- Check Node.js version compatibility (recommended: 18+)

## Deployment

### Backend (Render)
- Deploy to Render.com or similar platform
- Set environment variables in Render dashboard
- Use `/api/keepalive` endpoint with cron job (every 5 minutes) to prevent cold starts
- MongoDB Atlas connection string must be accessible from Render

### Frontend (Expo)
- Build with EAS: `eas build --platform ios/android`
- Or use Expo Go for development/testing
- Configure production API URL in `src/api/axios.js`
- Ensure notification credentials are set up for push notifications

## License

ISC

## License

ISC

