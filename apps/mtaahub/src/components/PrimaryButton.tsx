import { ActivityIndicator, Pressable, StyleSheet, Text, type PressableProps } from "react-native";

import { colors, radii, spacing } from "@/theme";

type PrimaryButtonProps = Omit<PressableProps, "children"> & {
  label: string;
  /** "primary" (terracotta) is the business/growth action — onboarding, submitting for
   * verification, accepting a new job offer, withdrawing earnings. "action" (steel blue) is an
   * in-job action on work you've already taken on — start the job, mark a stage done. Keeping the
   * two apart is what makes "a new job came in" and "I'm working the job I already have" read as
   * different moments at a glance. */
  tone?: "primary" | "action";
  isBusy?: boolean;
};

export function PrimaryButton({ label, tone = "primary", isBusy, style, disabled, ...props }: PrimaryButtonProps) {
  const isDisabled = disabled || isBusy;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: !!isDisabled, busy: !!isBusy }}
      {...props}
      disabled={isDisabled}
      style={(state) => [
        styles.base,
        tone === "action" && styles.action,
        isDisabled && styles.disabled,
        typeof style === "function" ? style(state) : style,
      ]}
    >
      {isBusy ? <ActivityIndicator color={colors.textOnPrimary} /> : <Text style={styles.label}>{label}</Text>}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    backgroundColor: colors.primary,
    borderRadius: radii.pill,
    // Taller than the customer app's: this gets tapped with one thumb, often on the move.
    paddingVertical: spacing.md + 2,
    paddingHorizontal: spacing.lg,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 54,
  },
  action: {
    backgroundColor: colors.actionBlue,
  },
  disabled: {
    opacity: 0.45,
  },
  label: {
    color: colors.textOnPrimary,
    fontSize: 16,
    fontWeight: "600",
  },
});
