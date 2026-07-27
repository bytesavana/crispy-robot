import { StyleSheet, Text, View } from "react-native";

import { radii, spacing, statusTones, typography, type StatusTone } from "@/theme";

type StatusBadgeProps = {
  label: string;
  tone?: StatusTone;
  /** "pill" (default) is the Calendar/job-detail treatment — a coloured background. "plain" is bold
   * coloured text with no background, which is how the Earnings list shows the same statuses. */
  variant?: "pill" | "plain";
};

export function StatusBadge({ label, tone = "neutral", variant = "pill" }: StatusBadgeProps) {
  const palette = statusTones[tone];

  if (variant === "plain") {
    return <Text style={[styles.plainLabel, { color: palette.text }]}>{label}</Text>;
  }

  return (
    <View style={[styles.pill, { backgroundColor: palette.background }]}>
      <Text style={[styles.label, { color: palette.text }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    alignSelf: "flex-start",
    borderRadius: radii.pill,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm + 2,
  },
  label: {
    ...typography.bodySmall,
    fontWeight: "700",
  },
  plainLabel: {
    ...typography.bodySmall,
    fontWeight: "700",
  },
});
