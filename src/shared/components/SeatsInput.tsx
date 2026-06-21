import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  TextInput,
} from "react-native";

interface SeatsInputProps {
  value: number;
  onChange: (seats: number) => void;
  label?: string;
  minSeats?: number;
  maxSeats?: number;
}

export function SeatsInput({
  value,
  onChange,
  label = "Available Seats",
  minSeats = 1,
  maxSeats = 7,
}: SeatsInputProps) {
  const handleDecrement = () => {
    if (value > minSeats) {
      onChange(value - 1);
    }
  };

  const handleIncrement = () => {
    if (value < maxSeats) {
      onChange(value + 1);
    }
  };

  const handleTextChange = (text: string) => {
    const num = parseInt(text, 10);
    if (!isNaN(num) && num >= minSeats && num <= maxSeats) {
      onChange(num);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.inputGroup}>
        <TouchableOpacity
          style={[styles.button, value === minSeats && styles.buttonDisabled]}
          onPress={handleDecrement}
          disabled={value === minSeats}
        >
          <Text style={styles.buttonText}>−</Text>
        </TouchableOpacity>

        <TextInput
          style={styles.input}
          value={value.toString()}
          onChangeText={handleTextChange}
          keyboardType="number-pad"
          maxLength={1}
          textAlign="center"
        />

        <TouchableOpacity
          style={[styles.button, value === maxSeats && styles.buttonDisabled]}
          onPress={handleIncrement}
          disabled={value === maxSeats}
        >
          <Text style={styles.buttonText}>+</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
    color: "#333",
  },
  inputGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  button: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: "#007AFF",
    justifyContent: "center",
    alignItems: "center",
  },
  buttonDisabled: {
    backgroundColor: "#ccc",
    opacity: 0.5,
  },
  buttonText: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 18,
    fontWeight: "600",
    textAlignVertical: "center",
  },
});