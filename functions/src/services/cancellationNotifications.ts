import * as admin from "firebase-admin";
import { onDocumentDeleted } from "firebase-functions/v2/firestore";

const firestore = admin.firestore();
const messaging = admin.messaging();

/**
 * Send notification to driver when booking is cancelled
 */
export const notifyDriverOnCancellation = onDocumentDeleted(
  "bookings/{bookingId}",
  async (event) => {
    const booking = event.data?.data();
    if (!booking || booking.status !== "cancelled") {
      return;
    }

    try {
      // Fetch trip to get driver ID
      const tripDoc = await firestore
        .collection("trips")
        .doc(booking.tripId)
        .get();

      if (!tripDoc.exists) {
        return;
      }

      const trip = tripDoc.data();
      const driverId = trip.driverId;

      // Fetch driver FCM token
      const driverDoc = await firestore
        .collection("drivers")
        .doc(driverId)
        .get();

      if (!driverDoc.exists) {
        return;
      }

      const driver = driverDoc.data();
      const fcmToken = driver.fcmToken;

      if (!fcmToken) {
        return;
      }

      // Send cancellation notification
      const message = {
        notification: {
          title: "Booking Cancelled",
          body: `${booking.passengerName} cancelled ${booking.seatsBooked} seat(s)`,
        },
        data: {
          bookingId: event.params.bookingId,
          tripId: booking.tripId,
          type: "booking_cancelled",
        },
        token: fcmToken,
      };

      await messaging.send(message);

      // Store notification
      await firestore.collection("notifications").add({
        driverId,
        bookingId: event.params.bookingId,
        tripId: booking.tripId,
        type: "booking_cancelled",
        title: message.notification.title,
        body: message.notification.body,
        read: false,
        sentAt: admin.firestore.FieldValue.serverTimestamp(),
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    } catch (error) {
      console.error("Error sending cancellation notification:", error);
    }
  }
);
