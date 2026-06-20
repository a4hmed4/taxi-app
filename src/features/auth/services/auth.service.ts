import {
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
  type UserCredential,
} from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { firebaseAuth, firestore } from "@/services/firebase/config";
import type { UserProfile, UserRole } from "../types";

type AuthInput = {
  email: string;
  password: string;
  displayName?: string;
};

export async function signInWithEmail(input: AuthInput) {
  return signInWithEmailAndPassword(firebaseAuth, input.email.trim(), input.password);
}

export async function signUpWithEmail(input: AuthInput) {
  const credential = await createUserWithEmailAndPassword(
    firebaseAuth,
    input.email.trim(),
    input.password
  );

  await createUserProfile(credential, input.displayName ?? "New user");
  return credential;
}

export async function sendResetPassword(email: string) {
  return sendPasswordResetEmail(firebaseAuth, email.trim());
}

export async function logout() {
  return signOut(firebaseAuth);
}

export async function createUserProfile(credential: UserCredential, displayName: string) {
  const timestamp = Date.now();
  const profile: UserProfile = {
    uid: credential.user.uid,
    displayName,
    rating: 5,
    isVerifiedDriver: false,
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  if (credential.user.phoneNumber) {
    profile.phoneNumber = credential.user.phoneNumber;
  }

  if (credential.user.photoURL) {
    profile.photoURL = credential.user.photoURL;
  }

  await setDoc(doc(firestore, "users", credential.user.uid), profile, { merge: true });
}

export async function updateUserRole(uid: string, role: UserRole) {
  await setDoc(
    doc(firestore, "users", uid),
    {
      role,
      updatedAt: Date.now(),
    },
    { merge: true }
  );
}
