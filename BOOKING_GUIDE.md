# Trip Booking System - Implementation Guide

## Overview

Complete React Native + Firebase trip booking system with real-time notifications, transactional consistency, and optimized mobile UI.

## Architecture

### Firestore Collections Structure

```
trips/
  {tripId}/
    driverId: string
    startLocation: LocationAddress
    destinationLocation: LocationAddress
    departureTime: number
    availableSeats: number
    seatsBooked: number (incremented on each booking)
    status: "active" | "completed" | "cancelled"
    createdAt: timestamp
    updatedAt: timestamp

bookings/
  {bookingId}/
    tripId: string
    passengerId: string
    passengerName: string
    passengerPhone: string
    status: "pending" | "confirmed" | "completed" | "cancelled"
    seatsBooked: number
    createdAt: timestamp
    updatedAt: timestamp
    cancelledAt?: timestamp
    completedAt?: timestamp

notifications/
  {notificationId}/
    driverId: string
    bookingId: string
    tripId: string
    type: "booking" | "booking_confirmed" | "booking_cancelled"
    title: string
    body: string
    read: boolean
    createdAt: timestamp
```

## File Structure

```
src/
├── features/
│   └── trips/
│       ├── types.ts                              (Booking type definitions)
│       ├── services/
│       │   └── bookings.service.ts               (Booking business logic)
│       └── screens/
│           ├── TripDetailsScreen.tsx             (Booking form)
│           └── BookingConfirmationScreen.tsx     (Confirmation screen)
└── functions/
    └── src/
        └── services/
            ├── bookingNotifications.ts           (FCM notifications)
            └── cancellationNotifications.ts      (Cancellation notifications)
```

## Booking Flow

### 1. Passenger Views Trip
```
Passenger -> Trip List -> Click Trip
```

### 2. Trip Details & Booking
```
TripDetailsScreen
├── Display route
├── Show availability
├── Select seats
└── Click "Book Seats"
```

### 3. Booking Creation (Transactional)
```
CreateBooking (Transaction):
├── Get trip document
├── Check status == "active"
├── Check availableSeats > seatsBooked
├── Create booking document
├── Update trip (increment seatsBooked)
└── Return bookingId
```

### 4. Notifications Triggered
```
Cloud Functions (Firestore Triggers):
├── New Booking -> notifyDriverOnBooking()
│   └── Send FCM to driver: "New booking!"
│       └── Store notification record
│
└── Booking Cancelled -> notifyDriverOnCancellation()
    └── Send FCM to driver: "Booking cancelled"
        └── Update trip (decrement seatsBooked)
```

### 5. Booking Confirmation
```
BookingConfirmationScreen
├── Show booking details
├── Display status
├── Show important notes
└── Offer cancel option
```

## Service Layer

### `bookings.service.ts`

#### `createBooking(request, passengerName, passengerPhone)`
Creates a new booking with transactional integrity.

**Transaction Logic:**
1. Get trip document
2. Verify trip is active
3. Check seat availability
4. Check for duplicate bookings
5. Create booking document
6. Update trip seats count

**Parameters:**
```typescript
request: {
  tripId: string
  passengerId: string
  seatsBooked: number
}
```

**Returns:**
```typescript
{
  success: boolean
  bookingId?: string
  availableSeats?: number
  message: string
}
```

#### `cancelBooking(bookingId)`
Cancels a booking and frees up seats.

**Transaction Logic:**
1. Get booking document
2. Verify booking is pending/confirmed
3. Update booking status to cancelled
4. Decrement trip's seatsBooked
5. Update timestamps

#### `getPassengerBookings(passengerId)`
Fetches all bookings for a passenger.

#### `getTripBookings(tripId)`
Fetches all bookings for a trip.

## Cloud Functions

### `notifyDriverOnBooking`

**Trigger:** `onDocumentCreated("bookings/{bookingId}")`

**Flow:**
```
New Booking Created
├── Fetch trip details
├── Get driver ID
├── Fetch driver FCM token
├── Send FCM notification
│   ├── Title: "New Booking!"
│   ├── Body: "[PassengerName] booked [seatsBooked] seat(s)"
│   └── Data: { bookingId, tripId, passengerId, seatsBooked, type }
└── Store notification record
```

### `notifyDriverOnCancellation`

**Trigger:** `onDocumentDeleted("bookings/{bookingId}")`

**Flow:**
```
Booking Cancelled
├── Fetch booking details
├── Get trip and driver ID
├── Fetch driver FCM token
├── Send FCM notification
│   ├── Title: "Booking Cancelled"
│   ├── Body: "[PassengerName] cancelled [seatsBooked] seat(s)"
│   └── Data: { bookingId, tripId, type }
└── Store notification record
```

## UI Components

### TripDetailsScreen

Displays trip details and booking interface.

