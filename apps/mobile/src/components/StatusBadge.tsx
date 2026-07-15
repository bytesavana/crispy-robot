import { StyleSheet, Text } from "react-native";

import { colors, typography } from "@/theme";

type StatusBadgeProps = {
  label: string;
};

export function StatusBadge({ label }: StatusBadgeProps) {
  return <Text style={styles.label}>{label}</Text>;
}

const styles = StyleSheet.create({
  label: {
    ...typography.bodySmall,
    color: colors.primary,
    fontWeight: "600",
  },
});
