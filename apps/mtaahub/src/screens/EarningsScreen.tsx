import { router } from "expo-router";
import { Alert, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";

import { EmptyState } from "@/components/EmptyState";
import { ErrorNotice } from "@/components/ErrorNotice";
import { JobSummaryRow } from "@/components/JobSummaryRow";
import { PrimaryButton } from "@/components/PrimaryButton";
import { Screen } from "@/components/Screen";
import { isDemoEnabled } from "@/lib/config";
import { formatKes, formatTime, isSameDay, isSameWeek } from "@/lib/format";
import { jobStatusLabel, jobStatusTone } from "@/lib/jobs";
import { useProviderSession } from "@/lib/providerSession";
import { useJobs } from "@/lib/useJobs";
import { colors, radii, spacing, typography } from "@/theme";

/** Jobs that are counted as earned: not a still-pending offer, and not cancelled — matches the rule
 * a shop or runner actually cares about ("what have I committed to or already done"), not strictly
 * "what's been paid out". */
function isCounted(status: string): boolean {
  return status !== "new" && status !== "cancelled";
}

export function EarningsScreen() {
  const session = useProviderSession();
  const { data: jobs, error, isRefreshing, refresh } = useJobs(session?.providerId);
  const all = jobs ?? [];
  const today = new Date();

  const todayTotal = all
    .filter((job) => isCounted(job.status) && isSameDay(new Date(job.scheduledAt), today))
    .reduce((sum, job) => sum + job.price, 0);

  const weekTotal = all
    .filter((job) => isCounted(job.status) && isSameWeek(new Date(job.scheduledAt), today))
    .reduce((sum, job) => sum + job.price, 0);

  // Lifetime completed earnings — the closest honest number to "available to withdraw" without a
  // real payout ledger behind it. See the Withdraw button below for what that gap means in practice.
  const availableToWithdraw = all
    .filter((job) => job.status === "completed")
    .reduce((sum, job) => sum + job.price, 0);

  function withdraw() {
    if (isDemoEnabled()) {
      Alert.alert("Withdrawal requested", "This is a demo — no money actually moves.");
      return;
    }
    Alert.alert("Not set up yet", "Payouts aren't wired up on the backend yet — the MtaaPal team will reach out.");
  }

  return (
    <Screen title="Earnings">
      {error ? <ErrorNotice message={error} onRetry={refresh} /> : null}

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={refresh} tintColor={colors.primary} />}
      >
        <View style={styles.statRow}>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Today</Text>
            <Text style={styles.statValue}>{formatKes(todayTotal)}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>This week</Text>
            <Text style={styles.statValue}>{formatKes(weekTotal)}</Text>
          </View>
        </View>

        <View style={styles.withdrawBanner}>
          <View>
            <Text style={styles.withdrawLabel}>Available to withdraw</Text>
            <Text style={styles.withdrawValue}>{formatKes(availableToWithdraw)}</Text>
          </View>
          <PrimaryButton label="Withdraw" onPress={withdraw} />
        </View>

        <View style={styles.list}>
          {all.length === 0 && !error ? (
            <EmptyState icon="cash-outline" title="No jobs yet" message="Once you take on work, it'll show up here." />
          ) : (
            [...all]
              .sort((a, b) => b.scheduledAt.localeCompare(a.scheduledAt))
              .map((job) => (
                <JobSummaryRow
                  key={job.taskId}
                  title={job.customerName ?? job.title}
                  subtitle={`${new Date(job.scheduledAt).toLocaleDateString("en-US", { weekday: "short" })} ${formatTime(
                    job.scheduledAt,
                  )} · ${job.title}`}
                  price={job.price}
                  status={{ label: jobStatusLabel(job.status, session?.businessType ?? "shop"), tone: jobStatusTone(job.status) }}
                  onPress={() =>
                    router.push({
                      pathname: "/job/[taskId]",
                      params: { taskId: job.taskId, ...(job.offerId ? { offerId: job.offerId } : {}) },
                    })
                  }
                />
              ))
          )}
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: spacing.md,
    paddingBottom: spacing.xl,
    gap: spacing.md,
  },
  statRow: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  statCard: {
    flex: 1,
    alignItems: "center",
    gap: spacing.xs,
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    paddingVertical: spacing.md,
  },
  statLabel: {
    ...typography.bodySmall,
    color: colors.textMuted,
  },
  statValue: {
    ...typography.heading,
    fontSize: 22,
    color: colors.text,
  },
  withdrawBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md,
    backgroundColor: colors.accentPeach,
    borderRadius: radii.lg,
    padding: spacing.md,
  },
  withdrawLabel: {
    ...typography.bodySmall,
    color: colors.primaryDark,
  },
  withdrawValue: {
    ...typography.heading,
    fontSize: 22,
    color: colors.text,
  },
  list: {
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
});
