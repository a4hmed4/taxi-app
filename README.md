# Smart Carpooling App

Route-based carpooling mobile app built with Expo, Firebase, and Google Maps.

## Architecture

The codebase uses a feature-first structure with shared platform services:

- `src/app` for app bootstrap and providers
- `src/navigation` for stack and role-based routing
- `src/features/auth` for sign-in, role selection, and profile setup
- `src/features/drivers` for driver trip creation and management
- `src/features/trips` for trip publishing, discovery, and booking
- `src/features/tracking` for live driver location and trip progress
- `src/services` for Firebase and external integrations (Google Maps, etc.)
- `src/shared` for reusable UI, hooks, types, and utilities

## Features

### Driver Features
- **Create Trip**: Drivers can create trips by selecting start/destination locations (with Google Maps autocomplete), departure time, and available seats
  - Start location (Google Maps autocomplete)
  - Destination (Google Maps autocomplete)
  - Departure time picker
  - Available seats selector
  - Automatic route coordinates fetching from Google Directions API
  - Trip saved to Firestore with status = "active"
  - Success screen with auto-redirect to Driver Home

## Planned build phases

1. ✓ Auth and role onboarding
2. ✓ Driver trip creation (CREATE TRIP feature)
3. Passenger trip discovery and joining
4. Real-time trip tracking
5. Cloud Functions and security rules

## Firebase surfaces

- Auth for account access
- Firestore for trips, profiles, bookings, and trip state
- Realtime Database for high-frequency live location updates
- Cloud Functions for matching, notifications, and moderation workflows

## Setup

### Prerequisites
- Node.js 18+
- Expo CLI
- Firebase project with Firestore enabled
- Google Maps API keys (Places API, Directions API, Maps API)

### Environment Variables
Create a `.env` file with:
```
FIREBASE_API_KEY=your_api_key
FIREBASE_AUTH_DOMAIN=your_auth_domain
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_STORAGE_BUCKET=your_storage_bucket
FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
FIREBASE_APP_ID=your_app_id
GOOGLE_MAPS_API_KEY=your_google_maps_api_key
```

### Installation
```bash
npm install
npm run ios # or npm run android
```

## Create Trip Implementation Details

### Components
- `LocationAutocomplete`: Google Places autocomplete for location selection
- `DateTimePickerInput`: DateTime picker for departure time
- `SeatsInput`: Seat quantity selector with increment/decrement buttons
- `CreateTripScreen`: Main form for trip creation
- `CreateTripSuccessScreen`: Success confirmation screen

### Services
- `trips.service.ts`: Trip creation, validation, and Firestore operations
- `directions.service.ts`: Google Directions API integration for route coordinates
- `places.service.ts`: Google Places API for location autocomplete and details

### Validation
- All locations are required with valid coordinates
- Start and destination cannot be the same
- Departure time must be at least 15 minutes in the future
- Available seats must be between 1-7

### Firestore Schema
```
trips/
  {tripId}/
    driverId: string
    startLocation: {
      address: string
      coordinate: { latitude, longitude }
      placeId: string
    }
    destinationLocation: {
      address: string
      coordinate: { latitude, longitude }
      placeId: string
    }
    departureTime: number (timestamp)
    availableSeats: number
    routeCoordinates: [{ latitude, longitude }]
    status: "active" | "completed" | "cancelled"
    createdAt: number (timestamp)
    updatedAt: number (timestamp)
```