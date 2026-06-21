import * as admin from "firebase-admin";
import { onDocumentCreated, onDocumentUpdated } from "firebase-functions/v2/firestore";
import { onValueWritten } from "firebase-functions/v2/database";
import { onCall, onRequest } from "firebase-functions/v2/https";
import { findMatchingTrips } from "./services/tripMatching";
import type { LocationAddress, MatchingRequest, MatchingResponse } from "./types";

admin.initializeApp();

export const mirrorDriverLocation = onValueWritten("/liveLocations/{tripId}", async (event) => {
  const tripId = event.params.tripId as string;
  const value = event.data.after.val();

  if (!value) {
    return;
  }

  await admin.firestore().collection("trips").doc(tripId).set(
    {
      liveLocation: value,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    },
    { merge: true }
  );
});

export const syncBookingCounters = onDocumentCreated("bookings/{bookingId}", async (event) => {
  const booking = event.data?.data();
  if (!booking?.tripId) {
    return;
  }

  await admin.firestore().collection("trips").doc(booking.tripId).update({
    seatsBooked: admin.firestore.FieldValue.increment(1),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });
});

export const maintainTripState = onDocumentUpdated("trips/{tripId}", async (event) => {
  const before = event.data?.before.data();
  const after = event.data?.after.data();

  if (!before || !after) {
    return;
  }

  if (before.status !== after.status) {
    await admin.database().ref(`tripPresence/${event.params.tripId}`).set({
      status: after.status,
      updatedAt: Date.now(),
    });
  }
});

export const syncUserRoleClaims = onDocumentUpdated("users/{userId}", async (event) => {
  const before = event.data?.before.data();
  const after = event.data?.after.data();
  const uid = event.params.userId as string;

  if (!after) {
    await admin.auth().setCustomUserClaims(uid, {});
    return;
  }

  const role = after.role ?? null;
  const previousRole = before?.role ?? null;

  if (role === previousRole) {
    return;
  }

  if (!role) {
    await admin.auth().setCustomUserClaims(uid, {});
    return;
  }

  await admin.auth().setCustomUserClaims(uid, { role });
});

/**
 * HTTP REST API for trip matching
 * Call: POST /findMatchingTrips
 * Body: {
 *   pickupLocation: LocationAddress,
 *   dropoffLocation: LocationAddress,
 *   limit?: number,
 *   config?: MatchingConfig
 * }
 */
export const findMatchingTrips = onRequest(
  { cors: true, region: "us-central1" },
  async (req, res) => {
    // Only allow POST
    if (req.method !== "POST") {
      res.status(405).send("Method Not Allowed");
      return;
    }

    try {
      // Validate authentication
      const authHeader = req.headers.authorization;
      if (!authHeader) {
        res.status(401).send({ error: "Unauthorized" });
        return;
      }

      // Verify Firebase token
      let decodedToken;
      try {
        const token = authHeader.replace("Bearer ", "");
        decodedToken = await admin.auth().verifyIdToken(token);
      } catch (error) {
        res.status(401).send({ error: "Invalid token" });
        return;
      }

      // Parse request body
      const { pickupLocation, dropoffLocation, limit = 20, config = {} } = req.body as Partial<MatchingRequest> & {
        limit?: number;
        config?: any;
      };

      // Validate required fields
      if (!pickupLocation || !dropoffLocation) {
        res.status(400).send({
          error: "Missing required fields: pickupLocation, dropoffLocation",
        });
        return;
      }

      if (
        !pickupLocation.coordinate?.latitude ||
        !pickupLocation.coordinate?.longitude ||
        !dropoffLocation.coordinate?.latitude ||
        !dropoffLocation.coordinate?.longitude
      ) {
        res.status(400).send({
          error: "Invalid coordinates in location",
        });
        return;
      }

      // Validate limit
      if (limit < 1 || limit > 100) {
        res.status(400).send({
          error: "Limit must be between 1 and 100",
        });
        return;
      }

      // Find matching trips
      const matches = await findMatchingTrips(
        pickupLocation as LocationAddress,
        dropoffLocation as LocationAddress,
        config,
        limit
      );

      // Return response
      const response: MatchingResponse = {
        matches,
        count: matches.length,
        timestamp: Date.now(),
      };

      res.status(200).send(response);
    } catch (error) {
      console.error("Error in findMatchingTrips:", error);
      res.status(500).send({
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }
);

/**
 * Callable function for trip matching (alternative to HTTP)
 * Call from client: httpsCallable('findMatchingTripsCallable')({
 *   pickupLocation: LocationAddress,
 *   dropoffLocation: LocationAddress,
 *   limit?: number
 * })
 */
export const findMatchingTripsCallable = onCall(
  { region: "us-central1" },
  async (request) => {
    // Verify user is authenticated
    if (!request.auth) {
      throw new Error("Unauthenticated");
    }

    const { pickupLocation, dropoffLocation, limit = 20, config = {} } = request.data as Partial<MatchingRequest> & {
      limit?: number;
      config?: any;
    };

    // Validate required fields
    if (!pickupLocation || !dropoffLocation) {
      throw new Error("Missing required fields: pickupLocation, dropoffLocation");
    }

    if (
      !pickupLocation.coordinate?.latitude ||
      !pickupLocation.coordinate?.longitude ||
      !dropoffLocation.coordinate?.latitude ||
      !dropoffLocation.coordinate?.longitude
    ) {
      throw new Error("Invalid coordinates in location");
    }

    // Validate limit
    if (limit < 1 || limit > 100) {
      throw new Error("Limit must be between 1 and 100");
    }

    // Find matching trips
    const matches = await findMatchingTrips(
      pickupLocation as LocationAddress,
      dropoffLocation as LocationAddress,
      config,
      limit
    );

    return {
      matches,
      count: matches.length,
      timestamp: Date.now(),
    };
  }
);
