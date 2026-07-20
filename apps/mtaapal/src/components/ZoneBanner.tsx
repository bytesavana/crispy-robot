import { Ionicons } from "@expo/vector-icons";
import { Linking, Pressable, StyleSheet, Text, View } from "react-native";

import { useZoneStatus } from "@/lib/zoneResolution";
import { colors, radii, spacing, typography } from "@/theme";

/** Nothing to show for "unresolved"/"resolving"/"resolved" — only the two failure states. */
export function ZoneBanner() {
  const status = useZoneStatus();

  if (status === "no_location") {
    return (
      <Pressable style={styles.banner} onPress={() => Linking.openSettings()}>
        <Ionicons name="location-outline" size={16} color={colors.text} />
        <Text style={styles.text}>Turn on location so we can show what&apos;s available near you</Text>
      </Pressable>
    );
  }

  if (status === "not_covered") {
    return (
      <View style={styles.banner}>
        <Ionicons name="information-circle-outline" size={16} color={colors.text} />
        <Text style={styles.text}>
          MtaaPal hasn&apos;t launched in your area yet — we&apos;re expanding fast!
        </Text>
      </View>
    );
  }

  return null;
}

const styles = StyleSheet.create({
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
  text: {
    ...typography.bodySmall,
    color: colors.text,
    flex: 1,
  },
});
