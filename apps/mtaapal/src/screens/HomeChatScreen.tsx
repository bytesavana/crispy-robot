import { Ionicons } from "@expo/vector-icons";
import { DrawerToggleButton } from "expo-router/drawer";
import { useState } from "react";
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { CartPanel } from "@/components/CartPanel";
import { CartSidebar } from "@/components/CartSidebar";
import { ChatMessageItem } from "@/components/ChatMessages";
import { QuickActionCard } from "@/components/QuickActionCard";
import { ZonePill } from "@/components/ZonePill";
import { startNewConversation } from "@/lib/agUiClient";
import { useCart } from "@/lib/useCart";
import { useMtaaPalChat } from "@/lib/useMtaaPalChat";
import { colors, radii, spacing, typography } from "@/theme";

const WIDE_SCREEN_BREAKPOINT = 768;

const quickActions = [
  { label: "Pick up groceries from Naivas", dotColor: colors.primary },
  { label: "Drop off dry cleaning", dotColor: colors.accentBlue },
  { label: "Stand in line at Huduma Centre", dotColor: colors.primary },
  { label: "Refill my prescription", dotColor: colors.accentBlue },
  { label: "Book a mama fua for Saturday", dotColor: colors.primary },
  { label: "Send a package across town", dotColor: colors.accentBlue },
];

export function HomeChatScreen() {
  const { messages, sendMessage } = useMtaaPalChat();
  const cart = useCart();
  const [input, setInput] = useState("");
  const { width } = useWindowDimensions();
  const isWideScreen = width >= WIDE_SCREEN_BREAKPOINT;

  const submit = (text: string) => {
    sendMessage(text);
    setInput("");
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <DrawerToggleButton tintColor={colors.text} />
        <View style={styles.brandRow}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>M</Text>
          </View>
          <Text style={styles.brand}>MtaaPal</Text>
        </View>
        <Pressable
          hitSlop={12}
          onPress={() => {
            startNewConversation();
            setInput("");
          }}
        >
          <Ionicons name="add" size={22} color={colors.text} />
        </Pressable>
      </View>

      <ZonePill label="Kilimani · 5 services available" />

      <View style={styles.body}>
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          keyboardVerticalOffset={Platform.OS === "ios" ? 100 : 0}
        >
          {messages.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.greeting}>{"Good evening.\nWhat can I help with?"}</Text>
              <View style={styles.grid}>
                {quickActions.map((action) => (
                  <Pressable
                    key={action.label}
                    onPress={() => submit(action.label)}
                    style={({ pressed }) => [styles.cardWrapper, pressed && styles.cardPressed]}
                  >
                    <QuickActionCard label={action.label} dotColor={action.dotColor} />
                  </Pressable>
                ))}
              </View>
            </View>
          ) : (
            <FlatList
              style={styles.flex}
              contentContainerStyle={styles.messagesContent}
              data={messages}
              keyExtractor={(message) => message.id}
              renderItem={({ item }) => <ChatMessageItem message={item} />}
            />
          )}

          {!isWideScreen && <CartPanel cart={cart} />}

          <View style={styles.composer}>
            <TextInput
              style={styles.input}
              placeholder="Message MtaaPal..."
              placeholderTextColor={colors.textMuted}
              value={input}
              onChangeText={setInput}
              onSubmitEditing={() => submit(input)}
              returnKeyType="send"
            />
            <Pressable style={styles.sendButton} onPress={() => submit(input)}>
              <Ionicons name="arrow-up" size={18} color={colors.textOnPrimary} />
            </Pressable>
          </View>
        </KeyboardAvoidingView>

        {isWideScreen && cart ? <CartSidebar cart={cart} /> : null}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  flex: {
    flex: 1,
  },
  body: {
    flex: 1,
    flexDirection: "row",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  avatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    color: colors.textOnPrimary,
    fontSize: 12,
    fontWeight: "700",
  },
  brand: {
    ...typography.body,
    fontWeight: "700",
    color: colors.text,
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: spacing.lg,
  },
  greeting: {
    ...typography.headingLarge,
    fontSize: 24,
    lineHeight: 30,
    color: colors.text,
    textAlign: "center",
    marginBottom: spacing.lg,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  cardWrapper: {
    flexBasis: "47%",
    flexGrow: 1,
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardPressed: {
    opacity: 0.7,
  },
  messagesContent: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    gap: spacing.xs,
  },
  composer: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  input: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    color: colors.text,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
});
