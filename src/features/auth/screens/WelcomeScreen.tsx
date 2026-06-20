import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors } from "@/shared/theme/colors";
import { Screen } from "@/shared/ui/Screen";
import { TextField } from "@/shared/ui/TextField";
import { signInWithEmail, signUpWithEmail } from "../services/auth.service";

export function WelcomeScreen() {
  const [mode, setMode] = React.useState<"signIn" | "signUp">("signIn");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [displayName, setDisplayName] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState(false);

  const handleSignIn = async () => {
    if (!email.trim() || !password.trim() || (mode === "signUp" && !displayName.trim())) {
      setError("Fill in the required account details.");
      return;
    }

    setBusy(true);
    setError(null);

    try {
      if (mode === "signUp") {
        await signUpWithEmail({ email, password, displayName });
      } else {
        await signInWithEmail({ email, password });
      }
    } catch (signInError) {
      setError(signInError instanceof Error ? signInError.message : "Sign in failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen>
      <View style={styles.shell}>
        <View style={styles.hero}>
          <Text style={styles.kicker}>Smart Carpool</Text>
          <Text style={styles.title}>Route-based rides for drivers and passengers.</Text>
          <Text style={styles.subtitle}>
            Publish a trip, match passengers traveling in the same direction, and track every ride
            in real time.
          </Text>
        </View>
        <View style={styles.card}>
          <View style={styles.segmentedControl}>
            <Pressable
              style={[styles.segment, mode === "signIn" && styles.segmentActive]}
              onPress={() => setMode("signIn")}
            >
              <Text style={[styles.segmentText, mode === "signIn" && styles.segmentTextActive]}>
                Sign in
              </Text>
            </Pressable>
            <Pressable
              style={[styles.segment, mode === "signUp" && styles.segmentActive]}
              onPress={() => setMode("signUp")}
            >
              <Text style={[styles.segmentText, mode === "signUp" && styles.segmentTextActive]}>
                Sign up
              </Text>
            </Pressable>
          </View>
          <Text style={styles.cardTitle}>{mode === "signUp" ? "Create account" : "Sign in"}</Text>
          {mode === "signUp" ? (
            <TextField label="Display name" value={displayName} onChangeText={setDisplayName} />
          ) : null}
          <TextField
            label="Email"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />
          <TextField
            label="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <Pressable
            style={[styles.primaryAction, busy && styles.disabledAction]}
            onPress={handleSignIn}
            disabled={busy}
          >
            <Text style={styles.primaryActionText}>
              {busy ? (mode === "signUp" ? "Creating account..." : "Signing in...") : "Continue"}
            </Text>
          </Pressable>
          <Text style={styles.cardText}>
            New users are onboarded in the next phase with driver or passenger profile setup.
          </Text>
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  shell: {
    flex: 1,
  },
  hero: {
    flex: 1,
    justifyContent: "center",
    padding: 24,
    gap: 16,
  },
  kicker: {
    color: colors.primary,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1.2,
  },
  title: {
    color: colors.text,
    fontSize: 36,
    fontWeight: "800",
    lineHeight: 42,
  },
  subtitle: {
    color: colors.mutedText,
    fontSize: 16,
    lineHeight: 24,
  },
  card: {
    margin: 24,
    padding: 20,
    backgroundColor: colors.surface,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 12,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.text,
  },
  segmentedControl: {
    flexDirection: "row",
    backgroundColor: colors.background,
    borderRadius: 16,
    padding: 4,
    gap: 4,
  },
  segment: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: "center",
  },
  segmentActive: {
    backgroundColor: colors.surface,
  },
  segmentText: {
    color: colors.mutedText,
    fontWeight: "600",
  },
  segmentTextActive: {
    color: colors.text,
  },
  cardText: {
    color: colors.mutedText,
    lineHeight: 22,
  },
  error: {
    color: colors.danger,
  },
  primaryAction: {
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: "center",
  },
  primaryActionText: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
  disabledAction: {
    opacity: 0.7,
  },
});
