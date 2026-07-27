import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { Alert, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";

import { CountdownPill } from "@/components/CountdownPill";
import { ErrorNotice } from "@/components/ErrorNotice";
import { OutlineButton } from "@/components/OutlineButton";
import { PrimaryButton } from "@/components/PrimaryButton";
import { Screen } from "@/components/Screen";
import { StatusBadge } from "@/components/StatusBadge";
import { acceptTaskOffer, completeTask, getTask, markTaskUnfulfillable, recordTaskUpdate, rejectTaskOffer, startTask } from "@/lib/api/tasks";
import { formatKes, formatTime } from "@/lib/format";
import { fromTask, jobMidStageLabel, jobStatusLabel, jobStatusTone } from "@/lib/jobs";
import { clearJobStage, getJobStage, setJobStage, type JobStage } from "@/lib/jobProgress";
import { getDemoCustomerName, isDemoEnabled } from "@/lib/demo/demoStore";
import { useProviderSession } from "@/lib/providerSession";
import { usePolling } from "@/lib/usePolling";
import { colors, radii, spacing, typography } from "@/theme";

export function JobDetailScreen() {
  const { taskId, offerId } = useLocalSearchParams<{ taskId: string; offerId?: string }>();
  const session = useProviderSession();

  const fetcher = useCallback(() => getTask(taskId), [taskId]);
  const { data: task, error, isRefreshing, refresh } = usePolling(fetcher, 15_000);

  const [stage, setStage] = useState<JobStage | null>(null);
  useEffect(() => {
    getJobStage(taskId).then(setStage).catch(() => setStage(null));
  }, [taskId]);

  const [isBusy, setIsBusy] = useState(false);

  if (!task) {
    return <Screen title="Job">{error ? <ErrorNotice message={error} onRetry={refresh} /> : null}</Screen>;
  }

  const job = fromTask(task, (stage ?? 0) > 0, offerId ?? null);
  const businessType = session?.businessType ?? "shop";
  const customerName = isDemoEnabled() ? getDemoCustomerName(taskId) : null;
  const note = task.lineItems[0]?.displayName;

  async function accept() {
    if (!offerId) return;
    setIsBusy(true);
    try {
      await acceptTaskOffer(taskId, offerId);
      refresh();
    } catch (caught) {
      Alert.alert("Couldn't accept", caught instanceof Error ? caught.message : "Try again.");
    } finally {
      setIsBusy(false);
    }
  }

  function confirmDecline() {
    Alert.alert("Decline this job?", "We'll look for someone else, or tell the customer.", [
      { text: "Keep it", style: "cancel" },
      { text: "Decline", style: "destructive", onPress: () => void decline() },
    ]);
  }

  async function decline() {
    if (!offerId) return;
    setIsBusy(true);
    try {
      await rejectTaskOffer(taskId, offerId, "Declined");
      router.back();
    } catch (caught) {
      Alert.alert("Couldn't decline", caught instanceof Error ? caught.message : "Try again.");
    } finally {
      setIsBusy(false);
    }
  }

  async function start() {
    setIsBusy(true);
    try {
      await startTask(taskId);
      await setJobStage(taskId, 0);
      setStage(0);
      refresh();
    } catch (caught) {
      Alert.alert("Couldn't start", caught instanceof Error ? caught.message : "Try again.");
    } finally {
      setIsBusy(false);
    }
  }

  async function advanceStage(current: JobStage, label: string) {
    setIsBusy(true);
    try {
      if (current === 2) {
        await completeTask(taskId);
        await clearJobStage(taskId);
        setStage(null);
        refresh();
        return;
      }
      await recordTaskUpdate(taskId, "job_stage", `${label} — done.`);
      const next = (current + 1) as JobStage;
      await setJobStage(taskId, next);
      setStage(next);
    } catch (caught) {
      Alert.alert("Couldn't update", caught instanceof Error ? caught.message : "Try again.");
    } finally {
      setIsBusy(false);
    }
  }

  function confirmCantDo() {
    Alert.alert("Can't do this job?", "The customer will be told.", [
      { text: "Cancel", style: "cancel" },
      { text: "Can't do it", style: "destructive", onPress: () => void cantDo() },
    ]);
  }

  async function cantDo() {
    setIsBusy(true);
    try {
      await markTaskUnfulfillable(taskId, "Can't fulfil this job");
      router.back();
    } catch (caught) {
      Alert.alert("Couldn't do that", caught instanceof Error ? caught.message : "Try again.");
    } finally {
      setIsBusy(false);
    }
  }

  const stops = [
    { label: "Arrive at customer", actionLabel: "Mark arrived" },
    { label: jobMidStageLabel(task.taskCode), actionLabel: "Mark done" },
    { label: "Finish & hand off", actionLabel: "Complete job" },
  ];
  const effectiveStage = stage ?? 0;

  return (
    <Screen
      title={job.title}
      subtitle={task.zoneName}
      action={<StatusBadge label={jobStatusLabel(job.status, businessType)} tone={jobStatusTone(job.status)} />}
    >
      {error ? <ErrorNotice message={error} onRetry={refresh} /> : null}

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={refresh} tintColor={colors.primary} />}
      >
        <View style={styles.infoCard}>
          {customerName ? (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Customer</Text>
              <Text style={styles.infoValue}>{customerName}</Text>
            </View>
          ) : null}
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>When</Text>
            <Text style={styles.infoValue}>{formatTime(task.createdAt)}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Zone</Text>
            <Text style={styles.infoValue}>{task.zoneName}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Price</Text>
            <Text style={styles.infoValue}>{formatKes(task.actualTotal ?? task.estimatedPrice)}</Text>
          </View>
        </View>

        {note ? (
          <View style={styles.noteCard}>
            <Text style={styles.noteLabel}>Job note</Text>
            <Text style={styles.noteText}>{note}</Text>
          </View>
        ) : null}

        {job.status === "new" ? (
          <>
            {job.expiresAt ? (
              <View style={styles.countdownRow}>
                <CountdownPill expiresAt={job.expiresAt} />
              </View>
            ) : null}
            <View style={styles.actions}>
              <OutlineButton label="Decline" onPress={confirmDecline} disabled={isBusy} style={styles.actionButton} />
              <PrimaryButton label="Accept" onPress={() => void accept()} isBusy={isBusy} style={styles.actionButton} />
            </View>
            <Pressable
              accessibilityRole="button"
              hitSlop={8}
              onPress={() => Alert.alert("Suggest a different time", "Message the customer directly to propose a new time.")}
            >
              <Text style={styles.suggestLink}>Suggest a different time</Text>
            </Pressable>
          </>
        ) : null}

        {job.status === "confirmed" ? (
          <View style={styles.actions}>
            <PrimaryButton label="Start errand" tone="action" onPress={() => void start()} isBusy={isBusy} />
            <OutlineButton label="Can't do this job" tone="danger" disabled={isBusy} onPress={confirmCantDo} />
          </View>
        ) : null}

        {job.status === "inProgress" ? (
          <View style={styles.stopsSection}>
            <Text style={styles.sectionTitle}>STOPS</Text>
            {stops.map((stop, index) => {
              const state = index < effectiveStage ? "done" : index === effectiveStage ? "current" : "upcoming";
              return (
                <View key={stop.label} style={styles.stopRow}>
                  <View style={styles.stopHeader}>
                    <View style={styles.stopLabelRow}>
                      <View style={[styles.stopDot, state === "done" && styles.stopDotDone, state === "current" && styles.stopDotCurrent]} />
                      <Text style={styles.stopLabel}>{stop.label}</Text>
                    </View>
                    <StatusBadge
                      label={state === "done" ? "Done" : state === "current" ? "Up next" : "Upcoming"}
                      tone={state === "done" ? "completed" : state === "current" ? "confirmed" : "neutral"}
                    />
                  </View>
                  {state === "current" ? (
                    <PrimaryButton
                      label={stop.actionLabel}
                      tone="action"
                      isBusy={isBusy}
                      onPress={() => void advanceStage(index as JobStage, stop.label)}
                      style={styles.stopAction}
                    />
                  ) : null}
                </View>
              );
            })}
            <OutlineButton label="Can't finish this job" tone="danger" disabled={isBusy} onPress={confirmCantDo} />
          </View>
        ) : null}

        {job.status === "completed" ? (
          <View style={styles.doneNotice}>
            <Ionicons name="checkmark-circle-outline" size={18} color={colors.success} />
            <Text style={styles.doneText}>This job is done.</Text>
          </View>
        ) : null}

        {job.status === "cancelled" ? (
          <View style={styles.cancelledNotice}>
            <Ionicons name="close-circle-outline" size={18} color={colors.danger} />
            <Text style={styles.cancelledText}>This job was cancelled.</Text>
          </View>
        ) : null}
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
  infoCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.md,
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
  noteCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    padding: spacing.md,
    gap: spacing.xs,
  },
  noteLabel: {
    ...typography.bodySmall,
    color: colors.textMuted,
  },
  noteText: {
    ...typography.body,
    color: colors.text,
  },
  countdownRow: {
    alignItems: "flex-start",
  },
  actions: {
    gap: spacing.sm,
  },
  actionButton: {
    flex: 1,
  },
  suggestLink: {
    ...typography.bodySmall,
    color: colors.primaryLight,
    fontWeight: "600",
    textAlign: "center",
  },
  stopsSection: {
    gap: spacing.md,
  },
  sectionTitle: {
    ...typography.label,
    color: colors.textMuted,
    fontWeight: "700",
  },
  stopRow: {
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    padding: spacing.md,
    gap: spacing.sm,
  },
  stopHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
  },
  stopLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    flex: 1,
  },
  stopDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.border,
  },
  stopDotDone: {
    backgroundColor: colors.success,
  },
  stopDotCurrent: {
    backgroundColor: colors.actionBlue,
  },
  stopLabel: {
    ...typography.body,
    fontWeight: "600",
    color: colors.text,
    flexShrink: 1,
  },
  stopAction: {
    alignSelf: "stretch",
  },
  doneNotice: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: colors.accentGreen,
    borderRadius: radii.md,
    padding: spacing.md,
  },
  doneText: {
    ...typography.body,
    color: colors.success,
    fontWeight: "600",
  },
  cancelledNotice: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: colors.dangerBackground,
    borderRadius: radii.md,
    padding: spacing.md,
  },
  cancelledText: {
    ...typography.body,
    color: colors.danger,
    fontWeight: "600",
  },
});
