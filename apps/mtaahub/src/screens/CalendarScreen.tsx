import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useState } from "react";
import { Alert, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { AvailabilityToggle } from "@/components/AvailabilityToggle";
import { DemoBanner } from "@/components/DemoBanner";
import { EmptyState } from "@/components/EmptyState";
import { ErrorNotice } from "@/components/ErrorNotice";
import { JobCard } from "@/components/JobCard";
import { JobSummaryRow } from "@/components/JobSummaryRow";
import { PendingBanner } from "@/components/PendingBanner";
import { VerifiedBadge } from "@/components/VerifiedBadge";
import { WeekStrip } from "@/components/WeekStrip";
import { setProviderActive } from "@/lib/api/providers";
import { formatDayHeading } from "@/lib/format";
import { updateCachedIsActive, useProviderSession } from "@/lib/providerSession";
import { useJobs } from "@/lib/useJobs";
import { colors, spacing, typography } from "@/theme";

/** The home screen: what's on today, what's coming up this week, and what just wrapped up. Offers
 * live behind the notification bell rather than cluttering the day view — a "new request" still
 * shows up inline if it happens to fall on the selected day (so you don't miss one scheduled for
 * today), but answering it happens on its own screen. */
export function CalendarScreen() {
  const session = useProviderSession();
  const { data: jobs, error, isRefreshing, refresh } = useJobs(session?.providerId);
  const [selectedDate, setSelectedDate] = useState(() => new Date());
  const [isActive, setIsActive] = useState(session?.isActive ?? true);
  const [isTogglingActive, setIsTogglingActive] = useState(false);

  const all = jobs ?? [];
  const pendingOffers = all.filter((job) => job.status === "new");
  const dayJobs = all.filter((job) => new Date(job.scheduledAt).toDateString() === selectedDate.toDateString());
  const recent = all
    .filter((job) => job.status === "completed")
    .sort((a, b) => b.raw.updatedAt.localeCompare(a.raw.updatedAt))
    .slice(0, 5);

  const datesWithJobs = all.map((job) => new Date(job.scheduledAt));

  async function toggleActive(next: boolean) {
    if (!session) return;
    setIsActive(next);
    setIsTogglingActive(true);
    try {
      await setProviderActive(session.providerId, next);
      await updateCachedIsActive(next);
    } catch (caught) {
      setIsActive(!next);
      Alert.alert("Couldn't update", caught instanceof Error ? caught.message : "Try again.");
    } finally {
      setIsTogglingActive(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <DemoBanner />
      <PendingBanner />

      <View style={styles.header}>
        <View style={styles.identity}>
          <View style={styles.nameRow}>
            <Text style={styles.name} numberOfLines={1}>
              {session?.name ?? ""}
            </Text>
            {session?.verificationStatus === "Verified" ? <VerifiedBadge /> : null}
          </View>
          <Text style={styles.zone} numberOfLines={1}>
            {session?.primaryZoneName ?? "No coverage zone yet"}
          </Text>
        </View>

        <View style={styles.headerActions}>
          <Pressable
            accessibilityRole="button"
            onPress={() => router.push("/offers")}
            style={styles.bell}
            hitSlop={8}
          >
            <Ionicons name="notifications-outline" size={20} color={colors.text} />
            {pendingOffers.length > 0 ? (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{pendingOffers.length}</Text>
              </View>
            ) : null}
          </Pressable>
          <AvailabilityToggle
            isActive={isActive}
            onChange={(v) => void toggleActive(v)}
            isBusy={isTogglingActive}
            disabled={session?.verificationStatus !== "Verified"}
          />
        </View>
      </View>

      <WeekStrip selectedDate={selectedDate} onSelect={setSelectedDate} datesWithJobs={datesWithJobs} />

      {error ? <ErrorNotice message={error} onRetry={refresh} /> : null}

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={refresh} tintColor={colors.primary} />}
      >
        <Text style={styles.dayHeading}>{formatDayHeading(selectedDate)}</Text>

        {dayJobs.length === 0 ? (
          <EmptyState icon="calendar-outline" title="Nothing scheduled" message="Jobs for this day will show up here." />
        ) : (
          <View style={styles.list}>
            {dayJobs
              .sort((a, b) => a.scheduledAt.localeCompare(b.scheduledAt))
              .map((job) => (
                <JobCard
                  key={job.taskId}
                  job={job}
                  businessType={session?.businessType ?? "shop"}
                  onPress={() =>
                    router.push({
                      pathname: "/job/[taskId]",
                      params: { taskId: job.taskId, ...(job.offerId ? { offerId: job.offerId } : {}) },
                    })
                  }
                />
              ))}
          </View>
        )}

        {recent.length > 0 ? (
          <View style={styles.recentSection}>
            <Text style={styles.sectionTitle}>RECENT ERRANDS</Text>
            <View style={styles.list}>
              {recent.map((job) => (
                <JobSummaryRow
                  key={job.taskId}
                  title={job.title}
                  subtitle={[job.customerName, new Date(job.raw.updatedAt).toLocaleDateString("en-US", { weekday: "short" })]
                    .filter(Boolean)
                    .join(" · ")}
                  price={job.price}
                  onPress={() => router.push({ pathname: "/job/[taskId]", params: { taskId: job.taskId } })}
                />
              ))}
            </View>
          </View>
        ) : null}
      </ScrollView>
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
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
  },
  identity: {
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
  zone: {
    ...typography.bodySmall,
    color: colors.textMuted,
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  bell: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surface,
  },
  badge: {
    position: "absolute",
    top: -2,
    right: -2,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    paddingHorizontal: 3,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.danger,
  },
  badgeText: {
    color: colors.textOnPrimary,
    fontSize: 10,
    fontWeight: "700",
  },
  content: {
    padding: spacing.md,
    paddingBottom: spacing.xl,
    gap: spacing.lg,
  },
  dayHeading: {
    ...typography.label,
    color: colors.primaryDark,
    fontWeight: "700",
  },
  list: {
    gap: spacing.sm,
  },
  recentSection: {
    gap: spacing.sm,
  },
  sectionTitle: {
    ...typography.label,
    color: colors.textMuted,
    fontWeight: "700",
  },
});
