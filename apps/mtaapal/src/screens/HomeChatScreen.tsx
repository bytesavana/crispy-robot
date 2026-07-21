import { Ionicons } from "@expo/vector-icons";
import { DrawerToggleButton } from "expo-router/drawer";
import { useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from "react-native";
import Animated, { useAnimatedKeyboard, useAnimatedStyle } from "react-native-reanimated";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

import { AttachMenu } from "@/components/AttachMenu";
import { CartPanel } from "@/components/CartPanel";
import { CartSidebar } from "@/components/CartSidebar";
import { ChatMessageItem } from "@/components/ChatMessages";
import { QuickActionCard } from "@/components/QuickActionCard";
import { TypingIndicator } from "@/components/TypingIndicator";
import { ZoneBanner } from "@/components/ZoneBanner";
import { ZonePill } from "@/components/ZonePill";
import { startNewConversation } from "@/lib/agUiClient";
import { pickChatImageFromCamera, pickChatImagesFromLibrary, type PickedChatImage } from "@/lib/pickChatImage";
import { useCart } from "@/lib/useCart";
import { useMtaaPalChat } from "@/lib/useMtaaPalChat";
import { useZoneName } from "@/lib/zoneResolution";
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
  const { messages, isRunning, sendMessage } = useMtaaPalChat();
  const cart = useCart();
  const zoneName = useZoneName();
  const [input, setInput] = useState("");
  const [pendingImages, setPendingImages] = useState<PickedChatImage[]>([]);
  const [attachMenuOpen, setAttachMenuOpen] = useState(false);
  const { width } = useWindowDimensions();
  const isWideScreen = width >= WIDE_SCREEN_BREAKPOINT;

  // On Android, RN's core Keyboard module (which KeyboardAvoidingView's "height"/"padding"
  // behaviors rely on) doesn't track the keyboard reliably once edge-to-edge is enabled —
  // the window no longer resizes, so KeyboardAvoidingView never sees a size change. Reanimated's
  // useAnimatedKeyboard reads the real WindowInsets animation instead, so it stays accurate.
  const keyboard = useAnimatedKeyboard();
  const insets = useSafeAreaInsets();
  const androidKeyboardPadding = useAnimatedStyle(() => ({
    // keyboard.height is measured from the very bottom of the screen, which already overlaps
    // the bottom safe-area inset (nav bar) that SafeAreaView reserves when the keyboard is
    // closed. Subtract it so the composer isn't pushed up by that inset twice.
    paddingBottom:
      Platform.OS === "android" ? Math.max(keyboard.height.value - insets.bottom, 0) : 0,
  }));

  const submit = (text: string) => {
    if (!text.trim() && pendingImages.length === 0) return;
    sendMessage(text, pendingImages.length > 0 ? pendingImages : undefined);
    setInput("");
    setPendingImages([]);
  };

  const attachFromCamera = async () => {
    setAttachMenuOpen(false);
    const images = await pickChatImageFromCamera();
    if (images.length > 0) setPendingImages((current) => [...current, ...images].slice(0, 4));
  };

  const attachFromLibrary = async () => {
    setAttachMenuOpen(false);
    const images = await pickChatImagesFromLibrary();
    if (images.length > 0) setPendingImages((current) => [...current, ...images].slice(0, 4));
  };

  const removePendingImage = (uri: string) => {
    setPendingImages((current) => current.filter((image) => image.uri !== uri));
  };

  // The assistant's message only appears in `messages` once the first streamed token arrives
  // (see useMtaaPalChat's onTextMessageContentEvent), so this is the gap a typing indicator fills.
  const showTypingIndicator = isRunning && messages[messages.length - 1]?.role !== "assistant";

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
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
            setPendingImages([]);
            setAttachMenuOpen(false);
          }}
        >
          <Ionicons name="add" size={22} color={colors.text} />
        </Pressable>
      </View>

      {zoneName ? <ZonePill label={zoneName} /> : null}
      <ZoneBanner />

      <View style={styles.body}>
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          keyboardVerticalOffset={Platform.OS === "ios" ? 100 : 0}
        >
          <Animated.View style={[styles.flex, androidKeyboardPadding]}>
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
                ListFooterComponent={showTypingIndicator ? <TypingIndicator /> : null}
              />
            )}

            {!isWideScreen && <CartPanel cart={cart} />}

            <View style={styles.composerArea}>
              {attachMenuOpen ? (
                <View style={styles.attachMenuOverlay}>
                  <AttachMenu onCamera={attachFromCamera} onPhoto={attachFromLibrary} />
                </View>
              ) : null}

              {pendingImages.length > 0 ? (
                <View style={styles.previewRow}>
                  {pendingImages.map((image) => (
                    <View key={image.uri} style={styles.previewChip}>
                      <Image source={{ uri: image.uri }} style={styles.previewThumbnail} />
                      <Pressable
                        hitSlop={8}
                        style={styles.previewRemove}
                        onPress={() => removePendingImage(image.uri)}
                      >
                        <Ionicons name="close" size={14} color={colors.textOnPrimary} />
                      </Pressable>
                    </View>
                  ))}
                </View>
              ) : null}

              <View style={styles.composer}>
                <Pressable hitSlop={8} onPress={() => setAttachMenuOpen((open) => !open)}>
                  <Ionicons name={attachMenuOpen ? "close" : "add"} size={26} color={colors.textMuted} />
                </Pressable>
                <TextInput
                  style={styles.input}
                  placeholder="Message MtaaPal..."
                  placeholderTextColor={colors.textMuted}
                  value={input}
                  onChangeText={setInput}
                  onSubmitEditing={() => submit(input)}
                  onFocus={() => setAttachMenuOpen(false)}
                  returnKeyType="send"
                />
                <Pressable
                  style={styles.sendButton}
                  onPress={() => submit(input)}
                  disabled={isRunning}
                >
                  {isRunning ? (
                    <ActivityIndicator size="small" color={colors.textOnPrimary} />
                  ) : (
                    <Ionicons name="arrow-up" size={18} color={colors.textOnPrimary} />
                  )}
                </Pressable>
              </View>
            </View>
          </Animated.View>
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
  composerArea: {
    position: "relative",
  },
  attachMenuOverlay: {
    position: "absolute",
    left: spacing.lg,
    right: spacing.lg,
    bottom: "100%",
    marginBottom: spacing.sm,
    zIndex: 10,
    elevation: 10,
    shadowColor: colors.text,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
  },
  composer: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  previewRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.xs,
  },
  previewChip: {
    alignSelf: "flex-start",
  },
  previewThumbnail: {
    width: 56,
    height: 56,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  previewRemove: {
    position: "absolute",
    top: -6,
    right: -6,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.text,
    alignItems: "center",
    justifyContent: "center",
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
