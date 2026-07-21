import { StyleSheet, View } from "react-native";
import { EnrichedMarkdownText } from "react-native-enriched-markdown";

import { colors, spacing, typography } from "@/theme";

type AssistantMessageProps = {
  text: string;
};

export function AssistantMessage({ text }: AssistantMessageProps) {
  return (
    <View style={styles.container}>
      <EnrichedMarkdownText markdown={text} markdownStyle={markdownStyle} />
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
    paddingVertical: spacing.xs,
  },
});
