import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";

import type { Cart } from "@/lib/cartTypes";
import { colors, radii, spacing, typography } from "@/theme";

type CartBarProps = {
  cart: Cart;
  onPress: () => void;
};

export function CartBar({ cart, onPress }: CartBarProps) {
  const count = cart.tasks.length;
  const itemLabel = `${count} item${count === 1 ? "" : "s"}`;
  const totalLabel =
    cart.total_estimated_price != null ? ` · KES ${cart.total_estimated_price.toLocaleString()}` : "";

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.bar, pressed && styles.pressed]}
    >
      <View style={styles.textRow}>
        <Ionicons name="bag-handle" size={16} color={colors.primary} />
        <Text style={styles.label}>
          {itemLabel}
          {totalLabel}
        </Text>
      </View>
      <Ionicons name="chevron-up" size={18} color={colors.textMuted} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    alignSelf: "center",
    backgroundColor: colors.surface,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.sm,
    gap: spacing.md,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  pressed: {
    opacity: 0.85,
  },
  textRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  label: {
    ...typography.bodySmall,
    color: colors.text,
    fontWeight: "600",
  },
});
