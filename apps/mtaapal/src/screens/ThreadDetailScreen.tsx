import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { AssistantCard } from "@/components/AssistantCard";
import { OutlineButton } from "@/components/OutlineButton";
import { PrimaryButton } from "@/components/PrimaryButton";
import { StatusBadge } from "@/components/StatusBadge";
import { UserBubble } from "@/components/UserBubble";
import { mockHistory } from "@/lib/mockHistory";
import { colors, spacing, typography } from "@/theme";

export function ThreadDetailScreen() {
  const { threadId } = useLocalSearchParams<{ threadId: string }>();
  const entry = mockHistory.find((item) => item.id === threadId);

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Ionicons name="chevron-back" size={22} color={colors.text} />
        </Pressable>
        <View>
          <Text style={styles.title}>{entry?.title ?? "Thread"}</Text>
          {entry ? <Text style={styles.subtitle}>{entry.statusLine}</Text> : null}
        </View>
      </View>

      {entry ? (
        <>
          <ScrollView contentContainerStyle={styles.scrollContent}>
            <UserBubble text={entry.userMessage} />
            <AssistantCard>
              <Text style={styles.introText}>{entry.assistantIntro}</Text>
              {entry.items.map((item) => (
                <View key={item.label} style={styles.itemRow}>
                  <Text style={styles.itemLabel}>{item.label}</Text>
                  <StatusBadge label={item.status} />
                </View>
              ))}
              <Text style={styles.runnerLine}>{entry.runnerLine}</Text>
            </AssistantCard>
          </ScrollView>
          <View style={styles.actions}>
            <PrimaryButton label="Book again" onPress={() => {}} />
            <OutlineButton label="Give feedback" onPress={() => {}} style={styles.feedbackButton} />
          </View>
        </>
      ) : (
        <Text style={styles.introText}>Thread not found.</Text>
      )}
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
    gap: spacing.md,
    paddingVertical: spacing.md,
  },
  title: {
    ...typography.body,
    color: colors.text,
    fontWeight: "600",
  },
  subtitle: {
    ...typography.bodySmall,
    color: colors.textMuted,
  },
  scrollContent: {
    paddingVertical: spacing.md,
    gap: spacing.sm,
  },
  introText: {
    ...typography.body,
    color: colors.text,
    marginBottom: spacing.sm,
    fontWeight: "600",
  },
  itemRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: spacing.xs,
  },
  itemLabel: {
    ...typography.bodySmall,
    color: colors.text,
    flexShrink: 1,
  },
  runnerLine: {
    ...typography.bodySmall,
    color: colors.textMuted,
    marginTop: spacing.sm,
  },
  actions: {
    paddingVertical: spacing.lg,
    gap: spacing.sm,
  },
  feedbackButton: {
    marginTop: spacing.xs,
  },
});
