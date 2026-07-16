import { FlatList, StyleSheet, Text, View } from "react-native";

import { CartTaskRow } from "@/components/CartTaskRow";
import type { Cart } from "@/lib/cartTypes";
import { colors, spacing, typography } from "@/theme";

type CartSidebarProps = {
  cart: Cart;
};

const SIDEBAR_WIDTH = 320;

export function CartSidebar({ cart }: CartSidebarProps) {
  const totalLabel =
    cart.total_estimated_price != null ? `KES ${cart.total_estimated_price.toLocaleString()}` : "—";

  return (
    <View style={styles.sidebar}>
      <View style={styles.header}>
        <Text style={styles.title}>Your cart</Text>
        <Text style={styles.subtitle}>{totalLabel} estimated total</Text>
      </View>

      <FlatList
        style={styles.list}
        contentContainerStyle={styles.listContent}
        data={cart.tasks}
        keyExtractor={(task) => task.task_id}
        renderItem={({ item }) => <CartTaskRow task={item} />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  sidebar: {
    width: SIDEBAR_WIDTH,
    backgroundColor: colors.background,
    borderLeftWidth: 1,
    borderLeftColor: colors.border,
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: {
    ...typography.body,
    color: colors.text,
    fontWeight: "700",
  },
  subtitle: {
    ...typography.bodySmall,
    color: colors.textMuted,
  },
  list: {
    flex: 1,
  },
  listContent: {
    padding: spacing.lg,
    gap: spacing.sm,
  },
});
