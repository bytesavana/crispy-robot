import { Pressable, StyleSheet, Text, type PressableProps } from "react-native";

import { colors, radii, spacing } from "@/theme";

type PrimaryButtonProps = Omit<PressableProps, "children"> & { label: string };

export function PrimaryButton({ label, style, disabled, ...props }: PrimaryButtonProps) {
  return (
    <Pressable
      {...props}
      disabled={disabled}
      style={(state) => [
        styles.base,
        disabled && styles.disabled,
        typeof style === "function" ? style(state) : style,
      ]}
    >
      <Text style={styles.label}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    backgroundColor: colors.primary,
    borderRadius: radii.pill,
    paddingVertical: spacing.md,
    alignItems: "center",
    justifyContent: "center",
  },
  disabled: {
    opacity: 0.5,
  },
  label: {
    color: colors.textOnPrimary,
    fontSize: 16,
    fontWeight: "600",
  },
});
