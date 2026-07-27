import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { colors, radii, spacing, typography } from "@/theme";

type ErrorNoticeProps = {
  message: string;
  onRetry?: () => void;
};

/** An inline banner rather than an alert: a failed background poll shouldn't interrupt someone
 * mid-shop, it should just say so above the data it couldn't refresh. */
export function ErrorNotice({ message, onRetry }: ErrorNoticeProps) {
  return (
    <View style={styles.container}>
      <Ionicons name="warning-outline" size={18} color={colors.danger} />
      <Text style={styles.message}>{message}</Text>
      {onRetry ? (
        <Pressable accessibilityRole="button" onPress={onRetry} hitSlop={8}>
          <Text style={styles.retry}>Retry</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: colors.dangerBackground,
    borderRadius: radii.md,
    padding: spacing.md,
    marginHorizontal: spacing.md,
    marginBottom: spacing.sm,
  },
  message: {
    ...typography.bodySmall,
    color: colors.danger,
    flex: 1,
  },
  retry: {
    ...typography.bodySmall,
    color: colors.danger,
    fontWeight: "700",
  },
});
