import { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import { formatCountdown } from "@/lib/format";
import { colors, radii, spacing, typography } from "@/theme";

type CountdownPillProps = {
  expiresAt: string;
  /** Fires the moment the clock runs out, so a list can drop an offer nobody can answer any more. */
  onExpired?: () => void;
};

/**
 * The clock an offer is answered against. It ticks locally rather than waiting on the next poll:
 * fifteen seconds of a frozen "4:00" while an offer is actually expiring is exactly the moment a
 * runner needs the truth.
 */
export function CountdownPill({ expiresAt, onExpired }: CountdownPillProps) {
  // The clock is the only state; what's left is derived from it during render. Storing the
  // formatted string instead would need re-syncing whenever expiresAt changed, which is exactly the
  // kind of state-mirroring-props an effect shouldn't be doing.
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const remaining = formatCountdown(expiresAt, now);

  useEffect(() => {
    if (remaining === null) onExpired?.();
  }, [remaining, onExpired]);

  const isUrgent = remaining !== null && !remaining.includes("h") && Number(remaining.split(":")[0]) < 2;

  return (
    <View style={[styles.pill, remaining === null && styles.expired, isUrgent && styles.urgent]}>
      <Text style={[styles.text, remaining === null && styles.expiredText, isUrgent && styles.urgentText]}>
        {remaining === null ? "Expired" : `${remaining} left`}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    alignSelf: "flex-start",
    borderRadius: radii.pill,
    backgroundColor: colors.accentBlue,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm + 2,
  },
  urgent: {
    backgroundColor: colors.accentAmber,
  },
  expired: {
    backgroundColor: colors.dangerBackground,
  },
  text: {
    ...typography.label,
    ...typography.numeric,
    fontSize: 13,
    lineHeight: 17,
    fontWeight: "700",
    color: colors.actionBlueDark,
  },
  urgentText: {
    color: colors.warning,
  },
  expiredText: {
    color: colors.danger,
  },
});
