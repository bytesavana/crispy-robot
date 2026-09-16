import type { ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { colors, spacing, typography } from "@/theme";

import { DemoBanner } from "./DemoBanner";
import { PendingBanner } from "./PendingBanner";

type ScreenProps = {
  title?: string;
  subtitle?: string;
  /** Rendered opposite the title — a status badge, usually. */
  action?: ReactNode;
  children: ReactNode;
};

export function Screen({ title, subtitle, action, children }: ScreenProps) {
  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <DemoBanner />
      <PendingBanner />
      {title ? (
        <View style={styles.header}>
          <View style={styles.headerText}>
            <Text style={styles.title}>{title}</Text>
            {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
          </View>
          {action}
        </View>
      ) : null}
      <View style={styles.body}>{children}</View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: spacing.md,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  headerText: {
    flex: 1,
    gap: spacing.xs,
  },
  title: {
    ...typography.heading,
    color: colors.text,
  },
  subtitle: {
    ...typography.bodySmall,
    color: colors.textMuted,
  },
  body: {
    flex: 1,
  },
});
