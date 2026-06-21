import type { LocationCoordinate } from "../types";

/**
 * Haversine formula to calculate distance between two coordinates in meters
 * Reference: https://en.wikipedia.org/wiki/Haversine_formula
 */
export function calculateDistance(
  coord1: LocationCoordinate,
  coord2: LocationCoordinate
): number {
  const R = 6371000; // Earth's radius in meters
  const lat1 = (coord1.latitude * Math.PI) / 180;
  const lat2 = (coord2.latitude * Math.PI) / 180;
  const deltaLat = ((coord2.latitude - coord1.latitude) * Math.PI) / 180;
  const deltaLon = ((coord2.longitude - coord1.longitude) * Math.PI) / 180;

  const a =
    Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
    Math.cos(lat1) *
      Math.cos(lat2) *
      Math.sin(deltaLon / 2) *
      Math.sin(deltaLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Find the minimum distance from a point to a line segment (polyline)
 * Uses the perpendicular distance formula
 */
export function distanceToLineSegment(
  point: LocationCoordinate,
  lineStart: LocationCoordinate,
  lineEnd: LocationCoordinate
): number {
  const lat1 = lineStart.latitude;
  const lon1 = lineStart.longitude;
  const lat2 = lineEnd.latitude;
  const lon2 = lineEnd.longitude;
  const lat3 = point.latitude;
  const lon3 = point.longitude;

  // Convert to radians
  const lat1Rad = (lat1 * Math.PI) / 180;
  const lon1Rad = (lon1 * Math.PI) / 180;
  const lat2Rad = (lat2 * Math.PI) / 180;
  const lon2Rad = (lon2 * Math.PI) / 180;
  const lat3Rad = (lat3 * Math.PI) / 180;
  const lon3Rad = (lon3 * Math.PI) / 180;

  // Angular distance
  const dLat12 = lat2Rad - lat1Rad;
  const dLon12 = lon2Rad - lon1Rad;
  const dLat13 = lat3Rad - lat1Rad;
  const dLon13 = lon3Rad - lon1Rad;

  const a12 = Math.sin(dLat12 / 2) ** 2 + Math.cos(lat1Rad) * Math.cos(lat2Rad) * Math.sin(dLon12 / 2) ** 2;
  const a13 = Math.sin(dLat13 / 2) ** 2 + Math.cos(lat1Rad) * Math.cos(lat3Rad) * Math.sin(dLon13 / 2) ** 2;
  const a23 = Math.sin((lat3Rad - lat2Rad) / 2) ** 2 + Math.cos(lat2Rad) * Math.cos(lat3Rad) * Math.sin((lon3Rad - lon2Rad) / 2) ** 2;

  const c12 = 2 * Math.atan2(Math.sqrt(a12), Math.sqrt(1 - a12));
  const c13 = 2 * Math.atan2(Math.sqrt(a13), Math.sqrt(1 - a13));
  const c23 = 2 * Math.atan2(Math.sqrt(a23), Math.sqrt(1 - a23));

  // Check if point is between line start and end
  if (c13 > c12 || c23 > c12) {
    // Point is beyond one end of the segment
    return Math.min(
      calculateDistance(point, lineStart),
      calculateDistance(point, lineEnd)
    );
  }

  // Perpendicular distance
  const dRad = Math.asin(Math.sin(c13) * Math.sin(dLon13) / Math.sin(c23));
  const R = 6371000; // Earth radius in meters
  return Math.abs(dRad) * R;
}

/**
 * Find minimum distance from a point to a polyline (array of coordinates)
 */
export function distanceToPolyline(
  point: LocationCoordinate,
  polyline: LocationCoordinate[]
): number {
  if (polyline.length < 2) {
    return calculateDistance(point, polyline[0]);
  }

  let minDistance = Infinity;

  for (let i = 0; i < polyline.length - 1; i++) {
    const distance = distanceToLineSegment(point, polyline[i], polyline[i + 1]);
    if (distance < minDistance) {
      minDistance = distance;
    }
  }

  return minDistance;
}

/**
 * Calculate the bearing (direction) between two coordinates
 * Returns angle in degrees (0-360)
 */
export function calculateBearing(
  from: LocationCoordinate,
  to: LocationCoordinate
): number {
  const lat1 = (from.latitude * Math.PI) / 180;
  const lat2 = (to.latitude * Math.PI) / 180;
  const dLon = ((to.longitude - from.longitude) * Math.PI) / 180;

  const y = Math.sin(dLon) * Math.cos(lat2);
  const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);

  const bearing = (Math.atan2(y, x) * 180) / Math.PI;
  return (bearing + 360) % 360;
}

/**
 * Check if two bearings are in the same direction (within tolerance)
 */
export function isSameDirection(
  bearing1: number,
  bearing2: number,
  tolerance: number = 45
): boolean {
  const diff = Math.abs(bearing1 - bearing2);
  // Handle wrap-around at 360 degrees
  const normalizedDiff = diff > 180 ? 360 - diff : diff;
  return normalizedDiff <= tolerance;
}
