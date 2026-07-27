import { Pressable, StyleSheet, Text, View } from "react-native";

import { formatKes } from "@/lib/format";
import type { StatusTone } from "@/theme";
import { colors, radii, spacing, typography } from "@/theme";

import { StatusBadge } from "./StatusBadge";

type JobSummaryRowProps = {
  title: string;
  subtitle: string;
  price: number;
  status?: { label: string; tone: StatusTone };
  onPress: () => void;
};

/** A financial-flavoured job row — Earnings' list and the Calendar's "Recent errands" section both
 * use this, since both are "here's what this job was worth" rather than "here's what to do about
 * it" (that's JobCard). Status is optional: recent errands are inherently done and don't show one. */
export function JobSummaryRow({ title, subtitle, price, status, onPress }: JobSummaryRowProps) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}
    >
      <View style={styles.text}>
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
        <Text style={styles.subtitle} numberOfLines={1}>
          {subtitle}
        </Text>
      </View>
      <View style={styles.amountColumn}>
        <Text style={styles.price}>{formatKes(price)}</Text>
        {status ? <StatusBadge label={status.label} tone={status.tone} variant="plain" /> : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.md,
  },
  pressed: {
    backgroundColor: colors.backgroundAlt,
  },
  text: {
    flex: 1,
    gap: 2,
  },
  title: {
    ...typography.title,
    color: colors.text,
  },
  subtitle: {
    ...typography.bodySmall,
    color: colors.textMuted,
  },
  amountColumn: {
    alignItems: "flex-end",
    gap: 2,
  },
  price: {
    ...typography.numeric,
    fontWeight: "700",
    color: colors.text,
  },
});
