import { Ionicons } from "@expo/vector-icons";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";

import { CartTaskRow } from "@/components/CartTaskRow";
import type { Cart } from "@/lib/cartTypes";
import { colors, spacing, typography } from "@/theme";

type CartSheetProps = {
  cart: Cart;
  onCollapse: () => void;
};

export function CartSheet({ cart, onCollapse }: CartSheetProps) {
  const totalLabel =
    cart.total_estimated_price != null ? `KES ${cart.total_estimated_price.toLocaleString()}` : "—";

  return (
    <View style={styles.sheet}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Your cart</Text>
          <Text style={styles.subtitle}>{totalLabel} estimated total</Text>
        </View>
        <Pressable onPress={onCollapse} hitSlop={12}>
          <Ionicons name="chevron-down" size={22} color={colors.text} />
        </Pressable>
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
  sheet: {
    flex: 1,
    backgroundColor: colors.background,
    paddingTop: spacing.md,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
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
    flexGrow: 0,
  },
  listContent: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: spacing.sm,
  },
});
