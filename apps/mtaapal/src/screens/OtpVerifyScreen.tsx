import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { OutlineButton } from "@/components/OutlineButton";
import { PrimaryButton } from "@/components/PrimaryButton";
import { TextField } from "@/components/TextField";
import { activate, verifyLogin } from "@/lib/auth";
import { colors, spacing, typography } from "@/theme";

export function OtpVerifyScreen() {
  const { identifier, mode } = useLocalSearchParams<{ identifier: string; mode: "login" | "activation" }>();
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | undefined>();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submit = async () => {
    const trimmed = code.trim();
    if (!trimmed || !identifier) return;

    setIsSubmitting(true);
    setError(undefined);
    try {
      if (mode === "activation") {
        await activate(identifier, trimmed);
      } else {
        await verifyLogin(identifier, trimmed);
      }
      router.replace("/(drawer)");
    } catch (e) {
      console.error(e);
      setError("Invalid or expired code — try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <View style={styles.content}>
        <Text style={styles.heading}>Enter the code</Text>
        <Text style={styles.body}>We sent a code to {identifier}.</Text>

        <TextField
          label="Code"
          value={code}
          onChangeText={setCode}
          error={error}
          keyboardType="number-pad"
          maxLength={6}
          placeholder="123456"
        />
      </View>

      <View style={styles.footer}>
        <PrimaryButton
          label={isSubmitting ? "Verifying…" : "Verify"}
          onPress={submit}
          disabled={isSubmitting || !code.trim()}
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
