import { Ionicons } from "@expo/vector-icons";
import type { DrawerContentComponentProps } from "expo-router/drawer";
import { router } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { PrimaryButton } from "@/components/PrimaryButton";
import { mockHistory } from "@/lib/mockHistory";
import { colors, radii, spacing, typography } from "@/theme";

export function HistoryDrawerContent({ navigation }: DrawerContentComponentProps) {
  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <View style={styles.header}>
        <Text style={styles.brand}>MtaaPal</Text>
        <Pressable onPress={() => navigation.closeDrawer()} hitSlop={12}>
          <Ionicons name="close" size={22} color={colors.text} />
        </Pressable>
      </View>

      {/* No auth backend yet — sign-in is a documented, intentional no-op for now. */}
      <PrimaryButton label="Sign in" disabled onPress={() => {}} style={styles.signIn} />

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
  signIn: {
    marginBottom: spacing.lg,
  },
  sectionLabel: {
    ...typography.label,
    color: colors.textMuted,
    marginBottom: spacing.sm,
  },
  list: {
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
});
