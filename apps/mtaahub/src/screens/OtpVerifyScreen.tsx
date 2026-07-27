import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { PrimaryButton } from "@/components/PrimaryButton";
import { TextField } from "@/components/TextField";
import { requestOtp, verifyLogin } from "@/lib/auth";
import { colors, spacing, typography } from "@/theme";

export function OtpVerifyScreen() {
  const { phone } = useLocalSearchParams<{ phone: string }>();
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | undefined>();
  const [isBusy, setIsBusy] = useState(false);
  const [resent, setResent] = useState(false);

  async function submit() {
    if (!code.trim()) {
      setError("Enter the code we sent you.");
      return;
    }

    setIsBusy(true);
    setError(undefined);
    try {
      await verifyLogin(phone, code.trim());
      // Back to the root, which resolves the provider and picks the runner or vendor app.
      router.replace("/");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Something went wrong.");
    } finally {
      setIsBusy(false);
    }
  }

  async function resend() {
    setError(undefined);
    try {
      await requestOtp(phone);
      setResent(true);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Couldn't resend the code.");
    }
  }

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Text style={styles.title}>Enter your code</Text>
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
          hint={resent ? "Code resent." : undefined}
          onSubmitEditing={() => void submit()}
          returnKeyType="go"
        />

        <PrimaryButton label="Sign in" onPress={() => void submit()} isBusy={isBusy} />

        <Pressable accessibilityRole="button" onPress={() => void resend()} hitSlop={8} style={styles.resend}>
          <Text style={styles.resendText}>Didn&apos;t get it? Send again</Text>
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
  resend: {
    alignSelf: "center",
    paddingVertical: spacing.sm,
  },
  resendText: {
    ...typography.bodySmall,
    color: colors.primaryLight,
    fontWeight: "600",
  },
});
