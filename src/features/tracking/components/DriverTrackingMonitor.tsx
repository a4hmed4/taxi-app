import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Alert } from "react-native";
import { useAuth } from "@/features/auth/context/AuthProvider";
import { useDriverTracking } from "@/hooks/useDriverTracking";
import type { TrackingConfig } from "../types";

export interface DriverTrackingMonitorProps {
  config?: TrackingConfig;
  onTrackingStateChange?: (isTracking: boolean) => void;
  onError?: (error: string) => void;
}

export function DriverTrackingMonitor({
  config,
  onTrackingStateChange,
  onError,
}: DriverTrackingMonitorProps) {
  const { user } = useAuth();
  const [statistics, setStatistics] = useState({
    updatesCount: 0,
    lastUpdateTime: "N/A",
    distance: 0,
  });

  const { startTracking, stopTracking, isTracking, error, lastLocation } =
    useDriverTracking(user?.uid || "", config);

  useEffect(() => {
    onTrackingStateChange?.(isTracking);
  }, [isTracking, onTrackingStateChange]);

  useEffect(() => {
    if (error) {
      onError?.(error);
      Alert.alert("Tracking Error", error);
    }
  }, [error, onError]);

  useEffect(() => {
    if (lastLocation) {
      setStatistics((prev) => ({
        ...prev,
        updatesCount: prev.updatesCount + 1,
        lastUpdateTime: new Date(lastLocation.timestamp).toLocaleTimeString(),
        distance: lastLocation.speed ? Math.round(lastLocation.speed * 3.6) : 0, // Convert m/s to km/h
      }));
    }
  }, [lastLocation]);

  const toggleTracking = () => {
    if (isTracking) {
      stopTracking();
    } else {
      startTracking();
    }
  };

  if (!user) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>User not authenticated</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Status */}
      <View style={styles.statusSection}>
        <View
          style={[
            styles.statusIndicator,
            isTracking ? styles.statusActive : styles.statusInactive,
          ]}
        />
        <Text style={styles.statusText}>
          {isTracking ? "Tracking Active" : "Tracking Inactive"}
        </Text>
      </View>

      {/* Statistics */}
      <View style={styles.statisticsSection}>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Updates Sent</Text>
          <Text style={styles.statValue}>{statistics.updatesCount}</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Last Update</Text>
          <Text style={styles.statValue}>{statistics.lastUpdateTime}</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Speed</Text>
          <Text style={styles.statValue}>{statistics.distance} km/h</Text>
        </View>
      </View>

      {/* Error message */}
      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {/* Toggle button */}
      <TouchableOpacity
        style={[
          styles.toggleButton,
          isTracking ? styles.toggleButtonActive : styles.toggleButtonInactive,
        ]}
        onPress={toggleTracking}
      >
        <Text style={styles.toggleButtonText}>
          {isTracking ? "Stop Tracking" : "Start Tracking"}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statusSection: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  statusIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  statusActive: {
    backgroundColor: "#4CAF50",
  },
  statusInactive: {
    backgroundColor: "#f0f0f0",
  },
  statusText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
  },
  statisticsSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: "#f0f0f0",
  },
  statItem: {
    flex: 1,
    alignItems: "center",
  },
  statLabel: {
    fontSize: 12,
    color: "#999",
    marginBottom: 4,
  },
  statValue: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
  },
  errorContainer: {
    backgroundColor: "#ffebee",
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  errorText: {
    fontSize: 13,
    color: "#c62828",
  },
  toggleButton: {
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  toggleButtonActive: {
    backgroundColor: "#f44336",
  },
  toggleButtonInactive: {
    backgroundColor: "#4CAF50",
  },
  toggleButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
});
