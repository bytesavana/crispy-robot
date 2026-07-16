import { router } from "expo-router";
import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { OutlineButton } from "@/components/OutlineButton";
import { PrimaryButton } from "@/components/PrimaryButton";
import { TextField } from "@/components/TextField";
import { NoAccountError, requestOtp } from "@/lib/auth";
import { colors, spacing, typography } from "@/theme";

const PHONE_LIKE = /^[+0-9]/;

export function SignInScreen() {
  const [identifier, setIdentifier] = useState("");
  const [error, setError] = useState<string | undefined>();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submit = async () => {
    const trimmed = identifier.trim();
    if (!trimmed) return;

    setIsSubmitting(true);
    setError(undefined);
    try {
      await requestOtp(trimmed);
      router.push({ pathname: "/auth/verify", params: { identifier: trimmed, mode: "login" } });
    } catch (e) {
      if (e instanceof NoAccountError) {
        router.push({
          pathname: "/auth/register",
          params: PHONE_LIKE.test(trimmed) ? { phone: trimmed } : {},
        });
        return;
      }
      console.error(e);
      setError("Couldn't send the code — try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <View style={styles.content}>
        <Text style={styles.heading}>Sign in</Text>
        <Text style={styles.body}>Enter your phone number or email — we will text or email you a code.</Text>

        <TextField
          label="Phone or email"
          value={identifier}
          onChangeText={setIdentifier}
          error={error}
          autoCapitalize="none"
          autoComplete="tel"
          keyboardType="email-address"
          placeholder="+254700000000 or you@example.com"
        />
      </View>

      <View style={styles.footer}>
        <PrimaryButton
          label={isSubmitting ? "Sending…" : "Continue"}
          onPress={submit}
          disabled={isSubmitting || !identifier.trim()}
        />
        <OutlineButton label="Cancel" onPress={() => router.back()} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: "space-between",
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xxl,
    gap: spacing.lg,
  },
  heading: {
    ...typography.headingLarge,
    fontSize: 26,
    lineHeight: 32,
    color: colors.text,
  },
  body: {
    ...typography.body,
    color: colors.textMuted,
  },
  footer: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
    gap: spacing.sm,
  },
});
