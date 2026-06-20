# Smart Carpooling App

Route-based carpooling mobile app built with Expo, Firebase, and Google Maps.

## Architecture

The codebase uses a feature-first structure with shared platform services:

- `src/app` for app bootstrap and providers
- `src/navigation` for stack and role-based routing
- `src/features/auth` for sign-in, role selection, and profile setup
- `src/features/trips` for trip publishing, discovery, and booking
- `src/features/tracking` for live driver location and trip progress
- `src/services` for Firebase and external integrations
- `src/shared` for reusable UI, hooks, types, and utilities

## Planned build phases

1. Auth and role onboarding
2. Driver trip publishing
3. Passenger trip discovery and joining
4. Real-time trip tracking
5. Cloud Functions and security rules

## Firebase surfaces

- Auth for account access
- Firestore for trips, profiles, bookings, and trip state
- Realtime Database for high-frequency live location updates
- Cloud Functions for matching, notifications, and moderation workflows

