import { StyleSheet, Switch, Text, View } from "react-native";

import { colors, radii, spacing, typography } from "@/theme";

type AvailabilityToggleProps = {
  isActive: boolean;
  onChange: (value: boolean) => void;
  isBusy?: boolean;
  disabled?: boolean;
};

/** Provider.IsActive, shown as "Available" — an operational toggle a shop or runner flips
 * themselves, independent of verification (see Provider.IsActive's own doc: a verified provider can
 * still be on leave). Disabled until the provider is verified — there's nothing to be available for
 * yet. */
export function AvailabilityToggle({ isActive, onChange, isBusy, disabled }: AvailabilityToggleProps) {
  const shown = disabled ? false : isActive;
  return (
    <View style={[styles.row, disabled && styles.rowDisabled]}>
      <Text style={[styles.label, shown ? styles.labelActive : styles.labelInactive]}>
        {disabled ? "Not live" : shown ? "Available" : "Away"}
      </Text>
      <Switch
        value={shown}
        onValueChange={onChange}
        disabled={isBusy || disabled}
        trackColor={{ false: colors.border, true: colors.success }}
        thumbColor={colors.surface}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    backgroundColor: colors.surface,
    borderRadius: radii.pill,
    paddingLeft: spacing.md,
    paddingRight: spacing.xs,
    paddingVertical: spacing.xs,
  },
  rowDisabled: {
    opacity: 0.5,
  },
  label: {
    ...typography.bodySmall,
    fontWeight: "700",
  },
  labelActive: {
    color: colors.success,
  },
  labelInactive: {
    color: colors.textMuted,
  },
});
