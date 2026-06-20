import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors } from "@/shared/theme/colors";
import { Screen } from "@/shared/ui/Screen";
import { useAuth } from "../context/AuthProvider";
import { updateUserRole } from "../services/auth.service";

const roles = [
  {
    key: "driver",
    title: "Driver",
    description: "Publish route-based trips and track passenger pickups.",
  },
  {
    key: "passenger",
    title: "Passenger",
    description: "Discover matching trips and request seats instantly.",
  },
] as const;

export function RoleSelectScreen() {
  const { user } = useAuth();
  const [savingRole, setSavingRole] = React.useState<string | null>(null);

  const handleRoleSelect = async (roleKey: (typeof roles)[number]["key"]) => {
    if (!user) {
      return;
    }

    setSavingRole(roleKey);

    try {
      await updateUserRole(user.uid, roleKey);
      await user.getIdToken(true);
    } finally {
      setSavingRole(null);
    }
  };

  return (
    <Screen>
      <View style={styles.container}>
        <Text style={styles.title}>Choose your role</Text>
        <Text style={styles.subtitle}>The app adapts permissions, screens, and flows based on your role.</Text>
        {roles.map((role) => (
          <Pressable key={role.key} style={styles.card} onPress={() => handleRoleSelect(role.key)}>
            <Text style={styles.cardTitle}>{role.title}</Text>
            <Text style={styles.cardText}>{role.description}</Text>
            {savingRole === role.key ? <Text style={styles.cardMeta}>Saving...</Text> : null}
          </Pressable>
        ))}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    gap: 16,
    justifyContent: "center",
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: colors.text,
  },
  subtitle: {
    color: colors.mutedText,
    lineHeight: 22,
    marginBottom: 8,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 8,
  },
  cardTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: "700",
  },
  cardText: {
    color: colors.mutedText,
  },
  cardMeta: {
    color: colors.primary,
    fontWeight: "600",
  },
});
