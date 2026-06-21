import * as admin from "firebase-admin";
import { onDocumentCreated } from "firebase-functions/v2/firestore";

const firestore = admin.firestore();
const messaging = admin.messaging();

/**
 * Send notification to driver when passenger books a trip
 * Triggered when a new booking document is created
 */
export const notifyDriverOnBooking = onDocumentCreated(
  "bookings/{bookingId}",
  async (event) => {
    const booking = event.data?.data();
    if (!booking) {
      return;
    }

    try {
      // Fetch trip details
      const tripDoc = await firestore
        .collection("trips")
        .doc(booking.tripId)
        .get();

      if (!tripDoc.exists) {
        console.log("Trip not found:", booking.tripId);
        return;
      }

      const trip = tripDoc.data();
      const driverId = trip.driverId;

      // Fetch driver details including FCM token
      const driverDoc = await firestore
        .collection("drivers")
        .doc(driverId)
        .get();

      if (!driverDoc.exists) {
        console.log("Driver not found:", driverId);
        return;
      }

      const driver = driverDoc.data();
      const fcmToken = driver.fcmToken;

      if (!fcmToken) {
        console.log("Driver has no FCM token:", driverId);
        return;
      }

      // Send notification
      const message = {
        notification: {
          title: "New Booking!",
          body: `${booking.passengerName} booked ${booking.seatsBooked} seat(s)`,
        },
        data: {
          bookingId: booking.bookingId || event.params.bookingId,
          tripId: booking.tripId,
          passengerId: booking.passengerId,
          seatsBooked: booking.seatsBooked.toString(),
          type: "booking",
        },
        token: fcmToken,
      };

      const response = await messaging.send(message);
      console.log("Notification sent:", response);

      // Store notification record
      await firestore.collection("notifications").add({
        driverId,
        bookingId: event.params.bookingId,
        tripId: booking.tripId,
        type: "booking",
        title: message.notification.title,
        body: message.notification.body,
        read: false,
        sentAt: admin.firestore.FieldValue.serverTimestamp(),
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    } catch (error) {
      console.error("Error sending booking notification:", error);
    }
  }
);

/**
 * Send notification to passenger when booking is confirmed
 */
export const notifyPassengerOnConfirmation = onDocumentCreated(
  "bookings/{bookingId}",
  async (event) => {
    const booking = event.data?.data();
    if (!booking || booking.status !== "confirmed") {
      return;
    }

    try {
      // Fetch passenger FCM token
      const passengerDoc = await firestore
        .collection("users")
        .doc(booking.passengerId)
        .get();

      if (!passengerDoc.exists) {
        console.log("Passenger not found:", booking.passengerId);
        return;
      }

      const passenger = passengerDoc.data();
      const fcmToken = passenger.fcmToken;

      if (!fcmToken) {
        console.log("Passenger has no FCM token:", booking.passengerId);
        return;
      }

      // Send confirmation notification
      const message = {
        notification: {
          title: "Booking Confirmed",
          body: "Your booking has been confirmed. Driver will arrive soon.",
        },
        data: {
          bookingId: event.params.bookingId,
          tripId: booking.tripId,
          type: "booking_confirmed",
        },
        token: fcmToken,
      };

      const response = await messaging.send(message);
      console.log("Confirmation notification sent:", response);

      // Store notification
      await firestore.collection("notifications").add({
        passengerId: booking.passengerId,
        bookingId: event.params.bookingId,
        tripId: booking.tripId,
        type: "booking_confirmed",
        title: message.notification.title,
        body: message.notification.body,
        read: false,
        sentAt: admin.firestore.FieldValue.serverTimestamp(),
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    } catch (error) {
      console.error("Error sending confirmation notification:", error);
    }
  }
);
