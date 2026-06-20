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
