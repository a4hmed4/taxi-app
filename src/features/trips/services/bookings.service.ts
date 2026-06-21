import { collection, addDoc, query, where, getDocs, updateDoc, doc, writeBatch, Transaction, runTransaction, Timestamp } from "firebase/firestore";
import { firestore } from "@/services/firebase/config";
import type { Booking, BookingRequest, BookingResponse } from "../types";

/**
 * Create a new booking for a passenger
 * Handles transactional updates to maintain data consistency
 */
export async function createBooking(
  request: BookingRequest,
  passengerName: string,
  passengerPhone: string
): Promise<BookingResponse> {
  try {
    // Use transaction for atomic operations
    const result = await runTransaction(firestore, async (transaction: Transaction) => {
      const tripRef = doc(firestore, "trips", request.tripId);
      const tripSnapshot = await transaction.get(tripRef);

      if (!tripSnapshot.exists()) {
        throw new Error("Trip not found");
      }

      const trip = tripSnapshot.data();

      // Check if trip is still active
      if (trip.status !== "active") {
        throw new Error("Trip is no longer available");
      }

      // Check if enough seats available
      const seatsBooked = trip.seatsBooked || 0;
      const availableSeats = trip.availableSeats - seatsBooked;

      if (availableSeats < request.seatsBooked) {
        throw new Error(
          `Not enough seats available. Only ${availableSeats} seat(s) left.`
        );
      }

      // Check if passenger already booked this trip
      const existingBookingsQuery = query(
        collection(firestore, "bookings"),
        where("tripId", "==", request.tripId),
        where("passengerId", "==", request.passengerId),
        where("status", "in", ["pending", "confirmed"])
      );

      const existingBookings = await getDocs(existingBookingsQuery);
      if (!existingBookings.empty) {
        throw new Error("You have already booked this trip");
      }

      // Create booking document
      const now = Timestamp.now();
      const booking: Omit<Booking, "id"> = {
        tripId: request.tripId,
        passengerId: request.passengerId,
        passengerName,
        passengerPhone,
        status: "pending",
        seatsBooked: request.seatsBooked,
        createdAt: now.toMillis(),
        updatedAt: now.toMillis(),
      };

      const bookingRef = collection(firestore, "bookings");
      const bookingDoc = await addDoc(bookingRef, booking);

      // Update trip: increment seatsBooked and decrement availableSeats
      transaction.update(tripRef, {
        seatsBooked: (seatsBooked || 0) + request.seatsBooked,
        updatedAt: now,
      });

      return {
        bookingId: bookingDoc.id,
        availableSeats: availableSeats - request.seatsBooked,
      };
    });

    return {
      success: true,
      bookingId: result.bookingId,
      availableSeats: result.availableSeats,
      message: "Booking confirmed successfully",
    };
  } catch (error) {
    console.error("Error creating booking:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Failed to create booking",
    };
  }
}

/**
 * Confirm a pending booking (driver or admin action)
 */
export async function confirmBooking(bookingId: string): Promise<BookingResponse> {
  try {
    const bookingRef = doc(firestore, "bookings", bookingId);
    const bookingSnapshot = await getDocs(
      query(collection(firestore, "bookings"), where(doc(firestore, "bookings", bookingId), "==", true))
    );

    await updateDoc(bookingRef, {
      status: "confirmed",
      updatedAt: Timestamp.now(),
    });

    return {
      success: true,
      message: "Booking confirmed",
    };
  } catch (error) {
    console.error("Error confirming booking:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Failed to confirm booking",
    };
  }
}

/**
 * Cancel a booking
 * Updates trip's available seats back
 */
export async function cancelBooking(bookingId: string): Promise<BookingResponse> {
  try {
    const result = await runTransaction(firestore, async (transaction: Transaction) => {
      const bookingRef = doc(firestore, "bookings", bookingId);
      const bookingSnapshot = await transaction.get(bookingRef);

      if (!bookingSnapshot.exists()) {
        throw new Error("Booking not found");
      }

      const booking = bookingSnapshot.data() as Booking;

      // Can only cancel pending or confirmed bookings
      if (booking.status === "completed" || booking.status === "cancelled") {
        throw new Error(`Cannot cancel a ${booking.status} booking`);
      }

      // Update booking status
      transaction.update(bookingRef, {
        status: "cancelled",
        cancelledAt: Timestamp.now().toMillis(),
        updatedAt: Timestamp.now(),
      });

      // Update trip: decrement seatsBooked
      const tripRef = doc(firestore, "trips", booking.tripId);
      const tripSnapshot = await transaction.get(tripRef);

      if (tripSnapshot.exists()) {
        const trip = tripSnapshot.data();
        transaction.update(tripRef, {
          seatsBooked: Math.max(0, (trip.seatsBooked || 0) - booking.seatsBooked),
          updatedAt: Timestamp.now(),
        });
      }

      return {
        seatsFreed: booking.seatsBooked,
      };
    });

    return {
      success: true,
      message: "Booking cancelled successfully",
    };
  } catch (error) {
    console.error("Error cancelling booking:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Failed to cancel booking",
    };
  }
}

/**
 * Get all bookings for a passenger
 */
export async function getPassengerBookings(
  passengerId: string
): Promise<PassengerBooking[]> {
  try {
    const bookingsQuery = query(
      collection(firestore, "bookings"),
      where("passengerId", "==", passengerId)
    );

    const snapshot = await getDocs(bookingsQuery);
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    } as PassengerBooking));
  } catch (error) {
    console.error("Error fetching passenger bookings:", error);
    return [];
  }
}

/**
 * Get all bookings for a trip
 */
export async function getTripBookings(tripId: string): Promise<Booking[]> {
  try {
    const bookingsQuery = query(
      collection(firestore, "bookings"),
      where("tripId", "==", tripId)
    );

    const snapshot = await getDocs(bookingsQuery);
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    } as Booking));
  } catch (error) {
    console.error("Error fetching trip bookings:", error);
    return [];
  }
}

/**
 * Get booking by ID
 */
export async function getBooking(bookingId: string): Promise<Booking | null> {
  try {
    const bookingRef = doc(firestore, "bookings", bookingId);
    const snapshot = await getDocs(
      query(collection(firestore, "bookings"), where("id", "==", bookingId))
    );

    if (snapshot.empty) {
      return null;
    }

    const doc_data = snapshot.docs[0];
    return {
      id: doc_data.id,
      ...doc_data.data(),
    } as Booking;
  } catch (error) {
    console.error("Error fetching booking:", error);
    return null;
  }
}

export type { PassengerBooking };
