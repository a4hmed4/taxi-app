import React, { useEffect, useRef, useState } from "react";
import { View, Text, StyleSheet, ActivityIndicator } from "react-native";
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from "react-native-maps";
import type { DriverLocation } from "@/features/tracking/types";

interface DriverMarkerProps {
  location: DriverLocation;
  onMarkerPress?: () => void;
  markerTitle?: string;
  animationDuration?: number; // milliseconds
}

export function DriverMarker({
  location,
  onMarkerPress,
  markerTitle = "Driver",
  animationDuration = 1000,
}: DriverMarkerProps) {
  const [displayLocation, setDisplayLocation] = useState<DriverLocation>(location);
  const animationRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Animate marker smoothly to new location
    if (
      location.latitude !== displayLocation.latitude ||
      location.longitude !== displayLocation.longitude
    ) {
      // Clear previous animation
      if (animationRef.current) {
        clearTimeout(animationRef.current);
      }

      // Animate in steps for smooth movement
      const steps = 10;
      const startLat = displayLocation.latitude;
      const startLng = displayLocation.longitude;
      const endLat = location.latitude;
      const endLng = location.longitude;

      let currentStep = 0;

      const animate = () => {
        currentStep++;
        const progress = currentStep / steps;

        const newLat = startLat + (endLat - startLat) * progress;
        const newLng = startLng + (endLng - startLng) * progress;

        setDisplayLocation({
          ...location,
          latitude: newLat,
          longitude: newLng,
        });

        if (currentStep < steps) {
          animationRef.current = setTimeout(
            animate,
            animationDuration / steps
          );
        } else {
          // Ensure final position is exact
          setDisplayLocation(location);
        }
      };

      animate();
    }

    return () => {
      if (animationRef.current) {
        clearTimeout(animationRef.current);
      }
    };
  }, [location, displayLocation, animationDuration]);

  return (
    <Marker
      coordinate={{
        latitude: displayLocation.latitude,
        longitude: displayLocation.longitude,
      }}
      title={markerTitle}
      description={`Updated: ${new Date(location.timestamp).toLocaleTimeString()}`}
      onPress={onMarkerPress}
      rotation={location.heading || 0}
    />
  );
}

interface DriverTrackingMapProps {
  driverLocation: DriverLocation | null;
  passengerLocation?: {
    latitude: number;
    longitude: number;
  };
  routeCoordinates?: Array<{ latitude: number; longitude: number }>;
  loading?: boolean;
  error?: string;
  onMarkerPress?: () => void;
  zoomLevel?: number;
}

export function DriverTrackingMap({
  driverLocation,
  passengerLocation,
  routeCoordinates,
  loading = false,
  error,
  onMarkerPress,
  zoomLevel = 15,
}: DriverTrackingMapProps) {
  const mapRef = useRef<MapView>(null);
  const [region, setRegion] = useState(
    driverLocation
      ? {
          latitude: driverLocation.latitude,
          longitude: driverLocation.longitude,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        }
      : {
          latitude: 37.78825,
          longitude: -122.4324,
          latitudeDelta: 0.1,
          longitudeDelta: 0.1,
        }
  );

  // Update map region when driver location changes
  useEffect(() => {
    if (driverLocation && mapRef.current) {
      mapRef.current.animateToRegion(
        {
          latitude: driverLocation.latitude,
          longitude: driverLocation.longitude,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        },
        500 // animation duration
      );
    }
  }, [driverLocation]);

  if (error) {
    return (
      <View style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        initialRegion={region}
        onRegionChange={setRegion}
        zoomEnabled
        scrollEnabled
      >
        {/* Driver marker */}
        {driverLocation && (
          <DriverMarker
            location={driverLocation}
            onMarkerPress={onMarkerPress}
            markerTitle="Driver"
          />
        )}

        {/* Passenger location marker */}
        {passengerLocation && (
          <Marker
            coordinate={passengerLocation}
            title="Your Location"
            pinColor="blue"
          />
        )}

        {/* Route polyline */}
        {routeCoordinates && routeCoordinates.length > 1 && (
          <Polyline
            coordinates={routeCoordinates}
            strokeColor="#2196F3"
            strokeWidth={3}
            lineDashPattern={[5, 5]}
          />
        )}
      </MapView>

      {/* Loading indicator */}
      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 16,
  },
  errorText: {
    fontSize: 16,
    color: "#d32f2f",
    textAlign: "center",
  },
  loadingContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.8)",
  },
});
