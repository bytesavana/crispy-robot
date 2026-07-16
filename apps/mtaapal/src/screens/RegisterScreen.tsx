import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { OutlineButton } from "@/components/OutlineButton";
import { PrimaryButton } from "@/components/PrimaryButton";
import { TextField } from "@/components/TextField";
import { register } from "@/lib/auth";
import { colors, spacing, typography } from "@/theme";

export function RegisterScreen() {
  const params = useLocalSearchParams<{ phone?: string }>();
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState(params.phone ?? "");
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | undefined>();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const canSubmit = fullName.trim() && phone.trim();

  const submit = async () => {
    if (!canSubmit) return;

    setIsSubmitting(true);
    setError(undefined);
    try {
      await register(fullName.trim(), phone.trim(), email.trim() || undefined);
      router.push({
        pathname: "/auth/verify",
        params: { identifier: phone.trim(), mode: "activation" },
      });
    } catch (e) {
      console.error(e);
      setError("Couldn't create the account — check your details and try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <View style={styles.content}>
        <Text style={styles.heading}>Create your account</Text>
        <Text style={styles.body}>We will text a code to your phone to activate it.</Text>

        <TextField label="Full name" value={fullName} onChangeText={setFullName} autoComplete="name" />
        <TextField
          label="Phone"
          value={phone}
          onChangeText={setPhone}
          autoCapitalize="none"
          autoComplete="tel"
          keyboardType="phone-pad"
          placeholder="+254700000000"
        />
        <TextField
          label="Email (optional)"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          autoComplete="email"
          keyboardType="email-address"
          placeholder="you@example.com"
          error={error}
        />
      </View>

      <View style={styles.footer}>
        <PrimaryButton
          label={isSubmitting ? "Creating…" : "Create account"}
          onPress={submit}
          disabled={isSubmitting || !canSubmit}
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
