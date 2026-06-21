import React, { useState, useCallback } from "react";
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Text,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useAuth } from "@/features/auth/context/AuthProvider";
import { LocationAutocomplete } from "@/shared/components/LocationAutocomplete";
import { DateTimePickerInput } from "@/shared/components/DateTimePicker";
import { SeatsInput } from "@/shared/components/SeatsInput";
import { createTrip, validateTripInput } from "../services/trips.service";
import type { LocationAddress, CreateTripInput } from "../types";

interface CreateTripFormState {
  startLocation: LocationAddress | null;
  destinationLocation: LocationAddress | null;
  departureTime: number;
  availableSeats: number;
}

export function CreateTripScreen({ navigation }: any) {
  const { user, driverProfile } = useAuth();
  const [formState, setFormState] = useState<CreateTripFormState>({
    startLocation: null,
    destinationLocation: null,
    departureTime: new Date().getTime() + 3600000, // 1 hour from now
    availableSeats: 1,
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  const handleStartLocationChange = useCallback((location: LocationAddress) => {
    setFormState((prev) => ({
      ...prev,
      startLocation: location,
    }));
    setErrors((prev) => prev.filter((e) => !e.includes("Start location")));
  }, []);

  const handleDestinationChange = useCallback((location: LocationAddress) => {
    setFormState((prev) => ({
      ...prev,
      destinationLocation: location,
    }));
    setErrors((prev) => prev.filter((e) => !e.includes("Destination")));
  }, []);

  const handleDepartureTimeChange = useCallback((timestamp: number) => {
    setFormState((prev) => ({
      ...prev,
      departureTime: timestamp,
    }));
    setErrors((prev) => prev.filter((e) => !e.includes("Departure time")));
  }, []);

  const handleSeatsChange = useCallback((seats: number) => {
    setFormState((prev) => ({
      ...prev,
      availableSeats: seats,
    }));
    setErrors((prev) => prev.filter((e) => !e.includes("seats")));
  }, []);

  const handleCreateTrip = async () => {
    if (!user || !driverProfile) {
      Alert.alert("Error", "You must be logged in as a driver");
      return;
    }

    // Validate input
    const tripInput: CreateTripInput = {
      startLocation: formState.startLocation!,
      destinationLocation: formState.destinationLocation!,
      departureTime: formState.departureTime,
      availableSeats: formState.availableSeats,
    };

    const validation = validateTripInput(tripInput);
    if (!validation.valid) {
      setErrors(validation.errors);
      Alert.alert("Validation Error", validation.errors.join("\n"));
      return;
    }

    setLoading(true);
    setErrors([]);

    try {
      const trip = await createTrip(user.uid, tripInput);
      
      Alert.alert("Success!", "Your trip has been created successfully", [
        {
          text: "OK",
          onPress: () => {
            // Navigate to success screen and then home
            navigation.navigate("CreateTripSuccess", { tripId: trip.id });
          },
        },
      ]);
    } catch (error) {
      console.error("Error creating trip:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Failed to create trip";
      setErrors([errorMessage]);
      Alert.alert("Error", errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const minDepartureDate = new Date();
  minDepartureDate.setMinutes(minDepartureDate.getMinutes() + 15);

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.contentContainer}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Create a Trip</Text>
          <Text style={styles.subtitle}>
            Share your ride with passengers and earn money
          </Text>
        </View>

        {errors.length > 0 && (
          <View style={styles.errorContainer}>
            {errors.map((error, index) => (
              <Text key={index} style={styles.errorText}>
                • {error}
              </Text>
            ))}
          </View>
        )}

        <View style={styles.form}>
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>From</Text>
            <LocationAutocomplete
              placeholder="Select starting location"
              onLocationSelected={handleStartLocationChange}
            />
            {formState.startLocation && (
              <Text style={styles.selectedText}>
                ✓ {formState.startLocation.address}
              </Text>
            )}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionLabel}>To</Text>
            <LocationAutocomplete
              placeholder="Select destination"
              onLocationSelected={handleDestinationChange}
            />
            {formState.destinationLocation && (
              <Text style={styles.selectedText}>
                ✓ {formState.destinationLocation.address}
              </Text>
            )}
          </View>

          <View style={styles.section}>
            <DateTimePickerInput
              label="Departure Time"
              value={formState.departureTime}
              onChange={handleDepartureTimeChange}
              minDate={minDepartureDate}
              placeholder="Select departure time"
            />
          </View>

          <View style={styles.section}>
            <SeatsInput
              value={formState.availableSeats}
              onChange={handleSeatsChange}
            />
          </View>
        </View>

        <TouchableOpacity
          style={[styles.submitButton, loading && styles.submitButtonDisabled]}
          onPress={handleCreateTrip}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.submitButtonText}>Create Trip</Text>
          )}
        </TouchableOpacity>

        <View style={styles.spacer} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 16,
    paddingVertical: 20,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#000",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: "#666",
  },
  errorContainer: {
    backgroundColor: "#fee",
    borderLeftWidth: 4,
    borderLeftColor: "#f00",
    padding: 12,
    borderRadius: 6,
    marginBottom: 20,
  },
  errorText: {
    color: "#c00",
    fontSize: 13,
    marginBottom: 4,
  },
  form: {
    gap: 20,
    marginBottom: 24,
  },
  section: {
    gap: 8,
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  selectedText: {
    fontSize: 13,
    color: "#4CAF50",
    marginTop: 4,
  },
  submitButton: {
    backgroundColor: "#007AFF",
    paddingVertical: 16,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
  },
  spacer: {
    height: 20,
  },
});