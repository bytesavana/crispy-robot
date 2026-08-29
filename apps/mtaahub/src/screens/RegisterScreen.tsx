import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from "react-native";

import { PrimaryButton } from "@/components/PrimaryButton";
import { TextField } from "@/components/TextField";
import { registerProvider } from "@/lib/auth";
import { colors, spacing, typography } from "@/theme";

/**
 * Self-service provider sign-up, reached when sign-in finds no account for a number. Creates a
 * provider-intent IdentityServer account (no linked Consumer) and sends an activation code; the
 * business profile itself is built in the onboarding flow after sign-in.
 */
export function RegisterScreen() {
  const params = useLocalSearchParams<{ phone?: string }>();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState(params.phone ?? "");
  const [error, setError] = useState<string | undefined>();
  const [isBusy, setIsBusy] = useState(false);

  async function submit() {
    const trimmedName = name.trim();
    const trimmedPhone = phone.trim();
    if (!trimmedName) {
      setError("Enter your name.");
      return;
    }
    if (!trimmedPhone) {
      setError("Enter your phone number.");
      return;
    }

    setIsBusy(true);
    setError(undefined);
    try {
      await registerProvider(trimmedName, trimmedPhone);
      router.push({ pathname: "/auth/register-verify", params: { phone: trimmedPhone } });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Something went wrong.");
    } finally {
      setIsBusy(false);
    }
  }

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Text style={styles.title}>Create your provider account</Text>
          <Text style={styles.subtitle}>
            We&apos;ll text you a code to confirm this number. Next you&apos;ll tell us what you offer and where.
          </Text>
        </View>

        <TextField label="Your name" value={name} onChangeText={setName} placeholder="e.g. Faith Wambui" autoCapitalize="words" />

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
