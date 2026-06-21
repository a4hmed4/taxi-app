import { GOOGLE_MAPS_API_KEY } from "./config";
import type { LocationAddress, LocationCoordinate } from "@/features/drivers/types";

export interface PlacesPrediction {
  placeId: string;
  mainText: string;
  secondaryText: string;
  fullText: string;
}

export interface PlaceDetails {
  address: string;
  coordinate: LocationCoordinate;
  placeId: string;
}

/**
 * Get place predictions from Google Places Autocomplete API
 */
export async function getPlacePredictions(
  input: string
): Promise<PlacesPrediction[]> {
  if (!GOOGLE_MAPS_API_KEY) {
    throw new Error("Google Maps API key is not configured");
  }

  if (!input.trim()) {
    return [];
  }

  const url = new URL(
    "https://maps.googleapis.com/maps/api/place/autocomplete/json"
  );
  url.searchParams.append("key", GOOGLE_MAPS_API_KEY);
  url.searchParams.append("input", input);
  // Optional: Restrict to specific countries
  // url.searchParams.append("components", "country:sa"); // For Saudi Arabia

  try {
    const response = await fetch(url.toString());

    if (!response.ok) {
      throw new Error(`Places API error: ${response.status}`);
    }

    const data = await response.json();

    if (data.status !== "OK" && data.status !== "ZERO_RESULTS") {
      throw new Error(`Places API returned status: ${data.status}`);
    }

    return (data.predictions || []).map((prediction: any) => ({
      placeId: prediction.place_id,
      mainText: prediction.structured_formatting?.main_text ?? "",
      secondaryText: prediction.structured_formatting?.secondary_text ?? "",
      fullText: prediction.description,
    }));
  } catch (error) {
    console.error("Error fetching place predictions:", error);
    throw error;
  }
}

/**
 * Get place details including coordinates from Google Places API
 */
export async function getPlaceDetails(
  placeId: string
): Promise<PlaceDetails> {
  if (!GOOGLE_MAPS_API_KEY) {
    throw new Error("Google Maps API key is not configured");
  }

  const url = new URL(
    "https://maps.googleapis.com/maps/api/place/details/json"
  );
  url.searchParams.append("key", GOOGLE_MAPS_API_KEY);
  url.searchParams.append("place_id", placeId);
  url.searchParams.append("fields", "formatted_address,geometry");

  try {
    const response = await fetch(url.toString());

    if (!response.ok) {
      throw new Error(`Places Details API error: ${response.status}`);
    }

    const data = await response.json();

    if (data.status !== "OK") {
      throw new Error(`Places Details API returned status: ${data.status}`);
    }

    const result = data.result;
    const location = result.geometry?.location;

    if (!location) {
      throw new Error("Could not retrieve coordinates for this place");
    }

    return {
      address: result.formatted_address,
      coordinate: {
        latitude: location.lat,
        longitude: location.lng,
      },
      placeId,
    };
  } catch (error) {
    console.error("Error fetching place details:", error);
    throw error;
  }
}