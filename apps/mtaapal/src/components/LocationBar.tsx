import { Ionicons } from "@expo/vector-icons";
import type { ReactNode } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";

import { formatAddressLabel } from "@/lib/useAddress";
import { useSelectedAddress } from "@/lib/selectedAddress";
import { useDeviceLocationStatus } from "@/lib/deviceLocation";
import { colors, radii, spacing, typography } from "@/theme";

export function LocationBar({ onPress }: { onPress: () => void }) {
  const selected = useSelectedAddress();
  const locationStatus = useDeviceLocationStatus();
  if (selected) {
    if (selected.coverage === "checking") {
      return (
        <Banner
          onPress={onPress}
          icon={<ActivityIndicator size="small" color={colors.text} />}
          text={formatAddressLabel(selected)}
        />
      );
    }
    return selected.coverage === "covered" ? (
      <Pill onPress={onPress} text={formatAddressLabel(selected)} />
    ) : (
      <Banner
        onPress={onPress}
        icon={<Ionicons name="information-circle-outline" size={16} color={colors.text} />}
        text={`MtaaPal hasn't launched near ${formatAddressLabel(selected)} yet — tap to select a different address`}
      />
    );
  }

  if (locationStatus === "resolving") {
    return (
      <Banner
        onPress={onPress}
        icon={<ActivityIndicator size="small" color={colors.text} />}
        text="Finding your location…"
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

function Pill({ onPress, text }: { onPress: () => void; text: string }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.pill, pressed && styles.pillPressed]}>
      <View style={styles.dot} />
      <Text style={styles.pillText}>{text}</Text>
      <Ionicons name="pencil" size={12} color={colors.textMuted} />
    </Pressable>
  );
}


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
