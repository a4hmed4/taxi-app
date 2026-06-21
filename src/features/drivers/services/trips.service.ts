import { collection, addDoc, serverTimestamp, query, where, getDocs } from "firebase/firestore";
import { firestore } from "@/services/firebase/config";
import type { Trip, CreateTripInput, LocationAddress } from "../types";
import { getDirections } from "@/services/google-maps/directions.service";

/**
 * Create a new trip for a driver
 */
export async function createTrip(
  driverId: string,
  input: CreateTripInput
): Promise<Trip> {
  try {
    // Fetch route coordinates from Google Directions API
    const directionsResult = await getDirections(
      input.startLocation,
      input.destinationLocation
    );

    // Prepare trip data
    const tripData = {
      driverId,
      startLocation: input.startLocation,
      destinationLocation: input.destinationLocation,
      departureTime: input.departureTime,
      availableSeats: input.availableSeats,
      routeCoordinates: directionsResult.routeCoordinates,
      status: "active" as const,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    // Save to Firestore
    const docRef = await addDoc(collection(firestore, "trips"), tripData);

    // Return created trip with ID
    return {
      id: docRef.id,
      ...tripData,
    };
  } catch (error) {
    console.error("Error creating trip:", error);
    throw error;
  }
}

/**
 * Get active trips for a driver
 */
export async function getDriverActiveTrips(driverId: string): Promise<Trip[]> {
  try {
    const tripsQuery = query(
      collection(firestore, "trips"),
      where("driverId", "==", driverId),
      where("status", "==", "active")
    );

    const snapshot = await getDocs(tripsQuery);
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    } as Trip));
  } catch (error) {
    console.error("Error fetching driver trips:", error);
    throw error;
  }
}

/**
 * Validate trip input
 */
export function validateTripInput(input: CreateTripInput): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // Validate start location
  if (!input.startLocation?.address?.trim()) {
    errors.push("Start location is required");
  }
  if (
    input.startLocation?.coordinate &&
    (typeof input.startLocation.coordinate.latitude !== "number" ||
      typeof input.startLocation.coordinate.longitude !== "number")
  ) {
    errors.push("Start location coordinates are invalid");
  }

  // Validate destination location
  if (!input.destinationLocation?.address?.trim()) {
    errors.push("Destination location is required");
  }
  if (
    input.destinationLocation?.coordinate &&
    (typeof input.destinationLocation.coordinate.latitude !== "number" ||
      typeof input.destinationLocation.coordinate.longitude !== "number")
  ) {
    errors.push("Destination location coordinates are invalid");
  }

  // Check if start and destination are different
  if (
    input.startLocation?.placeId === input.destinationLocation?.placeId &&
    input.startLocation?.placeId
  ) {
    errors.push("Start and destination locations cannot be the same");
  }

  // Validate departure time
  if (!input.departureTime) {
    errors.push("Departure time is required");
  }
  if (input.departureTime < Date.now()) {
    errors.push("Departure time must be in the future");
  }

  // Validate available seats
  if (!Number.isInteger(input.availableSeats) || input.availableSeats < 1) {
    errors.push("Available seats must be at least 1");
  }
  if (input.availableSeats > 7) {
    errors.push("Maximum 7 seats allowed");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}