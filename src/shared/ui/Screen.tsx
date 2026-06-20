import React, { PropsWithChildren } from "react";
import { View, StyleSheet } from "react-native";
import { colors } from "@/shared/theme/colors";

export function Screen({ children }: PropsWithChildren) {
  return <View style={styles.container}>{children}</View>;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
});
