import type { ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";

import { colors, radii, spacing, typography } from "@/theme";

type AssistantCardProps = {
  text?: string;
  children?: ReactNode;
};

export function AssistantCard({ text, children }: AssistantCardProps) {
  return (
    <View style={styles.container}>
      {text !== undefined ? <Text style={styles.text}>{text}</Text> : children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignSelf: "flex-start",
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    borderTopLeftRadius: spacing.xs,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    marginVertical: spacing.xs,
    maxWidth: "85%",
    borderWidth: 1,
    borderColor: colors.border,
  },
  text: {
    ...typography.body,
    color: colors.text,
  },
});
