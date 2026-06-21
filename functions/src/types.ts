/**
 * Shared types for Firebase Cloud Functions
 */

export interface LocationCoordinate {
  latitude: number;
  longitude: number;
}

export interface LocationAddress {
  address: string;
  coordinate: LocationCoordinate;
  placeId: string;
}

export interface Trip {
  id: string;
  driverId: string;
  startLocation: LocationAddress;
  destinationLocation: LocationAddress;
  departureTime: number;
  availableSeats: number;
  routeCoordinates: LocationCoordinate[];
  status: "active" | "completed" | "cancelled";
  createdAt: number;
  updatedAt: number;
}

export interface MatchingTrip {
  tripId: string;
  driverId: string;
  score: number;
  pickupDistance: number; // meters
  dropoffDistance: number; // meters
  routeDeviation: number; // meters
  pickupLocation: LocationAddress;
  dropoffLocation: LocationAddress;
  departureTime: number;
  availableSeats: number;
  estimatedPickupTime: string; // ISO string
  driverName?: string;
  driverRating?: number;
  seatsBooked?: number;
}

export interface MatchingRequest {
  pickupLocation: LocationAddress;
  dropoffLocation: LocationAddress;
  passengerId: string;
}

export interface MatchingResponse {
  matches: MatchingTrip[];
  count: number;
  timestamp: number;
}
