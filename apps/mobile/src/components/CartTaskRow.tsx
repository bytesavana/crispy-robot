import { StyleSheet, Text, View } from "react-native";

import { StatusBadge } from "@/components/StatusBadge";
import type { CartTask, CartTaskStatus } from "@/lib/cartTypes";
import { colors, radii, spacing, typography } from "@/theme";

type CartTaskRowProps = {
  task: CartTask;
};

function cartStatusTone(status: CartTaskStatus): "neutral" | "info" | "success" | "danger" {
  switch (status) {
    case "Completed":
      return "success";
    case "Cancelled":
    case "Failed":
      return "danger";
    case "Draft":
      return "neutral";
    default:
      return "info";
  }
}

export function CartTaskRow({ task }: CartTaskRowProps) {
  const price = task.estimated_price != null ? `KES ${task.estimated_price.toLocaleString()}` : "—";
  const eta = task.estimated_eta_minutes != null ? `${task.estimated_eta_minutes} min` : "—";

  return (
    <View style={styles.row}>
      <View style={styles.header}>
        <Text style={styles.taskCode}>{task.task_code}</Text>
        <StatusBadge label={task.status} tone={cartStatusTone(task.status)} />
      </View>

      {Object.entries(task.field_values).map(([label, value]) => (
        <View key={label} style={styles.fieldRow}>
          <Text style={styles.fieldLabel}>{label}</Text>
          <Text style={styles.fieldValue}>{value}</Text>
        </View>
      ))}

      <View style={styles.footer}>
        <Text style={styles.footerText}>{price}</Text>
        <Text style={styles.footerText}>{eta}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.xs,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.xs,
  },
  taskCode: {
    ...typography.body,
    color: colors.text,
    fontWeight: "600",
  },
  fieldRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  fieldLabel: {
    ...typography.bodySmall,
    color: colors.textMuted,
  },
  fieldValue: {
    ...typography.bodySmall,
    color: colors.text,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: spacing.xs,
    paddingTop: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  footerText: {
    ...typography.bodySmall,
    color: colors.text,
    fontWeight: "600",
  },
});
