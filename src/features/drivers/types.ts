import type { UserRole } from "@/features/auth/types";

export type DriverCarDetails = {
  brand: string;
  model: string;
  color: string;
  licensePlateNumber: string;
  seats: number;
};

export type DriverProfile = {
  uid: string;
  fullName: string;
  phoneNumber: string;
  photoURL: string;
  role: UserRole;
  car: DriverCarDetails;
  onboardingCompleted: boolean;
  earningsTotal: number;
  activeTripsCount: number;
  createdAt: number;
  updatedAt: number;
};

export type LocationCoordinate = {
  latitude: number;
  longitude: number;
};

export type LocationAddress = {
  address: string;
  coordinate: LocationCoordinate;
  placeId: string;
};

export type Trip = {
  id: string;
  driverId: string;
  startLocation: LocationAddress;
  destinationLocation: LocationAddress;
  departureTime: number; // timestamp
  availableSeats: number;
  routeCoordinates: LocationCoordinate[];
  status: "active" | "completed" | "cancelled";
  createdAt: number;
  updatedAt: number;
};

export type CreateTripInput = {
  startLocation: LocationAddress;
  destinationLocation: LocationAddress;
  departureTime: number;
  availableSeats: number;
};

export interface PlacesPrediction {
  placeId: string;
  mainText: string;
  secondaryText: string;
  fullText: string;
}

export interface PlaceDetails {
  address: string;
  coordinate: LocationCoordinate;
  placeId: string;
}