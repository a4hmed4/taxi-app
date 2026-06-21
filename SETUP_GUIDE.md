# Create Trip Feature - Setup Guide

## Overview
The Create Trip feature allows drivers to create new trips with the following flow:
1. Driver inputs start location (Google Maps autocomplete)
2. Driver inputs destination (Google Maps autocomplete)
3. Driver selects departure time
4. Driver specifies available seats (1-7)
5. System fetches route coordinates from Google Directions API
6. Trip data saved to Firestore with status="active"
7. Success screen shown with auto-redirect to Driver Home

## Installation

### 1. Install Dependencies
```bash
npm install
npm install @react-native-community/datetimepicker
```

### 2. Google Maps Configuration

#### Get Google Maps API Keys
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project
3. Enable these APIs:
   - **Google Places API**
   - **Google Maps Directions API**
   - **Google Maps Geocoding API**
4. Create an API key (restricting to iOS/Android if needed)

#### Set Environment Variables
Update your `.env` file:
```
FIREBASE_API_KEY=your_firebase_api_key
FIREBASE_AUTH_DOMAIN=your_firebase_auth_domain
FIREBASE_PROJECT_ID=your_firebase_project_id
FIREBASE_STORAGE_BUCKET=your_firebase_storage_bucket
FIREBASE_MESSAGING_SENDER_ID=your_firebase_messaging_sender_id
FIREBASE_APP_ID=your_firebase_app_id
GOOGLE_MAPS_API_KEY=your_google_maps_api_key
```

### 3. Update app.config.ts
The app.config.ts has been updated to:
- Read GOOGLE_MAPS_API_KEY from environment variables
- Configure expo-location plugin for location permissions

### 4. Firestore Security Rules
Add to your Firestore rules:
```firestore
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Existing auth rules...
    
    match /trips/{tripId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null && 
                       request.resource.data.driverId == request.auth.uid &&
                       request.resource.data.status == 'active';
      allow update: if request.auth != null && 
                       resource.data.driverId == request.auth.uid &&
                       request.auth.uid == resource.data.driverId;
    }
  }
}
```

## File Structure

```
src/
├── features/
│   └── drivers/
│       ├── screens/
│       │   ├── CreateTripScreen.tsx        (Main form)
│       │   └── CreateTripSuccessScreen.tsx (Success page)
│       ├── services/
│       │   └── trips.service.ts            (Business logic)
│       └── types.ts                        (Trip & location types)
├── services/
│   ├── google-maps/
│   │   ├── config.ts                       (API key config)
│   │   ├── places.service.ts               (Google Places API)
│   │   └── directions.service.ts           (Google Directions API)
│   └── firebase/
│       └── config.ts                       (Firebase setup)
├── shared/
│   └── components/
│       ├── LocationAutocomplete.tsx        (Places autocomplete)
│       ├── DateTimePicker.tsx              (Time selection)
│       └── SeatsInput.tsx                  (Seat selector)
└── hooks/
    └── useLocationPermission.ts            (Location permission hook)
```

## Usage

### Adding Routes to Navigation
Update your navigation stack to include the Create Trip screens:

```typescript
// In your driver navigator or main stack
<Stack.Screen 
  name="CreateTrip" 
  component={CreateTripScreen} 
  options={{ title: "Create Trip" }} 
/>
<Stack.Screen 
  name="CreateTripSuccess" 
  component={CreateTripSuccessScreen} 
  options={{ headerShown: false }} 
/>
```

### From a Button
```typescript
import { CreateTripScreen } from "@/features/drivers/screens/CreateTripScreen";

// In your Driver Home screen
<Button 
  title="Create Trip"
  onPress={() => navigation.navigate("CreateTrip")}
/>
```

## Components Overview

### LocationAutocomplete
- Fetches predictions from Google Places API as user types
- Debounced to prevent excessive API calls
- Shows suggestions in a dropdown
- On selection, fetches full place details including coordinates
- Returns complete `LocationAddress` object

### DateTimePickerInput
- Cross-platform date/time selection
- iOS: Modal with spinner
- Android: System date/time picker
- Validates departure time is in the future
- Minimum: 15 minutes from current time

### SeatsInput
- Increment/decrement buttons for seat count
- Direct text input option
- Validates range: 1-7 seats
- Disabled buttons at min/max values