**Features:**
- Route display (From → To)
- Departure time countdown
- Seat availability bar chart
- Seat selector (−/+)
- Price calculation
- Trip details expandable section
- "Book Seats" button
- Error handling

**Props:**
```typescript
{
  trip: Trip & { driverId: string }
  onBookingSuccess?: (bookingId: string) => void
  navigation?: any
}
```

**State Management:**
```typescript
seatsToBook: number        // 1-7
isBooking: boolean         // Loading state
expandedDescription: boolean
```

### BookingConfirmationScreen

Displays booking confirmation with details.

**Features:**
- Status icon (✓/⏳/✕)
- Booking details card
- Important notes section
- Back to home button
- Cancel booking button
- Responsive loading states

**Navigation Params:**
```typescript
{
  bookingId: string
  tripId: string
}
```

## Database Security Rules

### Firestore Rules

```firestore
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Bookings collection
    match /bookings/{bookingId} {
      // Passengers can read their own bookings
      allow read: if request.auth != null && 
                     resource.data.passengerId == request.auth.uid;
      
      // Only authenticated users can create
      allow create: if request.auth != null;
      
      // Passengers can update/delete their own bookings
      allow update, delete: if request.auth != null && 
                              resource.data.passengerId == request.auth.uid &&
                              resource.data.status in ['pending', 'confirmed'];
    }
    
    // Trips collection
    match /trips/{tripId} {
      // Anyone can read active trips
      allow read: if resource.data.status == 'active';
    }
  }
}
```

## Firebase Configuration

### Enable Services
1. Firestore Database (multi-document transactions)
2. Realtime Database (optional, for driver tracking)
3. Cloud Messaging (FCM for notifications)
4. Cloud Functions (background notifications)

### Deploy Cloud Functions

```bash
cd functions
npm run build
firebase deploy --only functions
```

## Usage Examples

### Book a Trip

```typescript
import { createBooking } from '@/features/trips/services/bookings.service';

const response = await createBooking(
  {
    tripId: 'trip123',
    passengerId: 'passenger456',
    seatsBooked: 2
  },
  'John Doe',
  '+966501234567'
);

if (response.success) {
  console.log('Booking ID:', response.bookingId);
  console.log('Available seats remaining:', response.availableSeats);
}
```

### Cancel Booking

```typescript
import { cancelBooking } from '@/features/trips/services/bookings.service';

const response = await cancelBooking('booking123');
if (response.success) {
  console.log('Booking cancelled');
}
```

### Get Passenger Bookings

```typescript
import { getPassengerBookings } from '@/features/trips/services/bookings.service';

const bookings = await getPassengerBookings('passenger456');
bookings.forEach(booking => {
  console.log(`Trip ${booking.tripId}: ${booking.status}`);
});
```

### Navigate to Booking

```typescript
navigation.navigate('BookingConfirmation', {
  bookingId: 'booking123',
  tripId: 'trip123'
});
```

## Error Handling

### Common Errors

1. **Trip not found**
   - Message: "Trip not found"
   - Action: Show error alert

2. **Insufficient seats**
   - Message: "Not enough seats available. Only X seat(s) left."
   - Action: Update seat selector max value

3. **Already booked**
   - Message: "You have already booked this trip"
   - Action: Show existing booking option

4. **Trip inactive**
   - Message: "Trip is no longer available"
   - Action: Redirect to trip list

## Transaction Guarantees

✅ **ACID Compliance:**
- **Atomicity**: All operations succeed or all fail
- **Consistency**: Trip seats always match bookings
- **Isolation**: Concurrent bookings handled safely
- **Durability**: Data persists after transaction

## Performance Optimization

1. **Transactional Writes**: Atomic seat updates
2. **Indexed Queries**: `tripId`, `passengerId`, `status`
3. **Cloud Function Triggers**: Async notifications
4. **Pagination**: Load bookings in batches
5. **Caching**: Recent bookings in device storage

## Testing Checklist

- [ ] Book 1 seat successfully
- [ ] Book multiple seats
- [ ] Insufficient seats error
- [ ] Double booking prevention
- [ ] Cancel booking
- [ ] Receive FCM notification on driver device
- [ ] Seats freed after cancellation
- [ ] Status transitions work correctly
- [ ] Transaction rollback on error
- [ ] Data consistency across devices

## Future Enhancements

1. **Payment Integration**
   - Stripe/Apple Pay integration
   - Payment verification
   - Refund handling

2. **Automatic Confirmation**
   - Auto-confirm after X seconds
   - Configurable per driver

3. **Waitlist System**
   - Auto-book if seats available
   - Notification on availability

4. **Rating & Reviews**
   - Post-trip ratings
   - Driver/passenger reviews

5. **Advanced Matching**
   - Schedule preferences
   - Route preferences
   - Rating thresholds

## Support

For issues or questions, check the comprehensive guide in `/BOOKING_GUIDE.md` or consult the function documentation.
