import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { PrimaryButton } from "@/components/PrimaryButton";
import { requestLocationAndResolveZone } from "@/lib/zoneResolution";
import { colors, spacing, typography } from "@/theme";

export function LocationPermissionScreen() {
  const proceed = () => router.replace("/(drawer)");

  const requestPermission = async () => {
    // Don't block navigation on the permission prompt + network round-trip — zone
    // resolution continues in the background and the home screen's banner/context
    // pick up the result once it settles (see zoneResolution.ts).
    requestLocationAndResolveZone().catch(() => {});
    proceed();
  };

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <View style={styles.content}>
        <View style={styles.iconCircle}>
          <Ionicons name="location" size={32} color={colors.primary} />
        </View>
        <Text style={styles.heading}>Allow MtaaPal to use your location</Text>
        <Text style={styles.body}>
          We use this to show services, runners, and pricing available in your area.
        </Text>
      </View>
      <View style={styles.footer}>
        <PrimaryButton label="Allow While Using App" onPress={requestPermission} />
        <Pressable onPress={proceed} hitSlop={12} style={styles.notNow}>
          <Text style={styles.notNowText}>Not Now</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: "space-between",
  },
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.xl,
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.accentBlue,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.xl,
  },
  heading: {
    ...typography.headingLarge,
    fontSize: 26,
    lineHeight: 32,
    color: colors.text,
    textAlign: "center",
  },
  body: {
    ...typography.body,
    color: colors.textMuted,
    textAlign: "center",
    marginTop: spacing.sm,
  },
  footer: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
    gap: spacing.sm,
  },
  notNow: {
    alignItems: "center",
    paddingVertical: spacing.sm,
  },
  notNowText: {
    ...typography.body,
    color: colors.text,
    fontWeight: "600",
  },
});
