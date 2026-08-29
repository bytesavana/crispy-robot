import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { useProviderSession } from "@/lib/providerSession";
import { colors, spacing, typography } from "@/theme";

/** Shown on every screen while a provider isn't Verified yet. A Pending provider can walk the app
 * but receives no jobs; a Rejected one sees why. "Check" re-resolves the session against the
 * registry, so approval shows up without a restart. */
export function PendingBanner() {
  const session = useProviderSession();
  if (!session || session.verificationStatus === "Verified") return null;

  const rejected = session.verificationStatus === "Rejected";
  const message = rejected
    ? session.verificationNote
      ? `Application not approved: ${session.verificationNote}`
      : "Application not approved. Contact the MtaaPal team."
    : "Verification pending — you'll start getting jobs once the MtaaPal team approves you.";

  return (
    <View style={[styles.banner, rejected ? styles.bannerRejected : styles.bannerPending]}>
      <Ionicons
        name={rejected ? "close-circle-outline" : "time-outline"}
        size={14}
        color={rejected ? colors.danger : colors.warning}
      />
      <Text style={[styles.text, rejected ? styles.textRejected : styles.textPending]}>{message}</Text>
      <Pressable accessibilityRole="button" hitSlop={8} onPress={() => router.replace("/")}>
        <Text style={styles.action}>Check</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
  },
  bannerPending: {
    backgroundColor: colors.accentAmber,
  },
  bannerRejected: {
    backgroundColor: colors.dangerBackground,
  },
  text: {
    ...typography.label,
    flex: 1,
    fontWeight: "700",
  },
  textPending: {
    color: colors.warning,
  },
  textRejected: {
    color: colors.danger,
  },
  action: {
    ...typography.label,
    color: colors.text,
    fontWeight: "700",
    textDecorationLine: "underline",
  },
});
