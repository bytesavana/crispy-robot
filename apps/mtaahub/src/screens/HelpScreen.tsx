import { Linking, ScrollView, StyleSheet, Text, View } from "react-native";

import { Screen } from "@/components/Screen";
import { colors, radii, spacing, typography } from "@/theme";

const FAQ = [
  {
    question: "When do I get paid?",
    answer: "Completed jobs are added to your available balance on the Earnings tab. Withdrawals are handled by the MtaaPal team.",
  },
  {
    question: "What happens if I decline a job?",
    answer: "It's offered to someone else, or the customer is told it isn't available. Declining doesn't affect your standing.",
  },
  {
    question: "How do I change what I offer or where?",
    answer: "Go to Profile → Coverage & services to turn services on or off, or add a new zone.",
  },
];

export function HelpScreen() {
  return (
    <Screen title="Help & support">
      <ScrollView contentContainerStyle={styles.content}>
        {FAQ.map((item) => (
          <View key={item.question} style={styles.card}>
            <Text style={styles.question}>{item.question}</Text>
            <Text style={styles.answer}>{item.answer}</Text>
          </View>
        ))}

        <View style={styles.card}>
          <Text style={styles.question}>Still stuck?</Text>
          <Text style={styles.answer} onPress={() => void Linking.openURL("mailto:support@mtaapal.com")}>
            support@mtaapal.com
          </Text>
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: spacing.md,
    paddingBottom: spacing.xl,
    gap: spacing.md,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.md,
    gap: spacing.xs,
  },
  question: {
    ...typography.title,
    color: colors.text,
  },
  answer: {
    ...typography.body,
    color: colors.textMuted,
  },
});
