import React, {
  createContext,
  PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { User, onAuthStateChanged, type ConfirmationResult } from "firebase/auth";
import { doc, onSnapshot, setDoc } from "firebase/firestore";
import { firebaseAuth, firestore } from "@/services/firebase/config";
import type { UserProfile, UserRole } from "../types";
import { requestOtp, verifyOtp } from "../services/phoneAuth.service";
import type { DriverProfile } from "@/features/drivers/types";

type AuthContextValue = {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  otpLoading: boolean;
  profileLoading: boolean;
  confirmationResult: ConfirmationResult | null;
  phoneNumber: string;
  driverProfile: DriverProfile | null;
  driverProfileLoading: boolean;
  requestOtpCode: (phoneNumber: string, recaptchaVerifier: any) => Promise<void>;
  confirmOtpCode: (code: string) => Promise<void>;
  setRole: (role: UserRole) => Promise<void>;
  resetOtpSession: () => void;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: PropsWithChildren) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [driverProfile, setDriverProfile] = useState<DriverProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(false);
  const [driverProfileLoading, setDriverProfileLoading] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  const [phoneNumber, setPhoneNumber] = useState("");

  useEffect(() => {
    return onAuthStateChanged(firebaseAuth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    if (!user) {
      setProfile(null);
      setDriverProfile(null);
      setProfileLoading(false);
      setDriverProfileLoading(false);
      return;
    }

    setProfileLoading(true);
    const profileRef = doc(firestore, "users", user.uid);
    return onSnapshot(profileRef, (snapshot) => {
      const currentProfile = (snapshot.data() as UserProfile | undefined) ?? null;
      setProfile(currentProfile);
      setProfileLoading(false);

      if (!currentProfile) {
        const now = Date.now();
        void setDoc(
          profileRef,
          {
            uid: user.uid,
            phoneNumber: user.phoneNumber ?? phoneNumber,
            createdAt: now,
            updatedAt: now,
          },
          { merge: true }
        );
      }
    });
  }, [phoneNumber, user]);

  useEffect(() => {
    if (!user || profile?.role !== "driver") {
      setDriverProfile(null);
      setDriverProfileLoading(false);
      return;
    }

    setDriverProfileLoading(true);
    const driverRef = doc(firestore, "drivers", user.uid);
    return onSnapshot(driverRef, (snapshot) => {
      setDriverProfile((snapshot.data() as DriverProfile | undefined) ?? null);
      setDriverProfileLoading(false);
    });
  }, [profile?.role, user]);

  const requestOtpCode = useCallback(async (nextPhoneNumber: string, recaptchaVerifier: any) => {
    setOtpLoading(true);
    try {
      const result = await requestOtp(nextPhoneNumber, recaptchaVerifier);
      setPhoneNumber(nextPhoneNumber);
      setConfirmationResult(result);
    } finally {
      setOtpLoading(false);
    }
  }, []);

  const confirmOtpCode = useCallback(async (code: string) => {
    if (!confirmationResult) {
      throw new Error("Request an OTP first.");
    }

    setOtpLoading(true);
    try {
      await verifyOtp(confirmationResult, code);
    } finally {
      setOtpLoading(false);
    }
  }, [confirmationResult]);

  const setRole = useCallback(async (role: UserRole) => {
    if (!user) {
      throw new Error("You must be signed in.");
    }

    await setDoc(
      doc(firestore, "users", user.uid),
      {
        role,
        updatedAt: Date.now(),
      },
        { merge: true }
    );
  }, [user]);

  const resetOtpSession = useCallback(() => {
    setConfirmationResult(null);
    setPhoneNumber("");
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      profile,
      driverProfile,
      loading: loading || profileLoading || driverProfileLoading,
      otpLoading,
      profileLoading,
      driverProfileLoading,
      confirmationResult,
      phoneNumber,
      requestOtpCode,
      confirmOtpCode,
      setRole,
      resetOtpSession,
    }),
    [
      confirmationResult,
      confirmOtpCode,
      driverProfile,
      driverProfileLoading,
      loading,
      otpLoading,
      phoneNumber,
      profile,
      profileLoading,
      requestOtpCode,
      resetOtpSession,
      setRole,
      user,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
