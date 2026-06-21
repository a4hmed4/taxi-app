import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  TextInput,
  FlatList,
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  Keyboard,
} from "react-native";
import { getPlacePredictions, getPlaceDetails } from "@/services/google-maps/places.service";
import type { LocationAddress } from "@/features/drivers/types";

export interface PlacesPrediction {
  placeId: string;
  mainText: string;
  secondaryText: string;
  fullText: string;
}

interface LocationAutocompleteProps {
  placeholder: string;
  onLocationSelected: (location: LocationAddress) => void;
  editable?: boolean;
}

export function LocationAutocomplete({
  placeholder,
  onLocationSelected,
  editable = true,
}: LocationAutocompleteProps) {
  const [searchText, setSearchText] = useState("");
  const [predictions, setPredictions] = useState<PlacesPrediction[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState("");
  const [showPredictions, setShowPredictions] = useState(false);

  // Debounce search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchText.trim()) {
        fetchPredictions(searchText);
      } else {
        setPredictions([]);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchText]);

  const fetchPredictions = async (input: string) => {
    if (!input.trim()) return;

    setLoading(true);
    try {
      const results = await getPlacePredictions(input);
      setPredictions(results);
      setShowPredictions(true);
    } catch (error) {
      console.error("Error fetching predictions:", error);
      setPredictions([]);
    } finally {
      setLoading(false);
    }
  };

  const handlePredictionSelect = useCallback(
    async (prediction: PlacesPrediction) => {
      setLoading(true);
      try {
        const details = await getPlaceDetails(prediction.placeId);
        setSelectedAddress(details.address);
        setSearchText(details.address);
        onLocationSelected(details);
        setPredictions([]);
        setShowPredictions(false);
        Keyboard.dismiss();
      } catch (error) {
        console.error("Error fetching place details:", error);
      } finally {
        setLoading(false);
      }
    },
    [onLocationSelected]
  );

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        placeholder={placeholder}
        value={searchText}
        onChangeText={setSearchText}
        editable={editable}
        placeholderTextColor="#999"
      />
      {loading && <ActivityIndicator size="small" color="#007AFF" style={styles.loader} />}
      {showPredictions && predictions.length > 0 && (
        <View style={styles.predictionsContainer}>
          <FlatList
            data={predictions}
            keyExtractor={(item) => item.placeId}
            scrollEnabled={false}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.predictionItem}
                onPress={() => handlePredictionSelect(item)}
              >
                <View>
                  <Text style={styles.mainText} numberOfLines={1}>
                    {item.mainText}
                  </Text>
                  {item.secondaryText && (
                    <Text style={styles.secondaryText} numberOfLines={1}>
                      {item.secondaryText}
                    </Text>
                  )}
                </View>
              </TouchableOpacity>
            )}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "relative",
    width: "100%",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    backgroundColor: "#fff",
  },
  loader: {
    position: "absolute",
    right: 12,
    top: 12,
  },
  predictionsContainer: {
    position: "absolute",
    top: 50,
    left: 0,
    right: 0,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#ddd",
    borderTopWidth: 0,
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
    maxHeight: 300,
    zIndex: 1000,
  },
  predictionItem: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  mainText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#333",
    marginBottom: 4,
  },
  secondaryText: {
    fontSize: 12,
    color: "#999",
  },
});