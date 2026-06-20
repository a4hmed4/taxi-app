import React from "react";
import { NavigationContainer, DefaultTheme } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useAuth } from "@/features/auth/context/AuthProvider";
import { LoadingScreen } from "@/shared/ui/LoadingScreen";
import { LoginScreen } from "@/features/auth/screens/LoginScreen";
import { OTPVerificationScreen } from "@/features/auth/screens/OTPVerificationScreen";
import { RoleSelectionScreen } from "@/features/auth/screens/RoleSelectionScreen";
import { OnboardingDriverScreen } from "@/features/auth/screens/OnboardingDriverScreen";
import { PassengerHomeScreen } from "@/features/passengers/screens/PassengerHomeScreen";
import { DriverHomeScreen } from "@/features/drivers/screens/DriverHomeScreen";
import { TripDetailsScreen } from "@/features/trips/screens/TripDetailsScreen";
import { CreateTripScreen } from "@/features/trips/screens/CreateTripScreen";
import { LiveTripScreen } from "@/features/tracking/screens/LiveTripScreen";
import { colors } from "@/shared/theme/colors";

export type RootStackParamList = {
  Login: undefined;
  OTPVerification: undefined;
  RoleSelection: undefined;
  DriverOnboarding: undefined;
  DriverHome: undefined;
  PassengerHome: undefined;
  TripDetails: { tripId: string };
  CreateTrip: undefined;
  LiveTrip: { tripId: string };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  const { user, profile, driverProfile, loading, confirmationResult } = useAuth();

  if (loading) {
    return <LoadingScreen label="Preparing your ride experience..." />;
  }

  return (
    <NavigationContainer
      theme={{
        ...DefaultTheme,
        colors: {
          ...DefaultTheme.colors,
          background: colors.background,
          card: colors.surface,
          text: colors.text,
          border: colors.border,
          primary: colors.primary,
        },
      }}
    >
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!user ? (
          confirmationResult ? (
            <Stack.Screen name="OTPVerification" component={OTPVerificationScreen} />
          ) : (
            <Stack.Screen name="Login" component={LoginScreen} />
          )
        ) : !profile?.role ? (
          <Stack.Screen name="RoleSelection" component={RoleSelectionScreen} />
        ) : profile.role === "driver" && !driverProfile?.onboardingCompleted ? (
          <Stack.Screen name="DriverOnboarding" component={OnboardingDriverScreen} />
        ) : profile.role === "driver" ? (
          <>
            <Stack.Screen name="DriverHome" component={DriverHomeScreen} />
            <Stack.Screen name="TripDetails" component={TripDetailsScreen} />
            <Stack.Screen name="CreateTrip" component={CreateTripScreen} />
            <Stack.Screen name="LiveTrip" component={LiveTripScreen} />
          </>
        ) : profile.role === "passenger" ? (
          <>
            <Stack.Screen name="PassengerHome" component={PassengerHomeScreen} />
            <Stack.Screen name="TripDetails" component={TripDetailsScreen} />
            <Stack.Screen name="LiveTrip" component={LiveTripScreen} />
          </>
        ) : (
          null
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
