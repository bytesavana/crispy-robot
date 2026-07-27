import { Pressable, StyleSheet, Text, type PressableProps } from "react-native";

import { colors, radii, spacing } from "@/theme";

type OutlineButtonProps = Omit<PressableProps, "children"> & {
  label: string;
  tone?: "neutral" | "danger";
};

export function OutlineButton({ label, tone = "neutral", style, disabled, ...props }: OutlineButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: !!disabled }}
      {...props}
      disabled={disabled}
      style={(state) => [
        styles.base,
        tone === "danger" && styles.danger,
        disabled && styles.disabled,
        typeof style === "function" ? style(state) : style,
      ]}
    >
      <Text style={[styles.label, tone === "danger" && styles.dangerLabel]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radii.pill,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 52,
  },
  danger: {
    borderColor: colors.danger,
  },
  disabled: {
    opacity: 0.45,
  },
  label: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "600",
  },
  dangerLabel: {
    color: colors.danger,
  },
});
