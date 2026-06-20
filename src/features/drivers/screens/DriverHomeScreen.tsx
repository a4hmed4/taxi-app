import React from "react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useAuth } from "@/features/auth/context/AuthProvider";
import { colors } from "@/shared/theme/colors";
import { Screen } from "@/shared/ui/Screen";
import { PrimaryButton } from "@/shared/ui/PrimaryButton";
import { SectionCard } from "@/shared/ui/SectionCard";
import type { RootStackParamList } from "@/navigation/RootNavigator";
import type { Trip } from "@/features/trips/types";
import { observeDriverTrips } from "../services/drivers.service";

export function DriverHomeScreen() {
  const { user, profile } = useAuth();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [trips, setTrips] = React.useState<Trip[]>([]);

  React.useEffect(() => {
    if (!user) {
      return;
    }

    return observeDriverTrips(user.uid, setTrips);
  }, [user]);

  const activeTrips = trips.filter((trip) => trip.status === "published" || trip.status === "in_progress");

  return (
    <Screen>
      <FlatList
        data={activeTrips}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={styles.kicker}>Driver home</Text>
            <Text style={styles.title}>Welcome, {profile?.displayName ?? "Driver"}</Text>
            <Text style={styles.subtitle}>
              Manage your active trips, track earnings, and publish new routes.
            </Text>
            <PrimaryButton title="Create Trip" onPress={() => navigation.navigate("CreateTrip")} />
            <SectionCard style={styles.summaryCard}>
              <Text style={styles.cardLabel}>Earnings summary</Text>
              <Text style={styles.summaryAmount}>EGP 0.00</Text>
              <Text style={styles.cardMuted}>Placeholder until payout integration is ready.</Text>
            </SectionCard>
            <Text style={styles.sectionTitle}>Active trips</Text>
          </View>
        }
        renderItem={({ item }) => (
          <Pressable
            style={styles.tripCard}
            onPress={() => navigation.navigate("TripDetails", { tripId: item.id })}
          >
            <View style={styles.tripTopRow}>
              <Text style={styles.tripTitle}>{item.routeName ?? "Trip"}</Text>
              <Text style={styles.tripSeats}>
                {item.seatsBooked}/{item.seatsAvailable}
              </Text>
            </View>
            <Text style={styles.tripMeta}>{item.status.replace("_", " ")}</Text>
          </Pressable>
        )}
        ListEmptyComponent={
          <SectionCard style={styles.emptyCard}>
            <Text style={styles.cardLabel}>No active trips yet</Text>
            <Text style={styles.cardMuted}>
              Create your first route to start receiving passenger bookings.
            </Text>
          </SectionCard>
        }
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: {
    padding: 24,
    gap: 14,
  },
  header: {
    gap: 14,
  },
  kicker: {
    color: colors.primary,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1.2,
  },
  title: {
    color: colors.text,
    fontSize: 32,
    fontWeight: "800",
    lineHeight: 38,
  },
  subtitle: {
    color: colors.mutedText,
    lineHeight: 22,
  },
  summaryCard: {
    gap: 6,
  },
  cardLabel: {
    color: colors.text,
    fontSize: 15,
    fontWeight: "700",
  },
  summaryAmount: {
    color: colors.primary,
    fontSize: 28,
    fontWeight: "800",
  },
  cardMuted: {
    color: colors.mutedText,
    lineHeight: 20,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: "800",
    marginTop: 4,
  },
  tripCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 20,
    padding: 18,
    gap: 8,
  },
  tripTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  tripTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "700",
  },
  tripSeats: {
    color: colors.primary,
    fontWeight: "700",
  },
  tripMeta: {
    color: colors.mutedText,
    textTransform: "capitalize",
  },
  emptyCard: {
    gap: 6,
  },
});
