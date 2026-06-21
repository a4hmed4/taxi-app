import { useEffect, useRef, useState, useCallback } from "react";
import * as Location from "expo-location";
import { ref, set, remove } from "firebase/database";
import { realtimeDb } from "@/services/firebase/config";

interface TrackingConfig {
  minUpdateInterval?: number; // milliseconds, default 5000
  maxUpdateInterval?: number; // milliseconds, default 30000
  minDistanceThreshold?: number; // meters, default 10
  enableHighAccuracy?: boolean; // default false
  timeout?: number; // milliseconds, default 5000
  maximumAge?: number; // milliseconds, default 0
}

interface LocationData {
  latitude: number;
  longitude: number;
  timestamp: number;
  accuracy?: number;
  speed?: number;
  heading?: number;
}

const DEFAULT_CONFIG: TrackingConfig = {
  minUpdateInterval: 5000,
  maxUpdateInterval: 30000,
  minDistanceThreshold: 10,
  enableHighAccuracy: false,
  timeout: 5000,
  maximumAge: 0,
};

/**
 * Calculate distance between two coordinates using Haversine formula (in meters)
 */
function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371000; // Earth's radius in meters
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Hook for driver location tracking with battery optimization
 * Usage:
 * const { startTracking, stopTracking, isTracking, error } = useDriverTracking('driverId123');
 */
