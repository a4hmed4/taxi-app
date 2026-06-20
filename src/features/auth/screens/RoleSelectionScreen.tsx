import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors } from "@/shared/theme/colors";
import { Screen } from "@/shared/ui/Screen";
import { useAuth } from "../context/AuthProvider";
import type { UserRole } from "../types";

const roles: Array<{ key: UserRole; title: string; description: string }> = [
  {
    key: "driver",
    title: "Driver",
    description: "Publish routes, accept passengers, and manage trips.",
  },
  {
    key: "passenger",
    title: "Passenger",
    description: "Join matching trips and ride in the same direction.",
  },
];

export function RoleSelectionScreen() {
  const { setRole } = useAuth();
  const [selectedRole, setSelectedRole] = React.useState<UserRole | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const handleChooseRole = async (role: UserRole) => {
    setSelectedRole(role);
    setError(null);

    try {
      await setRole(role);
    } catch (roleError) {
      setError(roleError instanceof Error ? roleError.message : "Could not save role");
    } finally {
      setSelectedRole(null);
    }
  };

  return (
    <Screen>
      <View style={styles.container}>
        <Text style={styles.kicker}>Next step</Text>
        <Text style={styles.title}>Choose your role</Text>
        <Text style={styles.subtitle}>We’ll tailor the app experience based on how you use the platform.</Text>
        {roles.map((role) => (
          <Pressable key={role.key} style={styles.card} onPress={() => handleChooseRole(role.key)}>
            <Text style={styles.cardTitle}>{role.title}</Text>
            <Text style={styles.cardText}>{role.description}</Text>
            {selectedRole === role.key ? <Text style={styles.cardMeta}>Saving...</Text> : null}
          </Pressable>
        ))}
        {error ? <Text style={styles.error}>{error}</Text> : null}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, justifyContent: "center", gap: 14 },
  kicker: { color: colors.primary, fontWeight: "700", textTransform: "uppercase", letterSpacing: 1.2 },
  title: { color: colors.text, fontSize: 34, fontWeight: "800", lineHeight: 40 },
  subtitle: { color: colors.mutedText, lineHeight: 22, marginBottom: 8 },
  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 20,
    padding: 18,
    gap: 8,
  },
  cardTitle: { color: colors.text, fontSize: 18, fontWeight: "700" },
  cardText: { color: colors.mutedText },
  cardMeta: { color: colors.primary, fontWeight: "600" },
  error: { color: colors.danger },
});
