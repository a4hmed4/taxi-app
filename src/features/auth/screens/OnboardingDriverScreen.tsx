import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { colors } from "@/shared/theme/colors";
import { Screen } from "@/shared/ui/Screen";
import { useAuth } from "../context/AuthProvider";
import { PrimaryButton } from "@/shared/ui/PrimaryButton";
import { SectionCard } from "@/shared/ui/SectionCard";
import { TextField } from "@/shared/ui/TextField";
import { ImagePickerField } from "@/shared/ui/ImagePickerField";
import { saveDriverProfile } from "@/features/drivers/services/drivers.service";

export function OnboardingDriverScreen() {
  const { user, profile, driverProfileLoading } = useAuth();
  const [fullName, setFullName] = React.useState(profile?.displayName ?? "");
  const [photoUri, setPhotoUri] = React.useState<string | null>(null);
  const [carBrand, setCarBrand] = React.useState("");
  const [carModel, setCarModel] = React.useState("");
  const [carColor, setCarColor] = React.useState("");
  const [licensePlateNumber, setLicensePlateNumber] = React.useState("");
  const [seats, setSeats] = React.useState("4");
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (profile?.displayName && !fullName) {
      setFullName(profile.displayName);
    }
  }, [fullName, profile?.displayName]);

  const handleContinue = async () => {
    if (!user) {
      setError("You must be signed in.");
      return;
    }

    if (
      !fullName.trim() ||
      !photoUri ||
      !carBrand.trim() ||
      !carModel.trim() ||
      !carColor.trim() ||
      !licensePlateNumber.trim() ||
      Number.isNaN(Number(seats))
    ) {
      setError("Please complete your profile, photo, and car details.");
      return;
    }

    setError(null);
    setSaving(true);

    try {
      await saveDriverProfile({
        uid: user.uid,
        phoneNumber: user.phoneNumber ?? profile?.phoneNumber ?? "",
        fullName,
        photoUri,
        car: {
          brand: carBrand,
          model: carModel,
          color: carColor,
          licensePlateNumber,
          seats: Number(seats),
        },
      });
    } catch (driverError) {
      setError(driverError instanceof Error ? driverError.message : "Onboarding failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Screen>
      <View style={styles.container}>
        <Text style={styles.kicker}>Driver setup</Text>
        <Text style={styles.title}>Complete your profile</Text>
        <Text style={styles.subtitle}>Add your details once, then start publishing trips.</Text>
        <SectionCard style={styles.card}>
          <TextField label="Full name" value={fullName} onChangeText={setFullName} />
          <ImagePickerField label="Profile picture" value={photoUri} onChange={setPhotoUri} />
        </SectionCard>
        <SectionCard style={styles.card}>
          <Text style={styles.sectionTitle}>Car details</Text>
          <TextField label="Car brand" value={carBrand} onChangeText={setCarBrand} />
          <TextField label="Model" value={carModel} onChangeText={setCarModel} />
          <TextField label="Color" value={carColor} onChangeText={setCarColor} />
          <TextField label="License plate number" value={licensePlateNumber} onChangeText={setLicensePlateNumber} />
          <TextField label="Number of seats" value={seats} onChangeText={setSeats} keyboardType="number-pad" />
        </SectionCard>
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <PrimaryButton
          title="Continue to driver app"
          onPress={handleContinue}
          loading={saving || driverProfileLoading}
        />
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
    gap: 14,
  },
  sectionTitle: { color: colors.text, fontWeight: "700", fontSize: 15 },
  error: { color: colors.danger },
});
