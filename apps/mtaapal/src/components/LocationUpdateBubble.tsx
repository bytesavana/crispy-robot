import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";

import { colors, radii, spacing, typography } from "@/theme";

export function LocationUpdateBubble({ text }: { text: string }) {
  return (
    <View style={styles.container}>
      <Ionicons name="location" size={14} color={colors.primary} />
      <Text style={styles.text}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "center",
    gap: spacing.xs,
    backgroundColor: colors.accentBlue,
    borderRadius: radii.pill,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    marginVertical: spacing.xs,
    maxWidth: "90%",
  },
  text: {
    ...typography.bodySmall,
    color: colors.text,
  },
});
