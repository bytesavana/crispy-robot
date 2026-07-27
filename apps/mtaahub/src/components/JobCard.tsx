import { Pressable, StyleSheet, Text, View } from "react-native";

import { formatTime } from "@/lib/format";
import { jobStatusLabel, jobStatusTone, type Job } from "@/lib/jobs";
import type { BusinessType } from "@/lib/api/types";
import { colors, radii, spacing, typography } from "@/theme";

import { StatusBadge } from "./StatusBadge";

type JobCardProps = {
  job: Job;
  businessType: BusinessType;
  onPress: () => void;
};

/** One job on the Calendar day list: appointment time, title and status up top, who it's for and
 * what they asked for underneath. No price here — Calendar is about the day's shape, Earnings is
 * about the money. */
export function JobCard({ job, businessType, onPress }: JobCardProps) {
  const note = job.raw.lineItems[0]?.displayName;

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      <View style={styles.header}>
        <Text style={styles.time}>
          {formatTime(job.scheduledAt)} · {job.title}
        </Text>
        <StatusBadge label={jobStatusLabel(job.status, businessType)} tone={jobStatusTone(job.status)} />
      </View>
      {job.customerName || note ? (
        <Text style={styles.detail} numberOfLines={2}>
          {[job.customerName, note].filter(Boolean).join(" · ")}
        </Text>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.md,
    gap: spacing.xs,
  },
  pressed: {
    backgroundColor: colors.backgroundAlt,
  },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: spacing.sm,
  },
  time: {
    ...typography.title,
    color: colors.text,
    flex: 1,
  },
  detail: {
    ...typography.bodySmall,
    color: colors.textMuted,
  },
});
