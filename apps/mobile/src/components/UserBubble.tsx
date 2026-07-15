import { StyleSheet, Text, View } from "react-native";

import { colors, radii, spacing, typography } from "@/theme";

type UserBubbleProps = {
  text: string;
};

export function UserBubble({ text }: UserBubbleProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignSelf: "flex-end",
    backgroundColor: colors.primary,
    borderRadius: radii.md,
    borderTopRightRadius: spacing.xs,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    marginVertical: spacing.xs,
    maxWidth: "85%",
  },
  text: {
    ...typography.body,
    color: colors.textOnPrimary,
  },
});
