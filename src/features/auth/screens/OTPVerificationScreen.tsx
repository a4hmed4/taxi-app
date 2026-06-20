import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors } from "@/shared/theme/colors";
import { Screen } from "@/shared/ui/Screen";
import { TextField } from "@/shared/ui/TextField";
import { useAuth } from "../context/AuthProvider";

export function OTPVerificationScreen() {
  const { confirmOtpCode, phoneNumber, otpLoading, resetOtpSession } = useAuth();
  const [code, setCode] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);

  const handleVerify = async () => {
    if (!code.trim()) {
      setError("Enter the 6-digit code.");
      return;
    }

    setError(null);

    try {
      await confirmOtpCode(code.trim());
    } catch (verifyError) {
      setError(verifyError instanceof Error ? verifyError.message : "OTP verification failed");
    }
  };

  return (
    <Screen>
      <View style={styles.container}>
        <Text style={styles.kicker}>Verification</Text>
        <Text style={styles.title}>Enter the OTP</Text>
        <Text style={styles.subtitle}>We sent a one-time code to {phoneNumber || "your phone"}.</Text>
        <TextField
          label="6-digit code"
          value={code}
          onChangeText={setCode}
          keyboardType="number-pad"
          placeholder="123456"
        />
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <Pressable style={[styles.button, otpLoading && styles.disabled]} onPress={handleVerify} disabled={otpLoading}>
          <Text style={styles.buttonText}>{otpLoading ? "Verifying..." : "Verify code"}</Text>
        </Pressable>
        <Pressable onPress={resetOtpSession}>
          <Text style={styles.link}>Change phone number</Text>
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
  link: { color: colors.primary, fontWeight: "600" },
});
