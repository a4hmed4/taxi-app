import Constants from "expo-constants";

const extra = Constants.expoConfig?.extra as
  | {
      googleMapsApiKey?: string;
    }
  | undefined;

export const GOOGLE_MAPS_API_KEY = extra?.googleMapsApiKey ?? "";

if (!GOOGLE_MAPS_API_KEY) {
  console.warn("Google Maps API key is not configured");
}