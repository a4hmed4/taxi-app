import {
  type ConfirmationResult,
  PhoneAuthProvider,
  signInWithCredential,
  signInWithPhoneNumber,
} from "firebase/auth";
import { firebaseAuth } from "@/services/firebase/config";

export async function requestOtp(phoneNumber: string, recaptchaVerifier: any) {
  return signInWithPhoneNumber(firebaseAuth, phoneNumber, recaptchaVerifier);
}

export async function verifyOtp(confirmationResult: ConfirmationResult, code: string) {
  const credential = PhoneAuthProvider.credential(confirmationResult.verificationId, code);
  return signInWithCredential(firebaseAuth, credential);
}
