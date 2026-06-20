import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useAuth } from "@/features/auth/context/AuthProvider";
import { colors } from "@/shared/theme/colors";
import { Screen } from "@/shared/ui/Screen";
import { TextField } from "@/shared/ui/TextField";
import { createTrip } from "../services/tripWriter.service";

export function CreateTripScreen() {
  const { user, profile, driverProfile } = useAuth();
  const [routeName, setRouteName] = React.useState("");
  const [notes, setNotes] = React.useState("");
  const [seatsAvailable, setSeatsAvailable] = React.useState("3");
  const [originLatitude, setOriginLatitude] = React.useState("");
  const [originLongitude, setOriginLongitude] = React.useState("");
  const [destinationLatitude, setDestinationLatitude] = React.useState("");
  const [destinationLongitude, setDestinationLongitude] = React.useState("");
  const [departureTime, setDepartureTime] = React.useState(
    String(Date.now() + 30 * 60 * 1000)
  );
  const [error, setError] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState(false);

  if (profile?.role !== "driver") {
    return (
      <Screen>
        <View style={styles.container}>
          <Text style={styles.title}>Driver access required</Text>
          <Text style={styles.subtitle}>
            Only verified drivers can publish route-based trips.
          </Text>
        </View>
      </Screen>
    );
  }

  const handleCreateTrip = async () => {
    if (!user || !profile) {
      return;
    }

    const parsedOriginLatitude = Number(originLatitude);
    const parsedOriginLongitude = Number(originLongitude);
    const parsedDestinationLatitude = Number(destinationLatitude);
    const parsedDestinationLongitude = Number(destinationLongitude);
    const parsedDepartureTime = Number(departureTime);
    const parsedSeatsAvailable = Number(seatsAvailable);

    if (
      !routeName.trim() ||
      Number.isNaN(parsedOriginLatitude) ||
      Number.isNaN(parsedOriginLongitude) ||
      Number.isNaN(parsedDestinationLatitude) ||
      Number.isNaN(parsedDestinationLongitude) ||
      Number.isNaN(parsedDepartureTime) ||
      Number.isNaN(parsedSeatsAvailable)
    ) {
      setError("Fill in every field with valid numeric coordinates and a departure timestamp.");
      return;
    }

    setBusy(true);
    setError(null);

    try {
      await createTrip({
        driverId: user.uid,
        driverName: profile.displayName ?? driverProfile?.fullName ?? "Driver",
        origin: {
          latitude: parsedOriginLatitude,
          longitude: parsedOriginLongitude,
        },
        destination: {
          latitude: parsedDestinationLatitude,
          longitude: parsedDestinationLongitude,
        },
        route: [
          { latitude: parsedOriginLatitude, longitude: parsedOriginLongitude },
          { latitude: parsedDestinationLatitude, longitude: parsedDestinationLongitude },
        ],
        departureTime: parsedDepartureTime,
        seatsAvailable: parsedSeatsAvailable,
        routeName,
        car: driverProfile?.car,
        notes,
      });
    } catch (creationError) {
      setError(creationError instanceof Error ? creationError.message : "Failed to create trip");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen>
      <View style={styles.container}>
        <Text style={styles.title}>Publish a trip</Text>
        <Text style={styles.subtitle}>
          Drivers define a route, departure time, seat count, and live location permissions.
        </Text>
        <TextField label="Route name" value={routeName} onChangeText={setRouteName} />
        <TextField label="Origin latitude" value={originLatitude} onChangeText={setOriginLatitude} keyboardType="decimal-pad" />
        <TextField label="Origin longitude" value={originLongitude} onChangeText={setOriginLongitude} keyboardType="decimal-pad" />
        <TextField label="Destination latitude" value={destinationLatitude} onChangeText={setDestinationLatitude} keyboardType="decimal-pad" />
        <TextField label="Destination longitude" value={destinationLongitude} onChangeText={setDestinationLongitude} keyboardType="decimal-pad" />
        <TextField
          label="Departure time (unix ms)"
          value={departureTime}
          onChangeText={setDepartureTime}
          keyboardType="numeric"
        />
        <TextField label="Seats available" value={seatsAvailable} onChangeText={setSeatsAvailable} keyboardType="numeric" />
        <TextField label="Notes" value={notes} onChangeText={setNotes} multiline />
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <Pressable style={[styles.action, busy && styles.disabledAction]} onPress={handleCreateTrip} disabled={busy}>
          <Text style={styles.actionText}>{busy ? "Publishing..." : "Publish trip"}</Text>
        </Pressable>
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
  error: {
    color: colors.danger,
  },
  action: {
    marginTop: 8,
    backgroundColor: colors.primary,
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: "center",
  },
  actionText: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
  disabledAction: {
    opacity: 0.7,
  },
});
