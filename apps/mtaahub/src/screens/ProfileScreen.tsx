import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { Avatar } from "@/components/Avatar";
import { OutlineButton } from "@/components/OutlineButton";
import { Screen } from "@/components/Screen";
import { StatusBadge } from "@/components/StatusBadge";
import { VerifiedBadge } from "@/components/VerifiedBadge";
import { isDemoEnabled, resetDemoState } from "@/lib/demo/demoStore";
import { businessTypeLabel, signOut, toggleDemoRole, useProviderSession } from "@/lib/providerSession";
import { colors, radii, spacing, typography } from "@/theme";

type PayoutTab = "mpesa" | "bank";

/** The identity + settings home: who the platform thinks you are, your services and zones, and the
 * one place payout details would live once the backend has a real ledger to back them (see the
 * Earnings screen's Withdraw button for the same caveat). */
export function ProfileScreen() {
  const session = useProviderSession();
  const [payoutOpen, setPayoutOpen] = useState(false);
  const [payoutTab, setPayoutTab] = useState<PayoutTab>("mpesa");

  function confirmSignOut() {
    Alert.alert("Log out?", "You'll need your phone number and a code to get back in.", [
      { text: "Stay", style: "cancel" },
      {
        text: "Log out",
        style: "destructive",
        onPress: () => {
          void signOut().then(() => router.replace("/auth/sign-in"));
        },
      },
    ]);
  }

  async function switchRole() {
    try {
      await toggleDemoRole();
      router.replace("/(app)/calendar");
    } catch (caught) {
      Alert.alert("Couldn't switch", caught instanceof Error ? caught.message : "Try again.");
    }
  }

  return (
    <Screen title="Profile">
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.identityCard}>
          <Avatar name={session?.name ?? "?"} />
          <View style={styles.identityText}>
            <View style={styles.nameRow}>
              <Text style={styles.name} numberOfLines={1}>
                {session?.name}
              </Text>
              {session?.verificationStatus === "Verified" ? <VerifiedBadge /> : null}
            </View>
            <Text style={styles.businessType}>{businessTypeLabel(session?.businessType ?? "shop")}</Text>
          </View>
        </View>

        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Phone</Text>
            <Text style={styles.infoValue}>{session?.phone}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Zone</Text>
            <Text style={styles.infoValue}>{session?.primaryZoneName ?? "Not set"}</Text>
          </View>
          {session && session.verificationStatus !== "Verified" ? (
            <StatusBadge
              label={session.verificationStatus === "Pending" ? "Verification pending" : "Verification rejected"}
              tone={session.verificationStatus === "Pending" ? "new" : "failed"}
            />
          ) : null}
        </View>

        <Text style={styles.sectionTitle}>SERVICES OFFERED</Text>
        <View style={styles.menuCard}>
          <Pressable style={styles.menuRow} onPress={() => router.push("/coverage")}>
            <Text style={styles.menuLabel}>Coverage & services</Text>
            <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
          </Pressable>

          <View style={styles.divider} />

          <Pressable style={styles.menuRow} onPress={() => setPayoutOpen((open) => !open)}>
            <Text style={styles.menuLabel}>Payout account</Text>
            <Ionicons name={payoutOpen ? "chevron-down" : "chevron-forward"} size={18} color={colors.textMuted} />
          </Pressable>

          {payoutOpen ? (
            <View style={styles.payoutPanel}>
              <View style={styles.payoutTabs}>
                <Pressable
                  style={[styles.payoutTab, payoutTab === "mpesa" && styles.payoutTabActive]}
                  onPress={() => setPayoutTab("mpesa")}
                >
                  <Text style={[styles.payoutTabLabel, payoutTab === "mpesa" && styles.payoutTabLabelActive]}>M-Pesa</Text>
                </Pressable>
                <Pressable
                  style={[styles.payoutTab, payoutTab === "bank" && styles.payoutTabActive]}
                  onPress={() => setPayoutTab("bank")}
                >
                  <Text style={[styles.payoutTabLabel, payoutTab === "bank" && styles.payoutTabLabelActive]}>
                    Bank account
                  </Text>
                </Pressable>
              </View>
              <View style={styles.payoutDetail}>
                <Text style={styles.payoutDetailText}>
                  {payoutTab === "mpesa" ? `M-Pesa · ${session?.phone ?? ""} (primary)` : "No bank account added yet."}
                </Text>
              </View>
            </View>
          ) : null}

          <View style={styles.divider} />

          <Pressable style={styles.menuRow} onPress={() => router.push("/help")}>
            <Text style={styles.menuLabel}>Help & support</Text>
            <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
          </Pressable>
        </View>

        {isDemoEnabled() ? (
          <View style={styles.demoTools}>
            <Text style={styles.demoTitle}>Demo tools</Text>
            <Text style={styles.demoHint}>Jobs and earnings are coming from fixtures, not the backend.</Text>
            <OutlineButton
              label={session?.kind === "Runner" ? "Switch to shop view" : "Switch to runner view"}
              onPress={() => void switchRole()}
            />
            <OutlineButton
              label="Reset demo data"
              onPress={() => {
                resetDemoState();
                Alert.alert("Reset", "The fixtures are back to their starting state.");
              }}
            />
          </View>
        ) : null}

        <OutlineButton label="Log out" tone="danger" onPress={confirmSignOut} />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: spacing.md,
    paddingBottom: spacing.xl,
    gap: spacing.lg,
  },
  identityCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.md,
  },
  identityText: {
    flex: 1,
    gap: 2,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  name: {
    ...typography.title,
    fontSize: 17,
    color: colors.text,
    flexShrink: 1,
  },
  businessType: {
    ...typography.bodySmall,
    color: colors.textMuted,
  },
  infoCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.md,
    gap: spacing.sm,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  infoLabel: {
    ...typography.bodySmall,
    color: colors.textMuted,
  },
  infoValue: {
    ...typography.body,
    fontWeight: "600",
    color: colors.text,
  },
  sectionTitle: {
    ...typography.label,
    color: colors.textMuted,
    fontWeight: "700",
    marginBottom: -spacing.sm,
  },
  menuCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    overflow: "hidden",
  },
  menuRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
  },
  menuLabel: {
    ...typography.body,
    fontWeight: "600",
    color: colors.text,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
  },
  payoutPanel: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
    gap: spacing.sm,
  },
  payoutTabs: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  payoutTab: {
    flex: 1,
    alignItems: "center",
    paddingVertical: spacing.sm,
    borderRadius: radii.pill,
    backgroundColor: colors.backgroundAlt,
  },
  payoutTabActive: {
    backgroundColor: colors.primary,
  },
  payoutTabLabel: {
    ...typography.bodySmall,
    fontWeight: "700",
    color: colors.textMuted,
  },
  payoutTabLabelActive: {
    color: colors.textOnPrimary,
  },
  payoutDetail: {
    backgroundColor: colors.backgroundAlt,
    borderRadius: radii.md,
    padding: spacing.md,
  },
  payoutDetailText: {
    ...typography.bodySmall,
    color: colors.text,
  },
  demoTools: {
    gap: spacing.sm,
    backgroundColor: colors.accentAmber,
    borderRadius: radii.lg,
    padding: spacing.md,
  },
  demoTitle: {
    ...typography.label,
    color: colors.warning,
    fontWeight: "700",
  },
  demoHint: {
    ...typography.bodySmall,
    color: colors.warning,
    marginBottom: spacing.xs,
  },
});
