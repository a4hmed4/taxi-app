import type { LocationAddress, LocationCoordinate, Trip, MatchingTrip } from "../types";
import { calculateDistance, distanceToPolyline, calculateBearing, isSameDirection } from "./distance";

export interface MatchingConfig {
  maxPickupDistance?: number; // meters, default 500
  maxDropoffDistance?: number; // meters, default 500
  maxRouteDeviation?: number; // meters, default 1000
  directionTolerance?: number; // degrees, default 45
  minAvailableSeats?: number; // default 1
  futureWindow?: number; // minutes, default 120
}

const DEFAULT_CONFIG: MatchingConfig = {
  maxPickupDistance: 500,
  maxDropoffDistance: 500,
  maxRouteDeviation: 1000,
  directionTolerance: 45,
  minAvailableSeats: 1,
  futureWindow: 120,
};

/**
 * Calculate matching score for a trip
 * Lower score = better match
 * Score = pickupDistance + dropoffDistance + routeDeviation
 */
export function calculateMatchScore(
  pickup: LocationCoordinate,
  dropoff: LocationCoordinate,
  trip: Trip
): {
  score: number | null;
  pickupDistance: number;
  dropoffDistance: number;
  routeDeviation: number;
} {
  const pickupDistance = distanceToPolyline(pickup, trip.routeCoordinates);
  const dropoffDistance = distanceToPolyline(dropoff, trip.routeCoordinates);
  const routeDeviation = Math.max(pickupDistance, dropoffDistance);

  // Score is the sum of distances, normalized
  // Weight: pickup and dropoff distances are more important
  const score = pickupDistance * 1.0 + dropoffDistance * 1.0 + routeDeviation * 0.5;

  return {
    score,
    pickupDistance,
    dropoffDistance,
    routeDeviation,
  };
}

/**
 * Check if a trip matches the passenger's criteria
 */
export function isTripMatch(
  pickup: LocationAddress,
  dropoff: LocationAddress,
  trip: Trip,
  config: MatchingConfig = DEFAULT_CONFIG
): boolean {
  // Check available seats
  if (trip.availableSeats < (config.minAvailableSeats || 1)) {
    return false;
  }

  // Check departure time (within future window)
  const now = Date.now();
  const futureWindowMs = (config.futureWindow || 120) * 60 * 1000;
  if (trip.departureTime < now || trip.departureTime > now + futureWindowMs) {
    return false;
  }

  // Calculate distances
  const { pickupDistance, dropoffDistance, routeDeviation } = calculateMatchScore(
    pickup.coordinate,
    dropoff.coordinate,
    trip
  );

  // Check distance constraints
  if (pickupDistance > (config.maxPickupDistance || 500)) {
    return false;
  }
  if (dropoffDistance > (config.maxDropoffDistance || 500)) {
    return false;
  }
  if (routeDeviation > (config.maxRouteDeviation || 1000)) {
    return false;
  }

  // Check direction (roughly same direction)
  const tripBearing = calculateBearing(trip.startLocation.coordinate, trip.destinationLocation.coordinate);
  const passengerBearing = calculateBearing(pickup.coordinate, dropoff.coordinate);
  
  if (!isSameDirection(tripBearing, passengerBearing, config.directionTolerance || 45)) {
    return false;
  }

  return true;
}

/**
 * Filter trips that match the passenger's criteria
 */
export function filterMatchingTrips(
  trips: Trip[],
  pickup: LocationAddress,
  dropoff: LocationAddress,
  config: MatchingConfig = DEFAULT_CONFIG
): Trip[] {
  return trips.filter((trip) => isTripMatch(pickup, dropoff, trip, config));
}

/**
 * Rank matching trips by score and return formatted results
 */
export function rankAndFormatTrips(
  trips: Trip[],
  pickup: LocationAddress,
  dropoff: LocationAddress,
  driverData?: Map<string, any>,
  limit: number = 20
): MatchingTrip[] {
  const ranked = trips
    .map((trip) => {
      const { score, pickupDistance, dropoffDistance, routeDeviation } = calculateMatchScore(
        pickup.coordinate,
        dropoff.coordinate,
        trip
      );

      const driver = driverData?.get(trip.driverId);

      return {
        tripId: trip.id,
        driverId: trip.driverId,
        score: score!,
        pickupDistance,
        dropoffDistance,
        routeDeviation,
        pickupLocation: trip.startLocation,
        dropoffLocation: trip.destinationLocation,
        departureTime: trip.departureTime,
        availableSeats: trip.availableSeats,
        estimatedPickupTime: new Date(trip.departureTime).toISOString(),
        driverName: driver?.fullName,
        driverRating: driver?.rating,
        seatsBooked: driver?.seatsBooked || 0,
      } as MatchingTrip;
    })
    .sort((a, b) => a.score - b.score)
    .slice(0, limit);

  return ranked;
}
