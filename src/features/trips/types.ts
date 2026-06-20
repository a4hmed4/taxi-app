import type { LatLng, RoutePoint } from "@/shared/types/location";
import type { UserRole } from "@/features/auth/types";
import type { DriverCarDetails } from "@/features/drivers/types";

export type TripStatus = "draft" | "published" | "in_progress" | "completed" | "cancelled";

export type Trip = {
  id: string;
  driverId: string;
  driverName: string;
  role: UserRole;
  origin: LatLng;
  destination: LatLng;
  route: RoutePoint[];
  departureTime: number;
  seatsAvailable: number;
  seatsBooked: number;
  status: TripStatus;
  car?: DriverCarDetails;
  routeName?: string;
  notes?: string;
  createdAt: number;
  updatedAt: number;
};

export type TripBooking = {
  id: string;
  tripId: string;
  passengerId: string;
  passengerName: string;
  status: "requested" | "approved" | "rejected" | "cancelled";
  pickupPoint?: LatLng;
  dropoffPoint?: LatLng;
  createdAt: number;
  updatedAt: number;
};
