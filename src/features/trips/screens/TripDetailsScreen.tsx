import React from "react";
import { StyleSheet, Text, View } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "@/navigation/RootNavigator";
import { colors } from "@/shared/theme/colors";
import { Screen } from "@/shared/ui/Screen";

type TripDetailsScreenProps = NativeStackScreenProps<RootStackParamList, "TripDetails">;

export function TripDetailsScreen({ route }: TripDetailsScreenProps) {
  return (
    <Screen>
      <View style={styles.container}>
        <Text style={styles.title}>Trip details</Text>
        <Text style={styles.tripId}>{route.params.tripId}</Text>
        <Text style={styles.subtitle}>
          Route matching, seat booking, pickup/drop-off points, and payment hooks will live here.
        </Text>
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
  tripId: {
    color: colors.primary,
    fontWeight: "700",
  },
});
