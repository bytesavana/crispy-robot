import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { PrimaryButton } from "@/components/PrimaryButton";
import type { BusinessType } from "@/lib/api/types";
import { colors, radii, spacing, typography } from "@/theme";

const OPTIONS: { type: BusinessType; icon: keyof typeof Ionicons.glyphMap; title: string; description: string }[] = [
  {
    type: "shop",
    icon: "storefront-outline",
    title: "Shop or Vendor",
    description: "You stock goods and fulfill your own orders — groceries, water, food, car wash.",
  },
  {
    type: "runner",
    icon: "person-outline",
    title: "Independent Runner",
    description: "You take on jobs by appointment — cleaning, laundry, errands, repairs.",
  },
];

/**
 * The first onboarding step for a phone number with no Provider record yet — a real account
 * (IdentityServer already verified it via OTP), just not one the platform has a business profile
 * for. Picking here decides the label shown throughout the rest of the app (see
 * providerSession.ts's businessType); it's stored in Provider.Metadata, not a first-class field.
 */
export function RoleScreen() {
  const { phone } = useLocalSearchParams<{ phone: string }>();
  const [selected, setSelected] = useState<BusinessType>("runner");

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Text style={styles.title}>MtaaPal for Business</Text>
      <Text style={styles.subtitle}>How do you fulfill work for your neighbors?</Text>

      <View style={styles.options}>
        {OPTIONS.map((option) => {
          const isSelected = selected === option.type;
          return (
            <Pressable
              key={option.type}
              accessibilityRole="button"
              accessibilityState={{ selected: isSelected }}
              onPress={() => setSelected(option.type)}
              style={[styles.card, isSelected && styles.cardSelected]}
            >
              <View style={[styles.iconCircle, isSelected && styles.iconCircleSelected]}>
                <Ionicons name={option.icon} size={22} color={isSelected ? colors.primaryDark : colors.textMuted} />
              </View>
              <View style={styles.cardText}>
                <Text style={styles.cardTitle}>{option.title}</Text>
                <Text style={styles.cardDescription}>{option.description}</Text>
              </View>
            </Pressable>
          );
        })}
      </View>

      <PrimaryButton
        label="Continue"
        onPress={() =>
          router.push({ pathname: "/onboarding/business-info", params: { phone, businessType: selected } })
        }
        style={styles.continueButton}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    flexGrow: 1,
    padding: spacing.lg,
    gap: spacing.lg,
  },
  title: {
    ...typography.headingLarge,
    color: colors.text,
  },
  subtitle: {
    ...typography.body,
    color: colors.textMuted,
    marginTop: -spacing.sm,
  },
  options: {
    gap: spacing.md,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 1.5,
    borderColor: colors.border,
    padding: spacing.md,
  },
  cardSelected: {
    borderColor: colors.primary,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.backgroundAlt,
  },
  iconCircleSelected: {
    backgroundColor: colors.accentPeach,
  },
  cardText: {
    flex: 1,
    gap: 2,
  },
  cardTitle: {
    ...typography.title,
    color: colors.text,
  },
  cardDescription: {
    ...typography.bodySmall,
    color: colors.textMuted,
  },
  continueButton: {
    marginTop: "auto",
  },
});
