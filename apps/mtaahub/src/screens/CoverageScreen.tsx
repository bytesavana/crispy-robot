import { useCallback, useEffect, useState } from "react";
import { Alert, ScrollView, StyleSheet, Switch, Text, View } from "react-native";

import { ErrorNotice } from "@/components/ErrorNotice";
import { OutlineButton } from "@/components/OutlineButton";
import { PrimaryButton } from "@/components/PrimaryButton";
import { Screen } from "@/components/Screen";
import { ServiceChip } from "@/components/ServiceChip";
import { TextField } from "@/components/TextField";
import { listCategories } from "@/lib/api/catalog";
import { addCoverage, deactivateCoverage, listCoverage } from "@/lib/api/providers";
import type { CatalogCategory, ProviderCoverage } from "@/lib/api/types";
import { useProviderSession } from "@/lib/providerSession";
import { usePolling } from "@/lib/usePolling";
import { colors, radii, spacing, typography } from "@/theme";

/** What a shop or runner is set up to be offered: which zones, and which of the platform's
 * categories they cover in each. Toggling a category off deactivates that coverage row rather than
 * deleting it, so re-enabling later doesn't lose the zone/category pairing. */
export function CoverageScreen() {
  const session = useProviderSession();

  const fetcher = useCallback(async (): Promise<ProviderCoverage[]> => {
    if (!session) return [];
    return listCoverage(session.providerId);
  }, [session]);

  const { data: coverage, error, refresh } = usePolling(fetcher, 60_000);
  const [categories, setCategories] = useState<CatalogCategory[] | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [addingZone, setAddingZone] = useState(false);
  const [newZoneName, setNewZoneName] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [isSubmittingZone, setIsSubmittingZone] = useState(false);

  // Fetched once up front rather than only when "add zone" opens — the existing rows need real
  // category names too (see categoryName below), not just the picker for a new one.
  useEffect(() => {
    listCategories()
      .then(setCategories)
      .catch(() => setCategories([]));
  }, []);

  const rows = coverage ?? [];
  const byZone = new Map<string, ProviderCoverage[]>();
  for (const row of rows) {
    byZone.set(row.zoneName, [...(byZone.get(row.zoneName) ?? []), row]);
  }

  function categoryName(code: string): string {
    return categories?.find((c) => c.code === code)?.name ?? code;
  }

  async function toggle(row: ProviderCoverage, nextValue: boolean) {
    if (!session) return;
    setBusyId(row.id);
    try {
      if (nextValue) {
        const result = await addCoverage(session.providerId, row.zoneName, row.categoryCode);
        if (result.error) throw new Error(result.error);
      } else {
        await deactivateCoverage(session.providerId, row.id);
      }
      refresh();
    } catch (caught) {
      Alert.alert("Couldn't update", caught instanceof Error ? caught.message : "Try again.");
    } finally {
      setBusyId(null);
    }
  }


  function toggleSelected(code: string) {
    setSelectedCategories((current) => (current.includes(code) ? current.filter((c) => c !== code) : [...current, code]));
  }

  async function submitZone() {
    if (!session || !newZoneName.trim() || selectedCategories.length === 0) {
      Alert.alert("Almost there", "Name the zone and pick at least one service.");
      return;
    }
    setIsSubmittingZone(true);
    try {
      for (const code of selectedCategories) {
        const result = await addCoverage(session.providerId, newZoneName.trim(), code);
        if (result.error) throw new Error(result.error);
      }
      setAddingZone(false);
      setNewZoneName("");
      setSelectedCategories([]);
      refresh();
    } catch (caught) {
      Alert.alert("Couldn't add that zone", caught instanceof Error ? caught.message : "Try again.");
    } finally {
      setIsSubmittingZone(false);
    }
  }

  return (
    <Screen title="Coverage & services">
      {error ? <ErrorNotice message={error} onRetry={refresh} /> : null}

      <ScrollView contentContainerStyle={styles.content}>
        {[...byZone.entries()].map(([zoneName, zoneRows]) => (
          <View key={zoneName} style={styles.zoneCard}>
            <Text style={styles.zoneTitle}>{zoneName}</Text>
            {zoneRows.map((row) => (
              <View key={row.id} style={styles.serviceRow}>
                <Text style={styles.serviceLabel}>{categoryName(row.categoryCode)}</Text>
                <Switch
                  value={row.isActive}
                  onValueChange={(next) => void toggle(row, next)}
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
            <PrimaryButton label="Add zone" onPress={() => void submitZone()} isBusy={isSubmittingZone} />
            <OutlineButton label="Cancel" onPress={() => setAddingZone(false)} disabled={isSubmittingZone} />
          </View>
        ) : (
          <OutlineButton label="+ Add coverage zone" onPress={() => setAddingZone(true)} />
        )}
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
    paddingVertical: spacing.xs,
  },
  serviceLabel: {
    ...typography.body,
    color: colors.text,
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
