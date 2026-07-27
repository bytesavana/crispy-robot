import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";

import type { ServiceTaskLineItem } from "@/lib/api/types";
import { formatKes, formatQuantity, lineStateLabel } from "@/lib/format";
import { colors, radii, spacing, typography } from "@/theme";

import { StatusBadge } from "./StatusBadge";

type LineItemRowProps = {
  item: ServiceTaskLineItem;
  onPress?: () => void;
};

/**
 * One cart line. Quoted and actual are shown side by side rather than one replacing the other:
 * QuotedUnitPrice is never overwritten server-side precisely so the number the customer agreed to
 * stays visible next to what was really paid, and that's the comparison a runner is making.
 */
export function LineItemRow({ item, onPress }: LineItemRowProps) {
  const state = lineStateLabel(item.outcome, item.approval);
  const quotedTotal = item.quotedUnitPrice * item.quantity;
  const actualUnit = item.actualUnitPrice;
  const actualQuantity = item.actualQuantity ?? item.quantity;
  const hasActual = actualUnit !== null;

  return (
    <Pressable
      accessibilityRole={onPress ? "button" : undefined}
      onPress={onPress}
      disabled={!onPress}
      style={({ pressed }) => [styles.row, pressed && onPress && styles.pressed]}
    >
      <View style={styles.body}>
        <Text style={styles.name} numberOfLines={2}>
          {item.displayName}
        </Text>
        <Text style={styles.meta}>
          {formatQuantity(item.quantity)} × {formatKes(item.quotedUnitPrice)}
          {item.packSize ? ` · ${item.packSize}` : ""}
        </Text>

        {item.proposedSubstituteDisplayName ? (
          <Text style={styles.substitute} numberOfLines={2}>
            Proposed: {item.proposedSubstituteDisplayName}
            {item.proposedSubstituteUnitPrice !== null ? ` at ${formatKes(item.proposedSubstituteUnitPrice)}` : ""}
          </Text>
        ) : null}

        <View style={styles.footer}>
          <StatusBadge label={state.label} tone={state.tone} />
          {onPress ? <Ionicons name="chevron-forward" size={16} color={colors.textMuted} /> : null}
        </View>
      </View>

      <View style={styles.prices}>
        <Text style={[styles.quoted, hasActual && styles.quotedSuperseded]}>{formatKes(quotedTotal)}</Text>
        {hasActual ? <Text style={styles.actual}>{formatKes(actualUnit * actualQuantity)}</Text> : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  pressed: {
    backgroundColor: colors.backgroundAlt,
  },
  body: {
    flex: 1,
    gap: spacing.xs,
  },
  name: {
    ...typography.body,
    color: colors.text,
    fontWeight: "600",
  },
  meta: {
    ...typography.bodySmall,
    color: colors.textMuted,
  },
  substitute: {
    ...typography.bodySmall,
    color: colors.warning,
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: spacing.xs,
  },
  prices: {
    alignItems: "flex-end",
    gap: spacing.xs,
  },
  quoted: {
    ...typography.numeric,
    color: colors.text,
    fontWeight: "600",
  },
  quotedSuperseded: {
    color: colors.textMuted,
    textDecorationLine: "line-through",
    fontWeight: "400",
    fontSize: 14,
  },
  actual: {
    ...typography.numeric,
    color: colors.text,
    fontWeight: "700",
  },
});
