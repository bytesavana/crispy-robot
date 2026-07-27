import { StyleSheet, Switch, Text, View } from "react-native";

import { colors, radii, spacing, typography } from "@/theme";

type AvailabilityToggleProps = {
  isActive: boolean;
  onChange: (value: boolean) => void;
  isBusy?: boolean;
};

/** Provider.IsActive, shown as "Available" — an operational toggle a shop or runner flips
 * themselves, independent of verification (see Provider.IsActive's own doc: a verified provider can
 * still be on leave). */
export function AvailabilityToggle({ isActive, onChange, isBusy }: AvailabilityToggleProps) {
  return (
    <View style={styles.row}>
      <Text style={[styles.label, isActive ? styles.labelActive : styles.labelInactive]}>
        {isActive ? "Available" : "Away"}
      </Text>
      <Switch
        value={isActive}
        onValueChange={onChange}
        disabled={isBusy}
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
