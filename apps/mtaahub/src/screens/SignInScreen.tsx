import { router } from "expo-router";
import { useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from "react-native";

import { PrimaryButton } from "@/components/PrimaryButton";
import { TextField } from "@/components/TextField";
import { NotOnboardedError, requestOtp } from "@/lib/auth";
import { colors, spacing, typography } from "@/theme";

export function SignInScreen() {
  const [phone, setPhone] = useState("");
  const [error, setError] = useState<string | undefined>();
  const [isBusy, setIsBusy] = useState(false);

  async function submit() {
    const identifier = phone.trim();
    if (!identifier) {
      setError("Enter the phone number you're registered with.");
      return;
    }

    setIsBusy(true);
    setError(undefined);
    try {
      await requestOtp(identifier);
      router.push({ pathname: "/auth/verify", params: { phone: identifier } });
    } catch (caught) {
      // No account at all is a different situation from a bad code, and it has a different remedy:
      // MtaaHub has no sign-up, so this person needs ops, not another attempt.
      if (caught instanceof NotOnboardedError) {
        router.push({ pathname: "/auth/not-onboarded", params: { phone: identifier } });
        return;
      }
      setError(caught instanceof Error ? caught.message : "Something went wrong.");
    } finally {
      setIsBusy(false);
    }
  }

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Text style={styles.title}>MtaaPal for Business</Text>
          <Text style={styles.subtitle}>
            For the shops and runners who get MtaaPal orders done. Sign in with the number you were
            registered with.
          </Text>
        </View>

        <TextField
          label="Phone number"
          value={phone}
          onChangeText={setPhone}
          placeholder="+254 7XX XXX XXX"
          keyboardType="phone-pad"
          autoComplete="tel"
          textContentType="telephoneNumber"
          autoCapitalize="none"
          error={error}
          onSubmitEditing={() => void submit()}
          returnKeyType="go"
        />

        <PrimaryButton label="Send code" onPress={() => void submit()} isBusy={isBusy} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flexGrow: 1,
    justifyContent: "center",
    gap: spacing.lg,
    padding: spacing.lg,
  },
  header: {
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  title: {
    ...typography.headingLarge,
    color: colors.text,
  },
  subtitle: {
    ...typography.body,
    color: colors.textMuted,
  },
});
