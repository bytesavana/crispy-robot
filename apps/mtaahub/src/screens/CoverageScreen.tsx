import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Alert, ScrollView, StyleSheet, Switch, Text, View } from "react-native";

import { ErrorNotice } from "@/components/ErrorNotice";
import { OutlineButton } from "@/components/OutlineButton";
import { PrimaryButton } from "@/components/PrimaryButton";
import { Screen } from "@/components/Screen";
import { ServiceChip } from "@/components/ServiceChip";
import { TextField } from "@/components/TextField";
import { listCategories } from "@/lib/api/catalog";
import { addCoverage, deactivateCoverage, listCoverage } from "@/lib/api/providers";
import type { CoverageStatus, ProviderCoverage } from "@/lib/api/types";
import { useProviderSession } from "@/lib/providerSession";
import { queryKeys } from "@/lib/queryKeys";
import { colors, radii, spacing, typography } from "@/theme";

/** What a shop or runner is set up to be offered: which zones, and which of the platform's
 * categories they cover in each. Toggling a category off deactivates that coverage row rather than
 * deleting it, so re-enabling later doesn't lose the zone/category pairing. */
export function CoverageScreen() {
  const session = useProviderSession();
  const providerId = session?.providerId;
  const queryClient = useQueryClient();

  const coverageKey = queryKeys.coverage(providerId ?? "");
  const { data: coverage, error, refetch } = useQuery({
    queryKey: coverageKey,
    queryFn: () => listCoverage(providerId!),
    enabled: !!providerId,
    refetchInterval: 60_000,
  });
  const errorMessage = error instanceof Error ? error.message : null;

  const { data: categories } = useQuery({
    queryKey: queryKeys.categories(),
    queryFn: listCategories,
    staleTime: Infinity,
  });

  const [addingZone, setAddingZone] = useState(false);
  const [newZoneName, setNewZoneName] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

  const toggleMutation = useMutation({
    mutationFn: async ({ row, nextValue }: { row: ProviderCoverage; nextValue: boolean }) => {
      if (nextValue) {
        const result = await addCoverage(providerId!, row.zoneName, row.categoryCode);
        if (result.error) throw new Error(result.error);
      } else {
        await deactivateCoverage(providerId!, row.id);
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: coverageKey }),
    onError: (caught) => Alert.alert("Couldn't update", caught instanceof Error ? caught.message : "Try again."),
  });
  const busyId = toggleMutation.isPending ? (toggleMutation.variables?.row.id ?? null) : null;

  const addZoneMutation = useMutation({
    mutationFn: async (codes: string[]) => {
      for (const code of codes) {
        const result = await addCoverage(providerId!, newZoneName.trim(), code);
        if (result.error) throw new Error(result.error);
      }
    },
    onSuccess: () => {
      setAddingZone(false);
      setNewZoneName("");
      setSelectedCategories([]);
      queryClient.invalidateQueries({ queryKey: coverageKey });
    },
    onError: (caught) => Alert.alert("Couldn't add that zone", caught instanceof Error ? caught.message : "Try again."),
  });

  const rows = coverage ?? [];
  const byZone = new Map<string, ProviderCoverage[]>();
  for (const row of rows) {
    byZone.set(row.zoneName, [...(byZone.get(row.zoneName) ?? []), row]);
  }

  function categoryName(code: string): string {
    return categories?.find((c) => c.code === code)?.name ?? code;
  }

  function toggleSelected(code: string) {
    setSelectedCategories((current) => (current.includes(code) ? current.filter((c) => c !== code) : [...current, code]));
  }

  function submitZone() {
    if (!providerId || !newZoneName.trim() || selectedCategories.length === 0) {
      Alert.alert("Almost there", "Name the zone and pick at least one service.");
      return;
    }
    addZoneMutation.mutate(selectedCategories);
  }

  return (
    <Screen title="Coverage & services">
      {errorMessage ? <ErrorNotice message={errorMessage} onRetry={refetch} /> : null}

      <ScrollView contentContainerStyle={styles.content}>
        {[...byZone.entries()].map(([zoneName, zoneRows]) => (
          <View key={zoneName} style={styles.zoneCard}>
            <Text style={styles.zoneTitle}>{zoneName}</Text>
            {zoneRows.map((row) => (
              <View key={row.id} style={styles.serviceRow}>
                <View style={styles.serviceInfo}>
                  <Text style={styles.serviceLabel}>{categoryName(row.categoryCode)}</Text>
                  <CoverageStatusPill status={row.status} note={row.reviewNote} />
                </View>
                <Switch
                  value={row.isActive}
                  onValueChange={(nextValue) => toggleMutation.mutate({ row, nextValue })}
                  disabled={busyId === row.id}
                  trackColor={{ false: colors.border, true: colors.success }}
                  thumbColor={colors.surface}
                />
              </View>
            ))}
          </View>
        ))}

        {addingZone ? (
          <View style={styles.zoneCard}>
            <TextField label="Zone name" value={newZoneName} onChangeText={setNewZoneName} placeholder="e.g. Kilimani" />
            <Text style={styles.pickerLabel}>Services offered here</Text>
            <View style={styles.chipRow}>
              {(categories ?? []).map((category) => (
                <ServiceChip
                  key={category.code}
                  label={category.name}
                  selected={selectedCategories.includes(category.code)}
                  onPress={() => toggleSelected(category.code)}
                />
              ))}
            </View>
            <PrimaryButton label="Add zone" onPress={submitZone} isBusy={addZoneMutation.isPending} />
            <OutlineButton label="Cancel" onPress={() => setAddingZone(false)} disabled={addZoneMutation.isPending} />
          </View>
        ) : (
          <OutlineButton label="+ Add coverage zone" onPress={() => setAddingZone(true)} />
        )}
      </ScrollView>
    </Screen>
  );
}

const STATUS_LABEL: Record<CoverageStatus, string> = {
  Pending: "Pending review",
  Approved: "Approved",
  Rejected: "Rejected",
};

function CoverageStatusPill({ status, note }: { status: CoverageStatus; note: string | null }) {
  const tone =
    status === "Approved" ? styles.pillApproved : status === "Rejected" ? styles.pillRejected : styles.pillPending;
  return (
    <View style={styles.pillRow}>
      <View style={[styles.pill, tone]}>
        <Text style={styles.pillText}>{STATUS_LABEL[status]}</Text>
      </View>
      {status === "Rejected" && note ? <Text style={styles.pillNote}>{note}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: spacing.md,
    paddingBottom: spacing.xl,
    gap: spacing.md,
  },
  zoneCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.md,
    gap: spacing.sm,
  },
  zoneTitle: {
    ...typography.title,
    color: colors.text,
  },
  serviceRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
    paddingVertical: spacing.xs,
  },
  serviceInfo: {
    flex: 1,
    gap: 2,
  },
  serviceLabel: {
    ...typography.body,
    color: colors.text,
  },
  pillRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    flexWrap: "wrap",
  },
  pill: {
    borderRadius: radii.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 1,
  },
  pillPending: {
    backgroundColor: colors.accentAmber,
  },
  pillApproved: {
    backgroundColor: colors.accentGreen,
  },
  pillRejected: {
    backgroundColor: colors.dangerBackground,
  },
  pillText: {
    ...typography.label,
    fontWeight: "700",
    color: colors.text,
  },
  pillNote: {
    ...typography.bodySmall,
    color: colors.textMuted,
    flexShrink: 1,
  },
  pickerLabel: {
    ...typography.label,
    color: colors.textMuted,
    fontWeight: "700",
    marginTop: spacing.xs,
  },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
});
