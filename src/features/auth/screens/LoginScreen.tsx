import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { FirebaseRecaptchaVerifierModal } from "expo-firebase-recaptcha";
import { colors } from "@/shared/theme/colors";
import { Screen } from "@/shared/ui/Screen";
import { TextField } from "@/shared/ui/TextField";
import { firebaseConfig } from "@/services/firebase/config";
import { useAuth } from "../context/AuthProvider";

export function LoginScreen() {
  const { requestOtpCode, otpLoading } = useAuth();
  const recaptchaVerifier = React.useRef<any>(null);
  const [phoneNumber, setPhoneNumber] = React.useState("");
  const [mode, setMode] = React.useState<"login" | "register">("login");
  const [error, setError] = React.useState<string | null>(null);

  const handleContinue = async () => {
    if (!phoneNumber.trim()) {
      setError("Enter a phone number with country code, for example +201234567890.");
      return;
    }

    setError(null);

    try {
      await requestOtpCode(phoneNumber.trim(), recaptchaVerifier.current);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Failed to send OTP");
    }
  };

  return (
    <Screen>
      <FirebaseRecaptchaVerifierModal ref={recaptchaVerifier} firebaseConfig={firebaseConfig} attemptInvisibleVerification />
      <View style={styles.container}>
        <Text style={styles.kicker}>Smart Carpool</Text>
        <Text style={styles.title}>{mode === "register" ? "Create your account" : "Welcome back"}</Text>
        <Text style={styles.subtitle}>
          {mode === "register"
            ? "Register with your phone number to join the carpool network."
            : "Sign in securely with a one-time code sent to your phone."}
        </Text>
        <View style={styles.segmentedControl}>
          <Pressable style={[styles.segment, mode === "login" && styles.segmentActive]} onPress={() => setMode("login")}>
            <Text style={[styles.segmentText, mode === "login" && styles.segmentTextActive]}>Login</Text>
          </Pressable>
          <Pressable style={[styles.segment, mode === "register" && styles.segmentActive]} onPress={() => setMode("register")}>
            <Text style={[styles.segmentText, mode === "register" && styles.segmentTextActive]}>Register</Text>
          </Pressable>
        </View>
        <TextField
          label="Phone number"
          value={phoneNumber}
          onChangeText={setPhoneNumber}
          keyboardType="phone-pad"
          placeholder="+201234567890"
        />
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <Pressable style={[styles.button, otpLoading && styles.disabled]} onPress={handleContinue} disabled={otpLoading}>
          <Text style={styles.buttonText}>{otpLoading ? "Sending code..." : "Continue"}</Text>
        </Pressable>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, justifyContent: "center", gap: 14 },
  kicker: { color: colors.primary, fontWeight: "700", textTransform: "uppercase", letterSpacing: 1.2 },
  title: { color: colors.text, fontSize: 34, fontWeight: "800", lineHeight: 40 },
  subtitle: { color: colors.mutedText, lineHeight: 22 },
  segmentedControl: {
    flexDirection: "row",
    backgroundColor: colors.background,
    borderRadius: 16,
    padding: 4,
    gap: 4,
  },
  segment: { flex: 1, paddingVertical: 10, borderRadius: 12, alignItems: "center" },
  segmentActive: { backgroundColor: colors.surface },
  segmentText: { color: colors.mutedText, fontWeight: "600" },
  segmentTextActive: { color: colors.text },
  error: { color: colors.danger },
  button: {
    marginTop: 4,
    backgroundColor: colors.primary,
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: "center",
  },
  buttonText: { color: "#FFFFFF", fontWeight: "700" },
  disabled: { opacity: 0.7 },
});
