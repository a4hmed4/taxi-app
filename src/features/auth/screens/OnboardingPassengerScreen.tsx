import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors } from "@/shared/theme/colors";
import { Screen } from "@/shared/ui/Screen";

export function OnboardingPassengerScreen() {
  return (
    <Screen>
      <View style={styles.container}>
        <Text style={styles.kicker}>Passenger home</Text>
        <Text style={styles.title}>Find your next ride</Text>
        <Text style={styles.subtitle}>
          Browse trips, match your direction, and join a seat in seconds.
        </Text>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>What you can do</Text>
          <Text style={styles.cardText}>Search trips, view route matches, book seats, and track the ride live.</Text>
        </View>
        <Pressable style={styles.button}>
          <Text style={styles.buttonText}>Explore trips</Text>
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
  card: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 18,
    gap: 8,
  },
  cardTitle: { color: colors.text, fontWeight: "700" },
  cardText: { color: colors.mutedText },
  button: {
    marginTop: 4,
    backgroundColor: colors.text,
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: "center",
  },
  buttonText: { color: "#FFFFFF", fontWeight: "700" },
});
