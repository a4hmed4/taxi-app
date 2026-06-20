import React, { useEffect, useState } from "react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useAuth } from "@/features/auth/context/AuthProvider";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "@/navigation/RootNavigator";
import { colors } from "@/shared/theme/colors";
import { Screen } from "@/shared/ui/Screen";
import type { Trip } from "../types";
import { observePublishedTrips } from "../services/trips.service";

export function HomeScreen() {
  const { profile } = useAuth();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [trips, setTrips] = useState<Trip[]>([]);

  useEffect(() => observePublishedTrips(setTrips), []);

  return (
    <Screen>
      <View style={styles.header}>
        <Text style={styles.title}>
          {profile?.role === "driver" ? "Driver dashboard" : "Available trips"}
        </Text>
        <Text style={styles.subtitle}>
          {profile?.role === "driver"
            ? "Publish routes, manage passengers, and monitor live tracking."
            : "Matched by direction and route proximity."}
        </Text>
        {profile?.role === "driver" ? (
          <Pressable style={styles.primaryAction} onPress={() => navigation.navigate("CreateTrip")}>
            <Text style={styles.primaryActionText}>Publish trip</Text>
          </Pressable>
        ) : null}
      </View>
      <FlatList
        data={trips}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <Pressable style={styles.card} onPress={() => navigation.navigate("TripDetails", { tripId: item.id })}>
            <Text style={styles.cardTitle}>{item.routeName ?? "Trip"}</Text>
            <Text style={styles.cardText}>{item.driverName}</Text>
            <Text style={styles.meta}>
              Seats: {item.seatsBooked}/{item.seatsAvailable}
            </Text>
          </Pressable>
        )}
        ListEmptyComponent={<Text style={styles.empty}>No active trips yet.</Text>}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    padding: 24,
    gap: 8,
  },
  title: {
    color: colors.text,
    fontSize: 28,
    fontWeight: "800",
  },
  subtitle: {
    color: colors.mutedText,
  },
  list: {
    paddingHorizontal: 24,
    paddingBottom: 24,
    gap: 12,
  },
  card: {
    padding: 18,
    backgroundColor: colors.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 6,
  },
  cardTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "700",
  },
  cardText: {
    color: colors.mutedText,
  },
  meta: {
    color: colors.primary,
    fontWeight: "600",
  },
  primaryAction: {
    backgroundColor: colors.primary,
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 8,
  },
  primaryActionText: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
  empty: {
    color: colors.mutedText,
    textAlign: "center",
    paddingTop: 40,
  },
});
