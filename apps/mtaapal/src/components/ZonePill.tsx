import { StyleSheet, Text, View } from "react-native";

import { colors, radii, spacing, typography } from "@/theme";

type ZonePillProps = {
  label: string;
};

export function ZonePill({ label }: ZonePillProps) {
  return (
    <View style={styles.pill}>
      <View style={styles.dot} />
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "center",
    backgroundColor: colors.accentBlue,
    borderRadius: radii.pill,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    gap: spacing.xs,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.primary,
  },
  label: {
    ...typography.bodySmall,
    color: colors.text,
  },
});