export function useDriverTracking(driverId: string, config: TrackingConfig = {}) {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };
  const [isTracking, setIsTracking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastLocation, setLastLocation] = useState<LocationData | null>(null);

  const locationSubscriptionRef = useRef<Location.LocationSubscription | null>(null);
  const lastUpdateTimeRef = useRef<number>(0);
  const lastCoordinatesRef = useRef<{ lat: number; lon: number } | null>(null);
  const maxIntervalTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Request location permissions
  const requestPermissions = useCallback(async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setError("Location permission denied");
        return false;
      }
      return true;
    } catch (err) {
      setError(`Permission error: ${err instanceof Error ? err.message : "Unknown error"}`);
      return false;
    }
  }, []);

  // Upload location to Realtime Database
  const uploadLocation = useCallback(
    async (location: LocationData) => {
      try {
        const locationRef = ref(realtimeDb, `drivers_location/${driverId}`);
        await set(locationRef, {
          lat: location.latitude,
          lng: location.longitude,
          timestamp: location.timestamp,
          accuracy: location.accuracy,
          speed: location.speed,
          heading: location.heading,
        });
        setLastLocation(location);
      } catch (err) {
        console.error("Error uploading location:", err);
      }
    },
    [driverId]
  );

  // Check if location update should be sent
  const shouldUpdateLocation = useCallback(
    (newLocation: LocationData): boolean => {
      const now = Date.now();

      // Always update if minimum interval has passed (forced update)
      if (now - lastUpdateTimeRef.current > (finalConfig.maxUpdateInterval || 30000)) {
        return true;
      }

      // Don't update if minimum interval hasn't passed yet
      if (now - lastUpdateTimeRef.current < (finalConfig.minUpdateInterval || 5000)) {
        return false;
      }

      // Check if distance threshold exceeded
      if (lastCoordinatesRef.current) {
        const distance = calculateDistance(
          lastCoordinatesRef.current.lat,
          lastCoordinatesRef.current.lon,
          newLocation.latitude,
          newLocation.longitude
        );

        if (distance < (finalConfig.minDistanceThreshold || 10)) {
          return false;
        }
      }

      return true;
    },
    [finalConfig]
  );

  // Start tracking driver location
  const startTracking = useCallback(async () => {
    try {
      setError(null);

      // Request permissions
      const permissionGranted = await requestPermissions();
      if (!permissionGranted) {
        return;
      }

      // Get initial location
      const initialLocation = await Location.getCurrentPositionAsync({
        accuracy: finalConfig.enableHighAccuracy
          ? Location.Accuracy.Highest
          : Location.Accuracy.BestForNavigation,
        timeInterval: finalConfig.minUpdateInterval || 5000,
        distanceInterval: 0, // We handle distance filtering in shouldUpdateLocation
      });

      const initialData: LocationData = {
        latitude: initialLocation.coords.latitude,
        longitude: initialLocation.coords.longitude,
        timestamp: Date.now(),
        accuracy: initialLocation.coords.accuracy ?? undefined,
        speed: initialLocation.coords.speed ?? undefined,
        heading: initialLocation.coords.heading ?? undefined,
      };

      // Upload initial location
      await uploadLocation(initialData);
      lastUpdateTimeRef.current = Date.now();
      lastCoordinatesRef.current = {
        lat: initialData.latitude,
        lon: initialData.longitude,
      };

      // Subscribe to location updates
      const subscription = await Location.watchPositionAsync(
        {
          accuracy: finalConfig.enableHighAccuracy
            ? Location.Accuracy.Highest
            : Location.Accuracy.BestForNavigation,
          timeInterval: finalConfig.minUpdateInterval || 5000,
          distanceInterval: 0,
        },
        async (location) => {
          const newLocation: LocationData = {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            timestamp: Date.now(),
            accuracy: location.coords.accuracy ?? undefined,
            speed: location.coords.speed ?? undefined,
            heading: location.coords.heading ?? undefined,
          };

          // Check if update should be sent
          if (shouldUpdateLocation(newLocation)) {
            await uploadLocation(newLocation);
            lastUpdateTimeRef.current = Date.now();
            lastCoordinatesRef.current = {
              lat: newLocation.latitude,
              lon: newLocation.longitude,
            };
          }
        }
      );

      locationSubscriptionRef.current = subscription;
      setIsTracking(true);

      // Set up maximum interval timer to force updates
      if (maxIntervalTimerRef.current) {
        clearInterval(maxIntervalTimerRef.current);
      }
      maxIntervalTimerRef.current = setInterval(async () => {
        if (lastCoordinatesRef.current) {
          try {
            const currentLocation = await Location.getCurrentPositionAsync({
              accuracy: finalConfig.enableHighAccuracy
                ? Location.Accuracy.Highest
                : Location.Accuracy.BestForNavigation,
            });

            const forceUpdate: LocationData = {
              latitude: currentLocation.coords.latitude,
              longitude: currentLocation.coords.longitude,
              timestamp: Date.now(),
              accuracy: currentLocation.coords.accuracy ?? undefined,
              speed: currentLocation.coords.speed ?? undefined,
              heading: currentLocation.coords.heading ?? undefined,
            };

            if (shouldUpdateLocation(forceUpdate)) {
              await uploadLocation(forceUpdate);
              lastUpdateTimeRef.current = Date.now();
              lastCoordinatesRef.current = {
                lat: forceUpdate.latitude,
                lon: forceUpdate.longitude,
              };
            }
          } catch (err) {
            console.error("Error in forced location update:", err);
          }
        }
      }, finalConfig.maxUpdateInterval || 30000);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      setError(errorMessage);
      setIsTracking(false);
    }
  }, [requestPermissions, uploadLocation, shouldUpdateLocation, finalConfig]);

  // Stop tracking and remove from database
  const stopTracking = useCallback(async () => {
    try {
      // Remove location from database
      const locationRef = ref(realtimeDb, `drivers_location/${driverId}`);
      await remove(locationRef);

      // Unsubscribe from location updates
      if (locationSubscriptionRef.current) {
        locationSubscriptionRef.current.remove();
        locationSubscriptionRef.current = null;
      }

      // Clear timers
      if (maxIntervalTimerRef.current) {
        clearInterval(maxIntervalTimerRef.current);
        maxIntervalTimerRef.current = null;
      }

      setIsTracking(false);
    } catch (err) {
      console.error("Error stopping tracking:", err);
    }
  }, [driverId]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (isTracking) {
        stopTracking();
      }
    };
  }, []);

  return {
    startTracking,
    stopTracking,
    isTracking,
    error,
    lastLocation,
  };
}
