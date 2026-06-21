import { useEffect, useRef, useState, useCallback } from "react";
import { ref, onValue, off, Unsubscribe } from "firebase/database";
import { realtimeDb } from "@/services/firebase/config";
import type { DriverLocation } from "../tracking/types";

interface UsePassengerTrackingOptions {
  onLocationUpdate?: (location: DriverLocation) => void;
  onError?: (error: string) => void;
}

/**
 * Hook to subscribe to driver location updates on passenger side
 * Efficiently listens to Realtime Database for driver location changes
 */
export function usePassengerTracking(
  driverId: string,
  options: UsePassengerTrackingOptions = {}
) {
  const [currentLocation, setCurrentLocation] = useState<DriverLocation | null>(null);
  const [isTracking, setIsTracking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const unsubscribeRef = useRef<Unsubscribe | null>(null);

  // Subscribe to driver location
  const startTracking = useCallback(() => {
    if (!driverId) {
      setError("Driver ID is required");
      return;
    }

    try {
      setError(null);
      const locationRef = ref(realtimeDb, `drivers_location/${driverId}`);

      // Set up listener
      const unsubscribe = onValue(
        locationRef,
        (snapshot) => {
          const data = snapshot.val();
          if (data) {
            const location: DriverLocation = {
              driverId,
              latitude: data.lat,
              longitude: data.lng,
              timestamp: data.timestamp,
              accuracy: data.accuracy,
              speed: data.speed,
              heading: data.heading,
            };
            setCurrentLocation(location);
            options.onLocationUpdate?.(location);
          }
        },
        (error) => {
          const errorMessage = `Tracking error: ${error.message}`;
          setError(errorMessage);
          options.onError?.(errorMessage);
        }
      );

      unsubscribeRef.current = unsubscribe;
      setIsTracking(true);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      setError(errorMessage);
      options.onError?.(errorMessage);
    }
  }, [driverId, options]);

  // Stop tracking
  const stopTracking = useCallback(() => {
    if (unsubscribeRef.current) {
      unsubscribeRef.current();
      unsubscribeRef.current = null;
    }
    setIsTracking(false);
    setCurrentLocation(null);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopTracking();
    };
  }, []);

  return {
    currentLocation,
    isTracking,
    error,
    startTracking,
    stopTracking,
  };
}
