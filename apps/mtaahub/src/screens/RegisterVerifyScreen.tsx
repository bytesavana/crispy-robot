import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { PrimaryButton } from "@/components/PrimaryButton";
import { TextField } from "@/components/TextField";
import { activateAndSignIn } from "@/lib/auth";
import { colors, spacing, typography } from "@/theme";

/** Confirms the activation code from registration, then drops the person straight into onboarding
 * signed in — the root resolver sees a signed-in user with no Provider record and routes to the
 * role picker. */
export function RegisterVerifyScreen() {
  const { phone } = useLocalSearchParams<{ phone: string }>();
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | undefined>();
  const [isBusy, setIsBusy] = useState(false);

  async function submit() {
    if (!code.trim()) {
      setError("Enter the code we sent you.");
      return;
    }

    setIsBusy(true);
    setError(undefined);
    try {
      await activateAndSignIn(phone, code.trim());
      router.replace("/");
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
          <Text style={styles.title}>Confirm your number</Text>
          <Text style={styles.subtitle}>We sent a code to {phone}.</Text>
        </View>

        <TextField
          label="Code"
          value={code}
          onChangeText={setCode}
          placeholder="123456"
          keyboardType="number-pad"
          autoComplete="one-time-code"
          textContentType="oneTimeCode"
          error={error}
          onSubmitEditing={() => void submit()}
          returnKeyType="go"
        />

        <PrimaryButton label="Confirm" onPress={() => void submit()} isBusy={isBusy} />

        <Pressable
          accessibilityRole="button"
          onPress={() => router.replace("/auth/sign-in")}
          hitSlop={8}
          style={styles.link}
        >
          <Text style={styles.linkText}>Wrong number? Start over</Text>
        </Pressable>
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
  },
  title: {
    ...typography.headingLarge,
    color: colors.text,
  },
  subtitle: {
    ...typography.body,
    color: colors.textMuted,
  },
  link: {
    alignSelf: "center",
    paddingVertical: spacing.sm,
  },
  linkText: {
    ...typography.bodySmall,
    color: colors.primaryLight,
    fontWeight: "600",
  },
});
