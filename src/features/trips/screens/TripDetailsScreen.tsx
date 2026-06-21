import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ScrollView,
} from "react-native";
import { useAuth } from "@/features/auth/context/AuthProvider";
import type { Trip } from "@/features/drivers/types";
import { createBooking } from "../services/bookings.service";

interface TripDetailsProps {
  trip: Trip & { driverId: string };
  onBookingSuccess?: (bookingId: string) => void;
  navigation?: any;
}

export function TripDetailsScreen({
  trip,
  onBookingSuccess,
  navigation,
}: TripDetailsProps) {
  const { user, profile } = useAuth();
  const [seatsToBook, setSeatsToBook] = useState(1);
  const [isBooking, setIsBooking] = useState(false);
  const [expandedDescription, setExpandedDescription] = useState(false);

  const availableSeats = trip.availableSeats - (trip.seatsBooked || 0);
  const canBook = availableSeats >= seatsToBook && user && profile;

  const handleBooking = async () => {
    if (!user || !profile) {
      Alert.alert("Error", "You must be logged in to book a trip");
      return;
    }

    if (availableSeats < seatsToBook) {
      Alert.alert(
        "Not Enough Seats",
        `Only ${availableSeats} seat(s) available`
      );
      return;
    }

    setIsBooking(true);

    try {
      const response = await createBooking(
        {
          tripId: trip.id,
          passengerId: user.uid,
          seatsBooked: seatsToBook,
        },
        profile.displayName || "Anonymous",
        user.phoneNumber || ""
      );

      if (response.success && response.bookingId) {
        Alert.alert(
          "Success",
          "Your booking has been confirmed!",
          [
            {
              text: "View Booking",
              onPress: () => {
                onBookingSuccess?.(response.bookingId!);
                navigation?.navigate("BookingConfirmation", {
                  bookingId: response.bookingId,
                  tripId: trip.id,
                });
              },
            },
            {
              text: "Back",
              onPress: () => navigation?.goBack(),
            },
          ]
        );
      } else {
        Alert.alert("Booking Failed", response.message);
      }
    } catch (error) {
      Alert.alert(
        "Error",
        error instanceof Error ? error.message : "Failed to book trip"
      );
    } finally {
      setIsBooking(false);
    }
  };

  const departureDate = new Date(trip.departureTime);
  const timeUntilDeparture = trip.departureTime - Date.now();
  const hoursUntilDeparture = Math.floor(timeUntilDeparture / (1000 * 60 * 60));
  const minutesUntilDeparture = Math.floor(
    (timeUntilDeparture % (1000 * 60 * 60)) / (1000 * 60)
  );

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Trip Header */}
      <View style={styles.header}>
        <View style={styles.locationSection}>
          <Text style={styles.locationLabel}>From</Text>
          <Text style={styles.locationText} numberOfLines={2}>
            {trip.startLocation.address}
          </Text>
        </View>

        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>→</Text>
          <View style={styles.dividerLine} />
        </View>

        <View style={styles.locationSection}>
          <Text style={styles.locationLabel}>To</Text>
          <Text style={styles.locationText} numberOfLines={2}>
            {trip.destinationLocation.address}
          </Text>
        </View>
      </View>

      {/* Departure Time */}
      <View style={styles.infoCard}>
        <Text style={styles.infoLabel}>Departure Time</Text>
        <Text style={styles.infoValue}>
          {departureDate.toLocaleString()}
        </Text>
        <Text style={styles.timeRemaining}>
          {hoursUntilDeparture > 0
            ? `Departs in ${hoursUntilDeparture}h ${minutesUntilDeparture}m`
            : "Departing soon"}
        </Text>
      </View>

      {/* Availability */}
      <View style={styles.infoCard}>
        <Text style={styles.infoLabel}>Seats Available</Text>
        <View style={styles.seatsDisplay}>
          <Text style={styles.seatsCount}>{availableSeats}</Text>
          <Text style={styles.seatsText}>out of {trip.availableSeats}</Text>
        </View>
        <View style={styles.seatsBars}>
          {Array.from({ length: trip.availableSeats }).map((_, i) => (
            <View
              key={i}
              style={[
                styles.seatBar,
                i < availableSeats
                  ? styles.seatBarAvailable
                  : styles.seatBarBooked,
              ]}
            />
          ))}
        </View>
      </View>

      {/* Seat Selection */}
      <View style={styles.seatSelectionCard}>
        <Text style={styles.infoLabel}>Number of Seats</Text>
        <View style={styles.seatSelector}>
          <TouchableOpacity
            style={[
              styles.seatButton,
              seatsToBook === 1 && styles.seatButtonDisabled,
            ]}
            onPress={() => setSeatsToBook(Math.max(1, seatsToBook - 1))}
            disabled={seatsToBook === 1}
          >
            <Text style={styles.seatButtonText}>−</Text>
          </TouchableOpacity>

          <View style={styles.seatDisplay}>
            <Text style={styles.seatDisplayValue}>{seatsToBook}</Text>
          </View>

          <TouchableOpacity
            style={[
              styles.seatButton,
              (seatsToBook === availableSeats || availableSeats === 0) &&
                styles.seatButtonDisabled,
            ]}
            onPress={() =>
              setSeatsToBook(Math.min(availableSeats, seatsToBook + 1))
            }
            disabled={seatsToBook === availableSeats || availableSeats === 0}
          >
            <Text style={styles.seatButtonText}>+</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Price Estimation (if available) */}
      <View style={styles.priceCard}>
        <View style={styles.priceRow}>
          <Text style={styles.priceLabel}>Price per seat</Text>
          <Text style={styles.priceValue}>SAR 50</Text>
        </View>
        <View style={styles.priceRow}>
          <Text style={styles.priceLabel}>Seats</Text>
          <Text style={styles.priceValue}>× {seatsToBook}</Text>
        </View>
        <View style={styles.priceDivider} />
        <View style={styles.priceRow}>
          <Text style={styles.priceTotalLabel}>Total</Text>
          <Text style={styles.priceTotalValue}>SAR {50 * seatsToBook}</Text>
        </View>
      </View>

      {/* Route Details */}
      <View style={styles.expandableCard}>
        <TouchableOpacity
          onPress={() => setExpandedDescription(!expandedDescription)}
          style={styles.expandableHeader}
        >
          <Text style={styles.expandableTitle}>Trip Details</Text>
          <Text style={styles.expandableIcon}>
            {expandedDescription ? "▼" : "▶"}
          </Text>
        </TouchableOpacity>
        {expandedDescription && (
          <View style={styles.expandableContent}>
            <Text style={styles.detailText}>
              <Text style={styles.detailLabel}>Total Seats:</Text> {trip.availableSeats}
            </Text>
            <Text style={styles.detailText}>
              <Text style={styles.detailLabel}>Status:</Text> {trip.status}
            </Text>
            <Text style={styles.detailText}>
              <Text style={styles.detailLabel}>Trip ID:</Text> {trip.id.slice(0, 8)}...
            </Text>
          </View>
        )}
      </View>

      {/* Booking Button */}
      <TouchableOpacity
        style={[
          styles.bookButton,
          !canBook && styles.bookButtonDisabled,
        ]}
        onPress={handleBooking}
        disabled={!canBook || isBooking}
      >
        {isBooking ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.bookButtonText}>
            Book {seatsToBook > 1 ? `${seatsToBook} Seats` : "Seat"}
          </Text>
        )}
      </TouchableOpacity>

      {!canBook && (
        <Text style={styles.errorMessage}>
          {availableSeats === 0
            ? "No seats available"
            : "Please select valid number of seats"}
        </Text>
      )}

      <View style={styles.spacer} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
    paddingHorizontal: 16,
  },
  header: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginVertical: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  locationSection: {
    marginBottom: 12,
  },
  locationLabel: {
    fontSize: 12,
    color: "#999",
    marginBottom: 4,
    fontWeight: "500",
  },
  locationText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    lineHeight: 20,
  },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 8,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#e0e0e0",
  },
  dividerText: {
    marginHorizontal: 12,
    fontSize: 18,
    color: "#007AFF",
  },
  infoCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  infoLabel: {
    fontSize: 12,
    color: "#999",
    marginBottom: 8,
    fontWeight: "500",
    textTransform: "uppercase",
  },
  infoValue: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 4,
  },
  timeRemaining: {
    fontSize: 12,
    color: "#4CAF50",
    fontWeight: "500",
  },
  seatsDisplay: {
    flexDirection: "row",
    alignItems: "baseline",
    marginBottom: 12,
  },
  seatsCount: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#4CAF50",
    marginRight: 8,
  },
  seatsText: {
    fontSize: 14,
    color: "#999",
  },
  seatsBars: {
    flexDirection: "row",
    gap: 4,
  },
  seatBar: {
    flex: 1,
    height: 6,
    borderRadius: 3,
  },
  seatBarAvailable: {
    backgroundColor: "#4CAF50",
  },
  seatBarBooked: {
    backgroundColor: "#e0e0e0",
  },
  seatSelectionCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  seatSelector: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  seatButton: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: "#007AFF",
    justifyContent: "center",
    alignItems: "center",
  },
  seatButtonDisabled: {
    backgroundColor: "#ccc",
    opacity: 0.5,
  },
  seatButtonText: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
  },
  seatDisplay: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: "#f9f9f9",
    borderRadius: 8,
    alignItems: "center",
  },
  seatDisplayValue: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  priceCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  priceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
  },
  priceLabel: {
    fontSize: 14,
    color: "#666",
  },
  priceValue: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
  },
  priceDivider: {
    height: 1,
    backgroundColor: "#e0e0e0",
    marginVertical: 8,
  },
  priceTotalLabel: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
  },
  priceTotalValue: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#007AFF",
  },
  expandableCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    marginBottom: 12,
    overflow: "hidden",
  },
  expandableHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
  },
  expandableTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
  },
  expandableIcon: {
    fontSize: 12,
    color: "#999",
  },
  expandableContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    backgroundColor: "#f9f9f9",
  },
  detailText: {
    fontSize: 12,
    color: "#666",
    marginBottom: 8,
    lineHeight: 18,
  },
  detailLabel: {
    fontWeight: "600",
    color: "#333",
  },
  bookButton: {
    backgroundColor: "#4CAF50",
    paddingVertical: 16,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  bookButtonDisabled: {
    backgroundColor: "#ccc",
    opacity: 0.6,
  },
  bookButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  errorMessage: {
    fontSize: 12,
    color: "#f44336",
    textAlign: "center",
    marginTop: 8,
  },
  spacer: {
    height: 24,
  },
});
