import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { PrimaryButton } from "@/components/PrimaryButton";
import { ServiceChip } from "@/components/ServiceChip";
import { TextField } from "@/components/TextField";
import { listCategories, listZones } from "@/lib/api/catalog";
import { createProvider } from "@/lib/api/providers";
import type { BusinessType, CatalogCategory, CatalogZone } from "@/lib/api/types";
import { getAccountInfo } from "@/lib/auth";
import { cacheProviderSession } from "@/lib/providerSession";
import { colors, radii, spacing, typography } from "@/theme";

export function BusinessInfoScreen() {
  const { phone, businessType } = useLocalSearchParams<{ phone: string; businessType: BusinessType }>();
  const [name, setName] = useState("");
  const [zones, setZones] = useState<CatalogZone[]>([]);
  const [zoneId, setZoneId] = useState<string | undefined>();
  const [categories, setCategories] = useState<CatalogCategory[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | undefined>();

  useEffect(() => {
    listCategories()
      .then(setCategories)
      .catch(() => setCategories([]));
    listZones()
      .then((z) => {
        setZones(z);
        if (z.length === 1) setZoneId(z[0].id);
      })
      .catch(() => setZones([]));
  }, []);

  function toggle(code: string) {
    setSelected((current) => (current.includes(code) ? current.filter((c) => c !== code) : [...current, code]));
  }

  async function submit() {
    if (!name.trim()) {
      setError("Give your business a name.");
      return;
    }
    const zone = zones.find((z) => z.id === zoneId);
    if (!zone) {
      setError("Pick the area you work in.");
      return;
    }
    if (selected.length === 0) {
      setError("Pick at least one service you offer.");
      return;
    }

    setError(undefined);
    setIsSubmitting(true);
    try {
      const account = await getAccountInfo();
      if (!account) {
        throw new Error("Your session expired — sign in again.");
      }

      const provider = await createProvider({
        name: name.trim(),
        kind: "Vendor",
        businessType,
        phone,
        coverage: selected.map((code) => ({ zoneName: zone.name, categoryCode: code })),
      });
      await cacheProviderSession(provider, phone);
      router.replace("/(app)/calendar");
    } catch (caught) {
      Alert.alert("Couldn't submit", caught instanceof Error ? caught.message : "Try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Pressable accessibilityRole="button" onPress={() => router.back()} hitSlop={8} style={styles.back}>
          <Ionicons name="chevron-back" size={20} color={colors.text} />
        </Pressable>
        <Text style={styles.title}>Tell us about your business</Text>
      </View>

      <TextField label="Business name" value={name} onChangeText={setName} placeholder="e.g. Faith W. — Mama Fua" error={error} />

      <View style={styles.phoneField}>
        <Text style={styles.label}>Primary phone</Text>
        <View style={styles.phoneRow}>
          <Text style={styles.phoneValue}>{phone}</Text>
          <View style={styles.primaryPill}>
            <Text style={styles.primaryPillText}>PRIMARY</Text>
          </View>
        </View>
      </View>

      <View>
        <Text style={styles.label}>Where do you work</Text>
        <View style={styles.chipRow}>
          {zones.map((zone) => (
            <ServiceChip key={zone.id} label={zone.name} selected={zoneId === zone.id} onPress={() => setZoneId(zone.id)} />
          ))}
        </View>
      </View>

      <View>
        <Text style={styles.label}>Pin your location</Text>
        <Pressable
          style={styles.mapPlaceholder}
          onPress={() => Alert.alert("Not set up yet", "Location pinning isn't wired up yet — the MtaaPal team can set this from the admin console.")}
        >
          <Ionicons name="location-outline" size={20} color={colors.textMuted} />
          <Text style={styles.mapPlaceholderText}>Tap to set your location later</Text>
        </Pressable>
      </View>

      <View>
        <Text style={styles.label}>What do you offer</Text>
        <View style={styles.chipRow}>
          {categories.map((category) => (
            <ServiceChip
              key={category.code}
              label={category.name}
              selected={selected.includes(category.code)}
              onPress={() => toggle(category.code)}
            />
          ))}
        </View>
      </View>

      <Text style={styles.reviewNote}>
        The MtaaPal team reviews new providers and each service before you start getting jobs.
      </Text>

      <PrimaryButton label="Submit for verification" onPress={() => void submit()} isBusy={isSubmitting} style={styles.submit} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    flexGrow: 1,
    padding: spacing.lg,
    gap: spacing.lg,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  back: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surface,
  },
  title: {
    ...typography.heading,
    fontSize: 22,
    color: colors.text,
    flexShrink: 1,
  },
  label: {
    ...typography.label,
    color: colors.textMuted,
    fontWeight: "700",
    marginBottom: spacing.xs,
  },
  phoneField: {
    gap: spacing.xs,
  },
  phoneRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  phoneValue: {
    ...typography.body,
    color: colors.text,
  },
  primaryPill: {
    backgroundColor: colors.accentGreen,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  primaryPillText: {
    ...typography.label,
    color: colors.success,
    fontWeight: "700",
  },
  mapPlaceholder: {
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xs,
    height: 120,
    borderRadius: radii.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderStyle: "dashed",
    backgroundColor: colors.backgroundAlt,
  },
  mapPlaceholderText: {
    ...typography.bodySmall,
    color: colors.textMuted,
  },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  reviewNote: {
    ...typography.bodySmall,
    color: colors.textMuted,
  },
  submit: {
    marginTop: spacing.md,
  },
});
