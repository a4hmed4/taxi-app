import type { LatLng } from "@/shared/types/location";
import { haversineDistanceMeters, polylineWithinRadius } from "@/shared/utils/geo";
import type { Trip } from "../types";

type MatchCriteria = {
  origin: LatLng;
  destination: LatLng;
  routeRadiusMeters?: number;
  directionToleranceMeters?: number;
};

export function findCompatibleTrips(trips: Trip[], criteria: MatchCriteria) {
  const routeRadiusMeters = criteria.routeRadiusMeters ?? 700;
  const directionToleranceMeters = criteria.directionToleranceMeters ?? 3_000;

  return trips
    .filter((trip) => {
      const routeMatches = polylineWithinRadius(trip.route, criteria.origin, routeRadiusMeters);
      const destinationMatches = polylineWithinRadius(trip.route, criteria.destination, routeRadiusMeters);
      const startsNearTrip = haversineDistanceMeters(trip.origin, criteria.origin) <= directionToleranceMeters;
      const endsNearTrip = haversineDistanceMeters(trip.destination, criteria.destination) <= directionToleranceMeters;

      return routeMatches && destinationMatches && startsNearTrip && endsNearTrip;
    })
    .sort((left, right) => left.departureTime - right.departureTime);
}
