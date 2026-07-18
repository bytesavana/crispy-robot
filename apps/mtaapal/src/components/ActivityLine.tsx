import { StyleSheet, Text, View } from "react-native";

import { colors, spacing, typography } from "@/theme";

type ActivityLineProps = {
  text: string;
};

/** A silent fulfillment status update (provider arrived, purchasing, ...) — centered and
 * muted, distinct from a UserBubble/AssistantCard chat turn since no one said this. */
export function ActivityLine({ text }: ActivityLineProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignSelf: "center",
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    marginVertical: spacing.xs,
    maxWidth: "90%",
  },
  text: {
    ...typography.bodySmall,
    color: colors.textMuted,
    textAlign: "center",
  },
});
