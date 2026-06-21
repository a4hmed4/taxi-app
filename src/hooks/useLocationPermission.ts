import { useEffect, useState } from "react";
import * as Location from "expo-location";

export function useLocationPermission() {
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    requestLocationPermission();
  }, []);

  const requestLocationPermission = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      setPermissionGranted(status === "granted");
    } catch (error) {
      console.error("Error requesting location permission:", error);
      setPermissionGranted(false);
    } finally {
      setLoading(false);
    }
  };

  return { permissionGranted, loading, requestLocationPermission };
}