import type { ReactNode } from "react";
import { StyleSheet, View } from "react-native";
import { EnrichedMarkdownText } from "react-native-enriched-markdown";

import { colors, radii, spacing, typography } from "@/theme";

type AssistantCardProps = {
  text?: string;
  children?: ReactNode;
};

export function AssistantCard({ text, children }: AssistantCardProps) {
  return (
    <View style={styles.container}>
      {text !== undefined ? (
        <EnrichedMarkdownText markdown={text} markdownStyle={markdownStyle} />
      ) : (
        children
      )}
    </View>
  );
}

const markdownStyle = {
  paragraph: {
    ...typography.body,
    color: colors.text,
  },
};

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
});
