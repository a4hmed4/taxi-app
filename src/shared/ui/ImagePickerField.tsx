import React from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { colors } from "@/shared/theme/colors";

type ImagePickerFieldProps = {
  label: string;
  value: string | null;
  onChange: (uri: string) => void;
};

export function ImagePickerField({ label, value, onChange }: ImagePickerFieldProps) {
  const handlePick = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.85,
      aspect: [1, 1],
    });

    if (!result.canceled && result.assets[0]?.uri) {
      onChange(result.assets[0].uri);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <Pressable style={styles.picker} onPress={handlePick}>
        {value ? <Image source={{ uri: value }} style={styles.image} /> : <View style={styles.placeholder} />}
        <Text style={styles.cta}>{value ? "Change photo" : "Choose photo"}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 8,
  },
  label: {
    color: colors.text,
    fontSize: 14,
    fontWeight: "600",
  },
  picker: {
    alignItems: "center",
    gap: 12,
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  image: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: colors.background,
  },
  placeholder: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: "#DCE6F0",
  },
  cta: {
    color: colors.primary,
    fontWeight: "700",
  },
});
