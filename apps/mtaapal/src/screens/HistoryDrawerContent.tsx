import { Ionicons } from "@expo/vector-icons";
import type { DrawerContentComponentProps } from "expo-router/drawer";
import { router } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { PrimaryButton } from "@/components/PrimaryButton";
import { type AccountInfo, getAccountInfo, signOut } from "@/lib/auth";
import { mockHistory } from "@/lib/mockHistory";
import { colors, radii, spacing, typography } from "@/theme";

// No dedicated screens exist yet for these — tapping one just closes the menu, per the app's
// existing convention of documented, intentional no-ops for not-yet-built features.
const ACCOUNT_MENU_ITEMS = [
  "Profile",
  "Saved addresses",
  "Payment methods",
  "Notifications",
  "Privacy",
  "Help & support",
] as const;

export function HistoryDrawerContent({ navigation }: DrawerContentComponentProps) {
  const [account, setAccount] = useState<AccountInfo | null>(null);
  const [menuExpanded, setMenuExpanded] = useState(false);

  const refreshAccount = useCallback(() => {
    getAccountInfo()
      .then(setAccount)
      .catch(() => setAccount(null));
  }, []);

  useEffect(() => {
    refreshAccount();
    // Drawer content doesn't unmount between opens, so re-check on every focus (e.g. after
    // returning from the sign-in flow). The navigation prop's addListener is under-typed here
    // across the expo-router/react-navigation version boundary, but is a stable runtime API.
    const unsubscribe = (
      navigation as unknown as { addListener: (event: "focus", callback: () => void) => () => void }
    ).addListener("focus", refreshAccount);
    return unsubscribe;
  }, [navigation, refreshAccount]);

  const handleSignOut = () => {
    signOut().then(() => {
      setAccount(null);
      setMenuExpanded(false);
    });
  };

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <View style={styles.header}>
        <Text style={styles.brand}>MtaaPal</Text>
        <Pressable onPress={() => navigation.closeDrawer()} hitSlop={12}>
          <Ionicons name="close" size={22} color={colors.text} />
        </Pressable>
      </View>

      <Text style={styles.sectionLabel}>HISTORY</Text>
      <ScrollView contentContainerStyle={styles.list}>
        {mockHistory.map((entry) => (
          <Pressable
            key={entry.id}
            style={({ pressed }) => [styles.historyRow, pressed && styles.historyRowPressed]}
            onPress={() => {
              navigation.closeDrawer();
              router.push(`/thread/${entry.id}`);
            }}
          >
            <Text style={styles.historyTitle}>{entry.title}</Text>
            <Text style={styles.historyStatus}>{entry.statusLine}</Text>
          </Pressable>
        ))}
      </ScrollView>

      <View style={styles.footer}>
        <View style={styles.divider} />
        {account ? (
          <>
            {menuExpanded && (
              <View style={styles.menu}>
                {ACCOUNT_MENU_ITEMS.map((item) => (
                  <Pressable key={item} style={styles.menuRow} onPress={() => setMenuExpanded(false)}>
                    <Text style={styles.menuLabel}>{item}</Text>
                  </Pressable>
                ))}
                <Pressable style={styles.menuRow} onPress={handleSignOut}>
                  <Text style={styles.signOutLabel}>Sign out</Text>
                </Pressable>
              </View>
            )}
            <Pressable style={styles.accountRow} onPress={() => setMenuExpanded((expanded) => !expanded)}>
              <View style={styles.avatar}>
                <Text style={styles.avatarLabel}>{account.fullName.charAt(0).toUpperCase()}</Text>
              </View>
              <View style={styles.accountInfo}>
                <Text style={styles.accountName}>{account.fullName}</Text>
                <Text style={styles.accountSubtitle}>View account</Text>
              </View>
              <Ionicons
                name={menuExpanded ? "chevron-up" : "chevron-down"}
                size={18}
                color={colors.textMuted}
              />
            </Pressable>
          </>
        ) : (
          <PrimaryButton
            label="Sign in"
            onPress={() => {
              navigation.closeDrawer();
              router.push("/auth/sign-in");
            }}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: spacing.lg,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: spacing.md,
  },
  brand: {
    ...typography.heading,
    fontSize: 20,
    color: colors.text,
  },
  sectionLabel: {
    ...typography.label,
    color: colors.textMuted,
    marginBottom: spacing.sm,
  },
  list: {
    flexGrow: 1,
    gap: spacing.md,
  },
  historyRow: {
    paddingVertical: spacing.sm,
    borderRadius: radii.sm,
  },
  historyRowPressed: {
    opacity: 0.6,
  },
  historyTitle: {
    ...typography.body,
    color: colors.text,
    fontWeight: "600",
  },
  historyStatus: {
    ...typography.bodySmall,
    color: colors.textMuted,
    marginTop: 2,
  },
  footer: {
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginBottom: spacing.md,
  },
  menu: {
    marginBottom: spacing.xs,
  },
  menuRow: {
    paddingVertical: spacing.sm,
  },
  menuLabel: {
    ...typography.body,
    color: colors.text,
  },
  signOutLabel: {
    ...typography.body,
    color: colors.primary,
    fontWeight: "600",
  },
  accountRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingVertical: spacing.sm,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarLabel: {
    color: colors.textOnPrimary,
    fontSize: 16,
    fontWeight: "700",
  },
  accountInfo: {
    flex: 1,
  },
  accountName: {
    ...typography.body,
    color: colors.text,
    fontWeight: "600",
  },
  accountSubtitle: {
    ...typography.bodySmall,
    color: colors.textMuted,
  },
});
