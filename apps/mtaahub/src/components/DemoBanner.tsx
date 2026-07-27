import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";

import { isDemoEnabled } from "@/lib/demo/demoStore";
import { colors, spacing, typography } from "@/theme";

/**
 * Renders on every screen while demo mode is on. Not decoration: fixtures that look exactly like
 * real orders are precisely the thing someone will later screenshot as evidence of a live system,
 * so the app should never be quietly lying about which it is.
 */
export function DemoBanner() {
  if (!isDemoEnabled()) return null;

  return (
    <View style={styles.banner}>
      <Ionicons name="flask-outline" size={14} color={colors.warning} />
      <Text style={styles.text}>Demo data — not real orders</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xs,
    backgroundColor: colors.accentAmber,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
  },
  text: {
    ...typography.label,
    color: colors.warning,
    fontWeight: "700",
  },
});
