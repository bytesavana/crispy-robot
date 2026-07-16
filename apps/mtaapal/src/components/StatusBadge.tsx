import { StyleSheet, Text, View } from "react-native";

import { colors, radii, spacing, typography } from "@/theme";

type StatusTone = "neutral" | "info" | "success" | "danger";

type StatusBadgeProps = {
  label: string;
  tone?: StatusTone;
};

export function StatusBadge({ label, tone }: StatusBadgeProps) {
  if (!tone) {
    return <Text style={styles.label}>{label}</Text>;
  }

  return (
    <View style={[styles.pill, styles[tone]]}>
      <Text style={[styles.pillLabel, tonePillTextStyles[tone]]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  label: {
    ...typography.bodySmall,
    color: colors.primary,
    fontWeight: "600",
  },
  pill: {
    alignSelf: "flex-start",
    borderRadius: radii.pill,
    paddingVertical: spacing.xs / 2,
    paddingHorizontal: spacing.sm,
  },
  pillLabel: {
    ...typography.label,
    fontWeight: "600",
  },
  neutral: {
    backgroundColor: colors.border,
  },
  info: {
    backgroundColor: colors.accentBlue,
  },
  success: {
    backgroundColor: colors.accentPeach,
  },
  danger: {
    backgroundColor: colors.dangerBackground,
  },
});

const tonePillTextStyles = StyleSheet.create({
  neutral: { color: colors.textMuted },
  info: { color: colors.primaryDark },
  success: { color: colors.success },
  danger: { color: colors.danger },
});