### CreateTripScreen
- Form with all input fields
- Real-time validation with error display
- Loading state while creating trip
- Auto-redirect to success screen on completion

### CreateTripSuccessScreen
- Confirmation with success icon
- Shows trip ID snippet
- Instructions for next steps
- Auto-redirect to Driver Home after 3 seconds
- Manual "Back to Home" button

## Validation Rules

```
Start Location:
  ✓ Required
  ✓ Must have valid coordinates
  ✓ Must be different from destination

Destination:
  ✓ Required
  ✓ Must have valid coordinates
  ✓ Must be different from start

Departure Time:
  ✓ Required
  ✓ Must be at least 15 minutes in the future
  ✓ Cannot be in the past

Available Seats:
  ✓ Required
  ✓ Integer value
  ✓ Minimum: 1
  ✓ Maximum: 7
```

## Firestore Data Structure

```javascript
// trips collection
{
  driverId: "user-123",
  startLocation: {
    address: "123 Main St, Riyadh",
    coordinate: {
      latitude: 24.7136,
      longitude: 46.6753
    },
    placeId: "ChIJIQBpAG2F1BIRkaHWr8V8SPk"
  },
  destinationLocation: {
    address: "456 King Fahd Rd, Riyadh",
    coordinate: {
      latitude: 24.7589,
      longitude: 46.6753
    },
    placeId: "ChIJIQBpAG2F1BIRkaHWr8V8SPk"
  },
  departureTime: 1623456789000,  // milliseconds
  availableSeats: 3,
  routeCoordinates: [
    { latitude: 24.7136, longitude: 46.6753 },
    { latitude: 24.7200, longitude: 46.6800 },
    // ... more coordinates from route
    { latitude: 24.7589, longitude: 46.6753 }
  ],
  status: "active",
  createdAt: 1623456789000,
  updatedAt: 1623456789000
}
```

## Error Handling

The implementation includes:
- Validation errors shown in form
- API errors caught and displayed to user
- Alert dialogs for critical errors
- Console logging for debugging
- Firestore error handling

Common errors:
- **"Start location is required"** - Select a location from autocomplete
- **"Start and destination cannot be the same"** - Choose different locations
- **"Departure time must be in the future"** - Select a time at least 15 min away
- **Google API errors** - Check API key is correct and has proper permissions

## Testing

### Manual Testing Checklist
- [ ] Form renders with all fields
- [ ] Location autocomplete searches and shows predictions
- [ ] Date/time picker works on iOS and Android
- [ ] Seat selector increments/decrements correctly
- [ ] Validation errors show for invalid input
- [ ] Trip creates successfully with Firestore
- [ ] Route coordinates populated from Directions API
- [ ] Success screen shows trip ID
- [ ] Auto-redirect works after 3 seconds
- [ ] Manual redirect button works

### Firebase Rules Testing
- [ ] Driver can create trip with their own driverId
- [ ] Cannot create trip with someone else's driverId
- [ ] Status must be 'active' on creation
- [ ] All passengers can read trips

## Troubleshooting

### Google Maps API Issues
**"No routes found"**: Locations are too close or unreachable. Try selecting different locations.

**"Places API error"**: Check that Google Places API is enabled in Google Cloud Console.

**"ZERO_RESULTS"**: The autocomplete query didn't match any places. Try different search terms.

### Firestore Issues
**"Permission denied"**: Check Firestore security rules allow creating trips for authenticated users.

**"Document not found"**: Ensure user has a valid profile in the `users` collection.

### Location Autocomplete Issues
**Predictions not showing**: Wait a moment for debounce or check API key permissions.

**Coordinates missing**: Ensure you're selecting from the dropdown (not just typing).

## Performance Optimization

Current optimizations:
- ✓ Debounced place predictions (300ms)
- ✓ Lazy loading of place details on selection
- ✓ Route coordinates cached with trip
- ✓ Minimal re-renders with useCallback

Future optimizations:
- Add image caching for route visualization
- Implement offline support for form
- Add analytics tracking

## Next Steps

1. **Trip Listing**: Display all active trips for drivers
2. **Trip Editing**: Allow drivers to modify or cancel trips
3. **Passenger Booking**: Implement passenger booking flow
4. **Real-time Updates**: Use Firestore listeners for live updates
5. **Notifications**: Add push notifications for bookings