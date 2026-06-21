/**
 * Location tracking types and interfaces
 */

export interface DriverLocation {
  driverId: string;
  latitude: number;
  longitude: number;
  timestamp: number;
  accuracy?: number;
  speed?: number; // meters per second
  heading?: number; // degrees
}

export interface LocationUpdate {
  latitude: number;
  longitude: number;
  timestamp: number;
  accuracy?: number;
  speed?: number;
  heading?: number;
}

export interface TrackingConfig {
  minUpdateInterval?: number; // milliseconds, default 5000 (5 seconds)
  maxUpdateInterval?: number; // milliseconds, default 30000 (30 seconds)
  minDistanceThreshold?: number; // meters, default 10
  enableHighAccuracy?: boolean; // default false
  timeout?: number; // milliseconds, default 5000
  maximumAge?: number; // milliseconds, default 0
}

export interface MarkerAnimationConfig {
  duration?: number; // milliseconds, default 1000
  easing?: "linear" | "ease-in" | "ease-out" | "ease-in-out";
}

export interface PassengerTrackingState {
  driverId: string;
  tripId: string;
  currentLocation?: DriverLocation;
  isTracking: boolean;
  error?: string;
}
