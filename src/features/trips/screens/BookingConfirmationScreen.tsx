import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  Alert,
  ScrollView,
} from "react-native";
import { useAuth } from "@/features/auth/context/AuthProvider";
import { getBooking, cancelBooking } from "../services/bookings.service";
import type { Booking } from "../types";

interface BookingConfirmationScreenProps {
  route: {
    params: {
      bookingId: string;
      tripId: string;
    };
  };
  navigation: any;
}

export function BookingConfirmationScreen({
  route,
  navigation,
}: BookingConfirmationScreenProps) {
  const { bookingId, tripId } = route.params;
  const { user } = useAuth();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    loadBooking();
  }, [bookingId]);

  const loadBooking = async () => {
    try {
      setLoading(true);
      // TODO: Implement getBooking function
      // const bookingData = await getBooking(bookingId);
      // setBooking(bookingData);
      setLoading(false);
    } catch (error) {
      console.error("Error loading booking:", error);
      setLoading(false);
    }
  };

  const handleCancelBooking = () => {
    Alert.alert(
      "Cancel Booking",
      "Are you sure you want to cancel this booking? You will lose your seat.",
      [
        {
          text: "No, Keep Booking",
          style: "cancel",
        },
        {
          text: "Yes, Cancel",
          onPress: confirmCancel,
          style: "destructive",
        },
      ]
    );
  };

  const confirmCancel = async () => {
    setCancelling(true);
    try {
      const response = await cancelBooking(bookingId);
      if (response.success) {
        Alert.alert("Cancelled", "Your booking has been cancelled.", [
          {
            text: "OK",
            onPress: () => navigation.navigate("PassengerHome"),
          },
        ]);
      } else {
        Alert.alert("Error", response.message);
      }
    } catch (error) {
      Alert.alert("Error", "Failed to cancel booking");
    } finally {
      setCancelling(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Loading booking details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!booking) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Booking not found</Text>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const bookingDate = new Date(booking.createdAt);
  const isConfirmed = booking.status === "confirmed";
  const isCancelled = booking.status === "cancelled";

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.contentContainer}
      >
        {/* Success Icon */}
        <View style={styles.iconContainer}>
          <View
            style={[
              styles.icon,
              isConfirmed ? styles.iconSuccess : styles.iconPending,
            ]}
          >
            <Text style={styles.iconText}>
              {isConfirmed ? "✓" : isCancelled ? "✕" : "⏳"}
            </Text>
          </View>
        </View>

        {/* Status Message */}
        <Text style={styles.title}>
          {isConfirmed
            ? "Booking Confirmed!"
            : isCancelled
            ? "Booking Cancelled"
            : "Booking Pending"}
        </Text>
        <Text style={styles.subtitle}>
          {isConfirmed
            ? "Your seat is reserved. Driver will contact you soon."
            : isCancelled
            ? "Your booking has been cancelled."
            : "Your booking is awaiting confirmation from the driver."}
        </Text>

        {/* Booking Details Card */}
        <View style={styles.detailsCard}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Booking ID</Text>
            <Text style={styles.detailValue}>{booking.id.slice(0, 8)}...</Text>
          </View>

          <View style={styles.detailDivider} />

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Status</Text>
            <Text
              style={[
                styles.detailValue,
                isConfirmed && styles.statusConfirmed,
                isCancelled && styles.statusCancelled,
              ]}
            >
              {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
            </Text>
          </View>

          <View style={styles.detailDivider} />

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Seats Booked</Text>
            <Text style={styles.detailValue}>{booking.seatsBooked}</Text>
          </View>

          <View style={styles.detailDivider} />

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Passenger Name</Text>
            <Text style={styles.detailValue}>{booking.passengerName}</Text>
          </View>

          <View style={styles.detailDivider} />

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Booking Date</Text>
            <Text style={styles.detailValue}>
              {bookingDate.toLocaleDateString()} {bookingDate.toLocaleTimeString()}
            </Text>
          </View>
        </View>

        {/* Important Notes */}
        <View style={styles.notesCard}>
          <Text style={styles.notesTitle}>Important Information</Text>
          <Text style={styles.noteText}>
            • Keep your phone available for driver contact
          </Text>
          <Text style={styles.noteText}>
            • Be ready at the pickup location 5 minutes early
          </Text>
          <Text style={styles.noteText}>
            • Share your live location with trusted contacts
          </Text>
          <Text style={styles.noteText}>
            • Cancel at least 30 minutes before departure to avoid penalties
          </Text>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => navigation.navigate("PassengerHome")}
          >
            <Text style={styles.primaryButtonText}>Back to Home</Text>
          </TouchableOpacity>

          {!isCancelled && (
            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={handleCancelBooking}
              disabled={cancelling}
            >
              {cancelling ? (
                <ActivityIndicator color="#f44336" />
              ) : (
                <Text style={styles.secondaryButtonText}>Cancel Booking</Text>
              )}
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
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
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: "#666",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 16,
  },
  errorText: {
    fontSize: 16,
    color: "#f44336",
    marginBottom: 16,
  },
  backButton: {
    backgroundColor: "#007AFF",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  backButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  iconContainer: {
    alignItems: "center",
    marginBottom: 24,
  },
  icon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  iconSuccess: {
    backgroundColor: "#4CAF50",
  },
  iconPending: {
    backgroundColor: "#2196F3",
  },
  iconCancelled: {
    backgroundColor: "#f44336",
  },
  iconText: {
    fontSize: 40,
    color: "#fff",
    fontWeight: "bold",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    textAlign: "center",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 20,
  },
  detailsCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
  },
  detailLabel: {
    fontSize: 13,
    color: "#999",
    fontWeight: "500",
  },
  detailValue: {
    fontSize: 13,
    fontWeight: "600",
    color: "#333",
  },
  statusConfirmed: {
    color: "#4CAF50",
  },
  statusCancelled: {
    color: "#f44336",
  },
  detailDivider: {
    height: 1,
    backgroundColor: "#f0f0f0",
  },
  notesCard: {
    backgroundColor: "#FFF9C4",
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderLeftWidth: 4,
    borderLeftColor: "#FBC02D",
  },
  notesTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#F57F17",
    marginBottom: 12,
  },
  noteText: {
    fontSize: 12,
    color: "#F57F17",
    marginBottom: 8,
    lineHeight: 18,
  },
  actionsContainer: {
    gap: 12,
  },
  primaryButton: {
    backgroundColor: "#4CAF50",
    paddingVertical: 16,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  secondaryButton: {
    borderWidth: 2,
    borderColor: "#f44336",
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  secondaryButtonText: {
    color: "#f44336",
    fontSize: 16,
    fontWeight: "bold",
  },
});
