import React from "react";
import { StyleSheet, Text, View } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "@/navigation/RootNavigator";
import { colors } from "@/shared/theme/colors";
import { Screen } from "@/shared/ui/Screen";
import { observeLiveLocation } from "../services/liveTracking.service";

type LiveTripScreenProps = NativeStackScreenProps<RootStackParamList, "LiveTrip">;

export function LiveTripScreen({ route }: LiveTripScreenProps) {
  const [location, setLocation] = React.useState<{ latitude: number; longitude: number } | null>(
    null
  );

  React.useEffect(() => {
    return observeLiveLocation(route.params.tripId, setLocation);
  }, [route.params.tripId]);

  return (
    <Screen>
      <View style={styles.container}>
        <Text style={styles.title}>Live tracking</Text>
        <Text style={styles.subtitle}>
          Driver location updates will stream through Realtime Database and render on the route map.
        </Text>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Trip</Text>
          <Text style={styles.cardText}>{route.params.tripId}</Text>
          <Text style={styles.cardTitle}>Current location</Text>
          <Text style={styles.cardText}>
            {location
              ? `${location.latitude.toFixed(6)}, ${location.longitude.toFixed(6)}`
              : "Waiting for driver updates..."}
          </Text>
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    justifyContent: "center",
    gap: 12,
  },
  title: {
    color: colors.text,
    fontSize: 28,
    fontWeight: "800",
  },
  subtitle: {
    color: colors.mutedText,
    lineHeight: 22,
  },
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 20,
    padding: 16,
    gap: 8,
  },
  cardTitle: {
    color: colors.text,
    fontWeight: "700",
  },
  cardText: {
    color: colors.mutedText,
  },
});
