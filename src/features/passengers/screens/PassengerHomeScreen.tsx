import React from "react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from "react-native-maps";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "@/navigation/RootNavigator";
import { observePublishedTrips } from "@/features/trips/services/trips.service";
import type { Trip } from "@/features/trips/types";
import { colors } from "@/shared/theme/colors";
import { Screen } from "@/shared/ui/Screen";
import { TextField } from "@/shared/ui/TextField";
import { PrimaryButton } from "@/shared/ui/PrimaryButton";
import { SectionCard } from "@/shared/ui/SectionCard";
import type { LatLng } from "@/shared/types/location";
import { haversineDistanceMeters, polylineWithinRadius } from "@/shared/utils/geo";

type TripMatch = {
  trip: Trip;
  estimatedPrice: number;
  distanceFromRouteMeters: number;
};

const ROUTE_MATCH_RADIUS_METERS = 1_500;
const BASE_FARE = 25;
const PRICE_PER_KM = 4.5;

export function PassengerHomeScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [currentLocationInput, setCurrentLocationInput] = React.useState("");
  const [destinationInput, setDestinationInput] = React.useState("");
  const [trips, setTrips] = React.useState<Trip[]>([]);
  const [matches, setMatches] = React.useState<TripMatch[]>([]);
  const [currentLocation, setCurrentLocation] = React.useState<LatLng | null>(null);
  const [destination, setDestination] = React.useState<LatLng | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [searched, setSearched] = React.useState(false);

  React.useEffect(() => observePublishedTrips(setTrips), []);

  const handleFindTrips = () => {
    const parsedCurrentLocation = parseLatLng(currentLocationInput);
    const parsedDestination = parseLatLng(destinationInput);

    if (!parsedCurrentLocation || !parsedDestination) {
      setError("Enter both locations as latitude,longitude. Example: 30.0444,31.2357");
      setMatches([]);
      setSearched(true);
      return;
    }

    const routeDistanceMeters = haversineDistanceMeters(parsedCurrentLocation, parsedDestination);
    const nextMatches = trips
      .map((trip) => {
        const pickupDistance = nearestRouteDistanceMeters(trip.route, parsedCurrentLocation);
        const destinationDistance = nearestRouteDistanceMeters(trip.route, parsedDestination);
        const routeCompatible =
          polylineWithinRadius(trip.route, parsedCurrentLocation, ROUTE_MATCH_RADIUS_METERS) &&
          polylineWithinRadius(trip.route, parsedDestination, ROUTE_MATCH_RADIUS_METERS);

        return {
          trip,
          estimatedPrice: estimatePrice(routeDistanceMeters),
          distanceFromRouteMeters: Math.min(pickupDistance, destinationDistance),
          routeCompatible,
        };
      })
      .filter((match) => match.routeCompatible && match.trip.seatsAvailable > match.trip.seatsBooked)
      .sort((left, right) => left.distanceFromRouteMeters - right.distanceFromRouteMeters)
      .map(({ routeCompatible, ...match }) => match);

    setCurrentLocation(parsedCurrentLocation);
    setDestination(parsedDestination);
    setMatches(nextMatches);
    setError(null);
    setSearched(true);
  };

  const mapRegion = currentLocation ?? trips[0]?.origin ?? { latitude: 30.0444, longitude: 31.2357 };
  const previewTrip = matches[0]?.trip ?? trips[0];

  return (
    <Screen>
      <FlatList
        data={matches}
        keyExtractor={(item) => item.trip.id}
        contentContainerStyle={styles.content}
        ListHeaderComponent={
          <View style={styles.header}>
            <View>
              <Text style={styles.kicker}>Passenger</Text>
              <Text style={styles.title}>Where to?</Text>
            </View>
            <SectionCard style={styles.searchPanel}>
              <TextField
                label="Current location"
                value={currentLocationInput}
                onChangeText={setCurrentLocationInput}
                placeholder="30.0444,31.2357"
                keyboardType="numbers-and-punctuation"
              />
              <TextField
                label="Destination"
                value={destinationInput}
                onChangeText={setDestinationInput}
                placeholder="30.0626,31.2497"
                keyboardType="numbers-and-punctuation"
              />
              {error ? <Text style={styles.error}>{error}</Text> : null}
              <PrimaryButton title="Find Trips" onPress={handleFindTrips} />
            </SectionCard>
            <View style={styles.mapShell}>
              <MapView
                provider={PROVIDER_GOOGLE}
                style={styles.map}
                initialRegion={{
                  latitude: mapRegion.latitude,
                  longitude: mapRegion.longitude,
                  latitudeDelta: 0.08,
                  longitudeDelta: 0.08,
                }}
                region={{
                  latitude: mapRegion.latitude,
                  longitude: mapRegion.longitude,
                  latitudeDelta: 0.08,
                  longitudeDelta: 0.08,
                }}
              >
                {currentLocation ? <Marker coordinate={currentLocation} title="Pickup" pinColor={colors.mapPassenger} /> : null}
                {destination ? <Marker coordinate={destination} title="Destination" pinColor={colors.accent} /> : null}
                {previewTrip?.route?.length ? (
                  <Polyline coordinates={previewTrip.route} strokeColor={colors.mapRoute} strokeWidth={4} />
                ) : null}
                {previewTrip ? <Marker coordinate={previewTrip.origin} title={previewTrip.driverName} pinColor={colors.mapDriver} /> : null}
              </MapView>
            </View>
            <Text style={styles.sectionTitle}>{searched ? "Available trips" : "Nearby published trips"}</Text>
          </View>
        }
        renderItem={({ item }) => (
          <Pressable
            style={styles.tripCard}
            onPress={() => navigation.navigate("TripDetails", { tripId: item.trip.id })}
          >
            <View style={styles.cardTopRow}>
              <View>
                <Text style={styles.driverName}>{item.trip.driverName}</Text>
                <Text style={styles.carInfo}>{formatCarInfo(item.trip)}</Text>
              </View>
              <Text style={styles.price}>EGP {item.estimatedPrice}</Text>
            </View>
            <View style={styles.metaRow}>
              <Text style={styles.metaText}>
                Seats {Math.max(item.trip.seatsAvailable - item.trip.seatsBooked, 0)}
              </Text>
              <Text style={styles.metaText}>{formatDistance(item.distanceFromRouteMeters)} from route</Text>
            </View>
          </Pressable>
        )}
        ListEmptyComponent={
          <SectionCard style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>{searched ? "No matching trips" : "Search for a route"}</Text>
            <Text style={styles.emptyText}>
              {searched
                ? "Try a nearby pickup or destination point to find more route matches."
                : "Enter your pickup and destination coordinates to see available drivers."}
            </Text>
          </SectionCard>
        }
      />
    </Screen>
  );
}

