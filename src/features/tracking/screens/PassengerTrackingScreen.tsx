import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  Alert,
} from "react-native";
import { usePassengerTracking } from "@/hooks/usePassengerTracking";
import { DriverTrackingMap } from "../components/DriverTrackingMap";
import { useAuth } from "@/features/auth/context/AuthProvider";

export interface PassengerTrackingScreenProps {
  route: {
    params: {
      driverId: string;
      tripId: string;
      routeCoordinates?: Array<{ latitude: number; longitude: number }>;
    };
  };
  navigation: any;
}

export function PassengerTrackingScreen({
  route,
  navigation,
}: PassengerTrackingScreenProps) {
  const { driverId, tripId, routeCoordinates } = route.params;
  const { user } = useAuth();
  const [showDetails, setShowDetails] = useState(false);
  const [statistics, setStatistics] = useState({
    distance: 0,
    lastUpdateAgo: "--",
  });

  const {
    currentLocation,
    isTracking,
    error,
    startTracking,
    stopTracking,
  } = usePassengerTracking(driverId, {
    onLocationUpdate: (location) => {
      const distance = Math.round(location.speed ? location.speed * 3.6 : 0);
      setStatistics((prev) => ({
        ...prev,
        distance,
      }));
    },
    onError: (error) => {
      Alert.alert("Tracking Error", error);
    },
  });

  // Start tracking on mount
  useEffect(() => {
    startTracking();
    return () => {
      stopTracking();
    };
  }, [startTracking, stopTracking]);

  // Update "last update ago" timer
  useEffect(() => {
    const interval = setInterval(() => {
      if (currentLocation) {
        const ago = Math.round((Date.now() - currentLocation.timestamp) / 1000);
        if (ago < 60) {
          setStatistics((prev) => ({
            ...prev,
            lastUpdateAgo: `${ago}s ago`,
          }));
        } else {
          const minutes = Math.round(ago / 60);
          setStatistics((prev) => ({
            ...prev,
            lastUpdateAgo: `${minutes}m ago`,
          }));
        }
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [currentLocation]);

  const handleCancelBooking = () => {
    Alert.alert("Cancel Booking", "Are you sure you want to cancel this ride?", [
      { text: "No", style: "cancel" },
      {
        text: "Yes, Cancel",
        onPress: () => {
          // TODO: Implement cancellation logic
          navigation.goBack();
        },
        style: "destructive",
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Map View */}
      <View style={styles.mapContainer}>
        <DriverTrackingMap
          driverLocation={currentLocation}
          routeCoordinates={routeCoordinates}
          loading={!isTracking}
          error={error}
        />
      </View>

      {/* Bottom Info Panel */}
      <View style={styles.infoPanel}>
        {/* Status Bar */}
        <View style={styles.statusBar}>
          <View style={styles.statusIndicator} />
          <Text style={styles.statusText}>Driver is on the way</Text>
          <Text style={styles.updateTime}>{statistics.lastUpdateAgo}</Text>
        </View>

        {/* Quick Stats */}
        <View style={styles.quickStats}>
          <View style={styles.statBox}>
            <Text style={styles.statBoxLabel}>Speed</Text>
            <Text style={styles.statBoxValue}>{statistics.distance}</Text>
            <Text style={styles.statBoxUnit}>km/h</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statBoxLabel}>Accuracy</Text>
            <Text style={styles.statBoxValue}>
              {currentLocation?.accuracy
                ? Math.round(currentLocation.accuracy)
                : "--"}
            </Text>
            <Text style={styles.statBoxUnit}>m</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statBoxLabel}>Heading</Text>
            <Text style={styles.statBoxValue}>
              {currentLocation?.heading ? Math.round(currentLocation.heading) : "--"}
            </Text>
            <Text style={styles.statBoxUnit}>°</Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={styles.detailsButton}
            onPress={() => setShowDetails(!showDetails)}
          >
            <Text style={styles.detailsButtonText}>
              {showDetails ? "Hide Details" : "Show Details"}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={handleCancelBooking}
          >
            <Text style={styles.cancelButtonText}>Cancel Ride</Text>
          </TouchableOpacity>
        </View>

        {/* Detailed Info */}
        {showDetails && currentLocation && (
          <View style={styles.detailedInfo}>
            <Text style={styles.detailsTitle}>Location Details</Text>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Latitude:</Text>
              <Text style={styles.detailValue}>
                {currentLocation.latitude.toFixed(6)}
              </Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Longitude:</Text>
              <Text style={styles.detailValue}>
                {currentLocation.longitude.toFixed(6)}
              </Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Timestamp:</Text>
              <Text style={styles.detailValue}>
                {new Date(currentLocation.timestamp).toLocaleTimeString()}
              </Text>
            </View>
            {currentLocation.accuracy && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Accuracy:</Text>
                <Text style={styles.detailValue}>
                  ±{Math.round(currentLocation.accuracy)} meters
                </Text>
              </View>
            )}
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  mapContainer: {
    flex: 1,
  },
  infoPanel: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 10,
  },
  statusBar: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  statusIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#4CAF50",
    marginRight: 8,
  },
  statusText: {
    flex: 1,
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
  },
  updateTime: {
    fontSize: 12,
    color: "#999",
  },
  quickStats: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
    gap: 8,
  },
  statBox: {
    flex: 1,
    backgroundColor: "#f9f9f9",
    borderRadius: 8,
    padding: 12,
    alignItems: "center",
  },
  statBoxLabel: {
    fontSize: 11,
    color: "#999",
    marginBottom: 4,
  },
  statBoxValue: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#007AFF",
  },
  statBoxUnit: {
    fontSize: 10,
    color: "#999",
    marginTop: 2,
  },
  actionButtons: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 12,
  },
  detailsButton: {
    flex: 1,
    backgroundColor: "#007AFF",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  detailsButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  cancelButton: {
    flex: 1,
    backgroundColor: "#f44336",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  cancelButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  detailedInfo: {
    backgroundColor: "#f5f5f5",
    borderRadius: 8,
    padding: 12,
  },
  detailsTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  detailLabel: {
    fontSize: 12,
    color: "#666",
  },
  detailValue: {
    fontSize: 12,
    fontWeight: "500",
    color: "#333",
  },
});
