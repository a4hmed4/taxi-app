export type UserRole = "driver" | "passenger";

export type AuthStage = "phone" | "otp" | "role" | "driverOnboarding" | "passengerHome";

export type UserProfile = {
  uid: string;
  phoneNumber: string;
  displayName?: string;
  role?: UserRole;
  onboardingCompleted?: boolean;
  createdAt: number;
  updatedAt: number;
};