function parseLatLng(value: string): LatLng | null {
  const [latitudeRaw, longitudeRaw] = value.split(",").map((part) => part.trim());
  const latitude = Number(latitudeRaw);
  const longitude = Number(longitudeRaw);

  if (
    Number.isNaN(latitude) ||
    Number.isNaN(longitude) ||
    latitude < -90 ||
    latitude > 90 ||
    longitude < -180 ||
    longitude > 180
  ) {
    return null;
  }

  return { latitude, longitude };
}

function nearestRouteDistanceMeters(route: LatLng[], point: LatLng) {
  if (!route.length) {
    return Number.MAX_SAFE_INTEGER;
  }

  return Math.min(...route.map((routePoint) => haversineDistanceMeters(routePoint, point)));
}

function estimatePrice(distanceMeters: number) {
  return Math.max(BASE_FARE, Math.round(BASE_FARE + (distanceMeters / 1_000) * PRICE_PER_KM));
}

function formatDistance(distanceMeters: number) {
  if (distanceMeters >= 1_000) {
    return `${(distanceMeters / 1_000).toFixed(1)} km`;
  }

  return `${Math.round(distanceMeters)} m`;
}

function formatCarInfo(trip: Trip) {
  const car = trip.car;
  if (!car) {
    return trip.routeName ?? "Car details pending";
  }

  return [car.color, car.brand, car.model, car.licensePlateNumber].filter(Boolean).join(" ");
}

const styles = StyleSheet.create({
  content: {
    padding: 18,
    gap: 12,
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
    fontSize: 34,
    fontWeight: "800",
    lineHeight: 40,
  },
  searchPanel: {
    gap: 12,
  },
  error: {
    color: colors.danger,
  },
  mapShell: {
    height: 220,
    borderRadius: 8,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  map: {
    flex: 1,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: "800",
  },
  tripCard: {
    padding: 16,
    borderRadius: 8,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 14,
  },
  cardTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  driverName: {
    color: colors.text,
    fontSize: 17,
    fontWeight: "800",
  },
  carInfo: {
    color: colors.mutedText,
    marginTop: 4,
  },
  price: {
    color: colors.text,
    fontSize: 17,
    fontWeight: "800",
  },
  metaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  metaText: {
    color: colors.primary,
    fontWeight: "700",
  },
  emptyCard: {
    gap: 6,
  },
  emptyTitle: {
    color: colors.text,
    fontWeight: "800",
  },
  emptyText: {
    color: colors.mutedText,
    lineHeight: 20,
  },
});
