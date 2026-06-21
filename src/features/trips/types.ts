/**
 * Booking types and interfaces
 */

export type BookingStatus = "pending" | "confirmed" | "completed" | "cancelled";

export interface Booking {
  id: string;
  tripId: string;
  passengerId: string;
  passengerName: string;
  passengerPhone: string;
  status: BookingStatus;
  seatsBooked: number;
  createdAt: number;
  updatedAt: number;
  cancelledAt?: number;
  completedAt?: number;
}

export interface BookingRequest {
  tripId: string;
  passengerId: string;
  seatsBooked: number;
}

export interface BookingResponse {
  success: boolean;
  bookingId?: string;
  message: string;
  availableSeats?: number;
}

export interface PassengerBooking extends Booking {
  trip?: {
    startLocation: string;
    destinationLocation: string;
    departureTime: number;
    driverName: string;
    driverRating: number;
  };
}
