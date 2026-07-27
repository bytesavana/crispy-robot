import { router } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

import { PrimaryButton } from "@/components/PrimaryButton";
import { resolveProviderSession } from "@/lib/providerSession";
import { colors, spacing, typography } from "@/theme";

/**
 * The fork in the road: signed out, mid-onboarding (a real account with no business profile yet),
 * or ready for the calendar/earnings/profile app. Runner vs Shop-or-Vendor no longer forks
 * navigation — see providerSession.ts's businessType — so every "ready" session lands in the same
 * place, just with different labels on the way.
 */
export default function Index() {
  const [error, setError] = useState<string | null>(null);
  // Bumping this re-runs the effect, which is how "try again" retries without calling setState
  // synchronously inside the effect body.
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;

    resolveProviderSession()
      .then((state) => {
        if (cancelled) return;
        switch (state.status) {
          case "signedOut":
            router.replace("/auth/sign-in");
            return;
          case "needsOnboarding":
            router.replace({ pathname: "/onboarding/role", params: { phone: state.phone } });
            return;
          case "ready":
            router.replace("/(app)/calendar");
        }
      })
      .catch((caught: unknown) => {
        if (cancelled) return;
        setError(caught instanceof Error ? caught.message : "Something went wrong.");
      });

    return () => {
      cancelled = true;
    };
  }, [attempt]);

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.message}>{error}</Text>
        <PrimaryButton
          label="Try again"
          onPress={() => {
            setError(null);
            setAttempt((current) => current + 1);
          }}
          style={styles.button}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ActivityIndicator color={colors.primary} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.lg,
    paddingHorizontal: spacing.xl,
    backgroundColor: colors.background,
  },
  message: {
    ...typography.body,
    color: colors.textMuted,
    textAlign: "center",
  },
  button: {
    alignSelf: "stretch",
  },
});
