import { StyleSheet, Text, View } from "react-native";

import { colors, typography } from "@/theme";

type QuickActionCardProps = {
  label: string;
  dotColor: string;
};

/** Pure presentation, meant to sit inside a pressable wrapper (e.g. ThreadPrimitive.Suggestion). */
export function QuickActionCard({ label, dotColor }: QuickActionCardProps) {
  return (
    <View>
      <View style={[styles.dot, { backgroundColor: dotColor }]} />
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginBottom: 8,
  },
  label: {
    ...typography.bodySmall,
    color: colors.text,
  },
});
