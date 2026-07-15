import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";

import { StatusBadge } from "@/components/StatusBadge";
import type { CartTask, CartTaskStatus } from "@/lib/cartTypes";
import { colors, radii, spacing, typography } from "@/theme";

type CartTaskRowProps = {
  task: CartTask;
};

function humanize(key: string): string {
  return key
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

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

type IoniconName = keyof typeof Ionicons.glyphMap;

function taskIcon(taskCode: string): IoniconName {
  const code = taskCode.toLowerCase();
  if (code.includes("grocery") || code.includes("shopping")) return "cart-outline";
  if (code.includes("gas")) return "flame-outline";
  if (code.includes("water")) return "water-outline";
  if (code.includes("laundry") || code.includes("clean") || code.includes("fua")) return "shirt-outline";
  if (code.includes("food")) return "restaurant-outline";
  if (code.includes("car") || code.includes("wash")) return "car-outline";
  if (code.includes("package") || code.includes("delivery")) return "cube-outline";
  return "briefcase-outline";
}

export function CartTaskRow({ task }: CartTaskRowProps) {
  const price = task.estimated_price != null ? `KES ${task.estimated_price.toLocaleString()}` : "—";
  const eta = task.estimated_eta_minutes != null ? `${task.estimated_eta_minutes} min` : "—";
  const fields = Object.entries(task.field_values);

  return (
    <View style={styles.row}>
      <View style={styles.header}>
        <View style={styles.titleGroup}>
          <Ionicons name={taskIcon(task.task_code)} size={16} color={colors.primary} />
          <Text style={styles.title}>{humanize(task.task_code)}</Text>
        </View>
        <StatusBadge label={task.status} tone={cartStatusTone(task.status)} />
      </View>

      {fields.length > 0 && (
        <View style={styles.fieldsGrid}>
          {fields.map(([label, value]) => (
            <View key={label} style={styles.fieldItem}>
              <Text style={styles.fieldLabel}>{humanize(label)}</Text>
              <Text style={styles.fieldValue}>{value}</Text>
            </View>
          ))}
        </View>
      )}

      <View style={styles.footer}>
        <Text style={styles.footerPrice}>{price}</Text>
        <Text style={styles.footerEta}>{eta}</Text>
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
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  titleGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  title: {
    ...typography.body,
    color: colors.text,
    fontWeight: "600",
  },
  fieldsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  fieldItem: {
    flexBasis: "45%",
    flexGrow: 1,
  },
  fieldLabel: {
    ...typography.label,
    color: colors.textMuted,
  },
  fieldValue: {
    ...typography.bodySmall,
    color: colors.text,
    marginTop: 2,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: spacing.md,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  footerPrice: {
    ...typography.bodySmall,
    color: colors.primaryDark,
    fontWeight: "700",
  },
  footerEta: {
    ...typography.bodySmall,
    color: colors.textMuted,
  },
});
