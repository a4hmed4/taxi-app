import * as admin from "firebase-admin";
import { onDocumentCreated, onDocumentUpdated } from "firebase-functions/v2/firestore";
import { onValueWritten } from "firebase-functions/v2/database";

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
