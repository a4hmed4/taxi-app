import { GOOGLE_MAPS_API_KEY } from "./config";
import type { LocationCoordinate, LocationAddress } from "@/features/drivers/types";

export interface DirectionsResult {
  routeCoordinates: LocationCoordinate[];
  distance: number;
  duration: number;
}

/**
 * Fetch route coordinates and metrics from Google Directions API
 */
export async function getDirections(
  start: LocationAddress,
  destination: LocationAddress
): Promise<DirectionsResult> {
  if (!GOOGLE_MAPS_API_KEY) {
    throw new Error("Google Maps API key is not configured");
  }

  const url = new URL(
    "https://maps.googleapis.com/maps/api/directions/json"
  );
  url.searchParams.append("key", GOOGLE_MAPS_API_KEY);
  url.searchParams.append(
    "origin",
    `${start.coordinate.latitude},${start.coordinate.longitude}`
  );
  url.searchParams.append(
    "destination",
    `${destination.coordinate.latitude},${destination.coordinate.longitude}`
  );

  try {
    const response = await fetch(url.toString());

    if (!response.ok) {
      throw new Error(`Google Directions API error: ${response.status}`);
    }

    const data = await response.json();

    if (data.status !== "OK") {
      throw new Error(`Directions API returned status: ${data.status}`);
    }

    if (!data.routes || data.routes.length === 0) {
      throw new Error("No routes found for the given locations");
    }

    const route = data.routes[0];
    const leg = route.legs[0];

    // Decode polyline to get route coordinates
    const routeCoordinates = decodePolyline(route.overview_polyline.points);

    return {
      routeCoordinates,
      distance: leg.distance?.value ?? 0, // in meters
      duration: leg.duration?.value ?? 0, // in seconds
    };
  } catch (error) {
    console.error("Error fetching directions:", error);
    throw error;
  }
}

/**
 * Decode polyline encoded string to array of coordinates
 * Reference: https://developers.google.com/maps/documentation/utilities/polylinealgorithm
 */
function decodePolyline(encoded: string): LocationCoordinate[] {
  const inv = 1.0 / 1e5;
  const decoded: LocationCoordinate[] = [];
  let previous = [0, 0];

  for (let i = 0; i < encoded.length; ) {
    const ll: [number, number] = [0, 0];

    for (let j = 0; j < 2; j++) {
      let shift = 0;
      let result = 0;

      let byte = 0;
      do {
        byte = encoded.charCodeAt(i++) - 63;
        result |= (byte & 0x1f) << shift;
        shift += 5;
      } while (byte >= 0x20);

      ll[j] = previous[j] + (result & 1 ? ~(result >> 1) : result >> 1);
      previous[j] = ll[j];
    }

    decoded.push({
      latitude: ll[0] * inv,
      longitude: ll[1] * inv,
    });
  }

  return decoded;
}