import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { StyleSheet, Text, View } from "react-native";

import { OutlineButton } from "@/components/OutlineButton";
import { signOut } from "@/lib/providerSession";
import { colors, spacing, typography } from "@/theme";

/**
 * IdentityServer has genuinely never heard of this number — not the same thing as "this account
 * exists but has no business profile yet", which now goes to the self-service onboarding flow
 * instead (see the "needsOnboarding" session state). This is the one gap self-service can't close:
 * only ops can create the IdentityServer account itself. Not fixable by retrying, which is why it's
 * a full screen rather than an inline error on the sign-in form.
 */
export function NotOnboardedScreen() {
  const { phone } = useLocalSearchParams<{ phone?: string }>();

  async function startOver() {
    await signOut();
    router.replace("/auth/sign-in");
  }

  return (
    <View style={styles.container}>
      <View style={styles.iconCircle}>
        <Ionicons name="person-add-outline" size={30} color={colors.textMuted} />
      </View>

      <Text style={styles.title}>Not set up yet</Text>
      <Text style={styles.message}>
        {phone ? `${phone} doesn't have a MtaaPal account.` : "This number doesn't have a MtaaPal account."}
        {"\n\n"}
        Ask the MtaaPal team to set one up, then come back and sign in with the same number.
      </Text>

      <OutlineButton label="Use a different number" onPress={() => void startOver()} style={styles.button} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.md,
    paddingHorizontal: spacing.xl,
    backgroundColor: colors.background,
  },
  iconCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.backgroundAlt,
    marginBottom: spacing.xs,
  },
  title: {
    ...typography.heading,
    color: colors.text,
  },
  message: {
    ...typography.body,
    color: colors.textMuted,
    textAlign: "center",
  },
  button: {
    alignSelf: "stretch",
    marginTop: spacing.md,
  },
});
