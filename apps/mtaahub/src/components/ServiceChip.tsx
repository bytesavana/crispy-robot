import { Pressable, StyleSheet, Text } from "react-native";

import { colors, radii, spacing, typography } from "@/theme";

type ServiceChipProps = {
  label: string;
  selected: boolean;
  onPress: () => void;
};

/** The "what do you offer" multi-select on the onboarding business form. */
export function ServiceChip({ label, selected, onPress }: ServiceChipProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={[styles.chip, selected && styles.chipSelected]}
    >
      <Text style={[styles.label, selected && styles.labelSelected]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    borderRadius: radii.pill,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  chipSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.backgroundAlt,
  },
  label: {
    ...typography.body,
    color: colors.text,
    fontWeight: "600",
  },
  labelSelected: {
    color: colors.primaryDark,
  },
});
