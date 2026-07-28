import { Ionicons } from "@expo/vector-icons";
import type { ReactNode } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";

import { useAddressLabel, useIsAddressUncovered } from "@/lib/useAddress";
import { useZoneStatus } from "@/lib/zoneResolution";
import { colors, radii, spacing, typography } from "@/theme";

/**
 * Replaces the old separate ZonePill + ZoneBanner: one location, so one place
 * to show it, always with the right message rather than either component
 * silently rendering nothing. Every state is tappable — it always opens the
 * picker, since search now makes it a real way to answer "where am I" even
 * when GPS permission is denied, not just a device-settings shortcut. A
 * trailing pencil icon marks every state as editable, not just the pill, so
 * nothing reads as a static status line.
 *
 * Two independent conditions decide *what* to show, checked separately on
 * purpose: device GPS permission (zoneResolution.ts — nothing to do with any
 * conversation) and whether *this thread's* resolved address falls outside
 * every MtaaPal zone (useAddress.ts). Conflating the two was exactly the kind
 * of contradiction that produced the original bug this whole redesign fixes.
 *
 * Thread state (useAddressLabel/useIsAddressUncovered) always wins once it
 * has an opinion — it's bound via apply_address_selection, so it reflects
 * whatever the customer last confirmed, through the picker or in chat, not a
 * live device reading that could silently move a location out from under
 * them. A raw GPS "resolved" status only gets shown on its own — as a
 * provisional preview, not yet a bound address — when the thread has no
 * address opinion at all yet (a fresh/empty conversation still sitting on the
 * cold-start seed from zoneResolution.ts's seedPendingAddress).
 */
export function LocationBar({ onPress }: { onPress: () => void }) {
  const label = useAddressLabel();
  const uncovered = useIsAddressUncovered();
  const gpsStatus = useZoneStatus();

  if (label && !uncovered) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [styles.pill, pressed && styles.pillPressed]}
      >
        <View style={styles.dot} />
        <Text style={styles.pillText}>{label}</Text>
        <Ionicons name="pencil" size={12} color={colors.textMuted} />
      </Pressable>
    );
  }

  if (uncovered) {
    return (
      <Banner
        onPress={onPress}
        icon={<Ionicons name="information-circle-outline" size={16} color={colors.text} />}
        text={`MtaaPal hasn't launched ${label ? `near ${label}` : "in your area"} yet — tap to try another location`}
      />
    );
  }

  if (gpsStatus === "resolving") {
    return (
      <Banner
        onPress={onPress}
        icon={<ActivityIndicator size="small" color={colors.text} />}
        text="Finding your location…"
      />
    );
  }

  if (gpsStatus === "resolved") {
    return (
      <Banner
        onPress={onPress}
        icon={<Ionicons name="location" size={16} color={colors.text} />}
        text="Using your current location — tap to confirm"
      />
    );
  }

  return (
    <Banner
      onPress={onPress}
      icon={<Ionicons name="location-outline" size={16} color={colors.text} />}
      text="Tap to set your delivery location"
    />
  );
}

/** Shared shell for every non-pill state: an icon, a message, and the same
 * trailing pencil the pill uses — so "this is tappable" reads identically
 * regardless of which message is showing. */
function Banner({ onPress, icon, text }: { onPress: () => void; icon: ReactNode; text: string }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.banner, pressed && styles.bannerPressed]}
    >
      {icon}
      <Text style={styles.bannerText}>{text}</Text>
      <Ionicons name="pencil" size={12} color={colors.textMuted} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "center",
    backgroundColor: colors.accentBlue,
    borderRadius: radii.pill,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    gap: spacing.xs,
  },
  pillPressed: {
    opacity: 0.7,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.primary,
  },
  pillText: {
    ...typography.bodySmall,
    color: colors.text,
  },
  banner: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    backgroundColor: colors.accentPeach,
    borderRadius: radii.md,
    marginHorizontal: spacing.lg,
    marginTop: spacing.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  bannerPressed: {
    opacity: 0.85,
  },
  bannerText: {
    ...typography.bodySmall,
    color: colors.text,
    flex: 1,
  },
});
