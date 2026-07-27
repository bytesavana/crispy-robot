import { StyleSheet, Text, View } from "react-native";

import { formatKes } from "@/lib/format";
import type { Job } from "@/lib/jobs";
import { colors, radii, spacing, typography } from "@/theme";

import { CountdownPill } from "./CountdownPill";
import { OutlineButton } from "./OutlineButton";
import { PrimaryButton } from "./PrimaryButton";

type OfferActionCardProps = {
  job: Job;
  isBusy?: boolean;
  isExpired?: boolean;
  onAccept: () => void;
  onDecline: () => void;
  onExpired: () => void;
};

/** A job someone's asking you to take — the standalone Offers list, and the top of a "new request"
 * job detail. Terracotta Accept, because saying yes to new work is the growth-flavoured action;
 * everywhere else in the app that colour is reserved for onboarding and payouts. */
export function OfferActionCard({ job, isBusy, isExpired, onAccept, onDecline, onExpired }: OfferActionCardProps) {
  const note = job.raw.lineItems[0]?.displayName;

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.text}>
          <Text style={styles.title}>{job.title}</Text>
          <Text style={styles.subtitle} numberOfLines={2}>
            {[note, job.zoneName].filter(Boolean).join(" · ")}
          </Text>
          <Text style={styles.price}>{formatKes(job.price)}</Text>
        </View>
        {job.expiresAt ? <CountdownPill expiresAt={job.expiresAt} onExpired={onExpired} /> : null}
      </View>

      <View style={styles.actions}>
        <OutlineButton label="Decline" onPress={onDecline} disabled={isBusy} style={styles.action} />
        <PrimaryButton
          label={isExpired ? "Expired" : "Accept"}
          onPress={onAccept}
          isBusy={isBusy}
          disabled={isExpired}
          style={styles.action}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.md,
    gap: spacing.md,
  },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: spacing.sm,
  },
  text: {
    flex: 1,
    gap: spacing.xs,
  },
  title: {
    ...typography.title,
    fontSize: 17,
    color: colors.text,
  },
  subtitle: {
    ...typography.bodySmall,
    color: colors.textMuted,
  },
  price: {
    ...typography.numeric,
    fontWeight: "700",
    color: colors.primary,
    marginTop: spacing.xs,
  },
  actions: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  action: {
    flex: 1,
  },
});
