import { Ionicons } from "@expo/vector-icons";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";

import { colors, radii, spacing, typography } from "@/theme";

type AttachOption = {
  key: string;
  label: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  backgroundColor: string;
  onPress: () => void;
};

type AttachMenuProps = {
  onCamera: () => void;
  onPhoto: () => void;
};

function announceComingSoon(feature: string) {
  Alert.alert("Coming soon", `${feature} isn't available yet.`);
}

export function AttachMenu({ onCamera, onPhoto }: AttachMenuProps) {
  const options: AttachOption[] = [
    {
      key: "camera",
      label: "Camera",
      description: "Snap something now — an item, a receipt, a label.",
      icon: "camera-outline",
      iconColor: colors.primaryDark,
      backgroundColor: colors.accentPeach,
      onPress: onCamera,
    },
    {
      key: "photo",
      label: "Photo",
      description: "Choose from your library — shopping list, prescription, anything.",
      icon: "image-outline",
      iconColor: "#3A6B8A",
      backgroundColor: colors.accentBlue,
      onPress: onPhoto,
    },
    {
      key: "location",
      label: "Location",
      description: "Drop a pickup or drop-off pin for your runner.",
      icon: "location-outline",
      iconColor: "#3E7D3B",
      backgroundColor: colors.accentGreen,
      onPress: () => announceComingSoon("Location sharing"),
    },
    {
      key: "voice-note",
      label: "Voice note",
      description: "Record instructions instead of typing them out.",
      icon: "mic-outline",
      iconColor: colors.primaryDark,
      backgroundColor: colors.accentPeach,
      onPress: () => announceComingSoon("Voice notes"),
    },
  ];

  return (
    <View style={styles.panel}>
      <Text style={styles.title}>ADD TO YOUR MESSAGE</Text>
      {options.map((option, index) => (
        <Pressable
          key={option.key}
          onPress={option.onPress}
          style={({ pressed }) => [
            styles.item,
            index < options.length - 1 && styles.itemDivider,
            pressed && styles.itemPressed,
          ]}
        >
          <View style={[styles.iconCircle, { backgroundColor: option.backgroundColor }]}>
            <Ionicons name={option.icon} size={22} color={option.iconColor} />
          </View>
          <View style={styles.itemText}>
            <Text style={styles.itemLabel}>{option.label}</Text>
            <Text style={styles.itemDescription}>{option.description}</Text>
          </View>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  title: {
    ...typography.bodySmall,
    fontWeight: "700",
    color: colors.textMuted,
    letterSpacing: 0.5,
    marginBottom: spacing.sm,
  },
  item: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.md,
    paddingVertical: spacing.md,
  },
  itemDivider: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  itemPressed: {
    opacity: 0.6,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  itemText: {
    flex: 1,
    gap: 2,
  },
  itemLabel: {
    ...typography.body,
    fontWeight: "700",
    color: colors.text,
  },
  itemDescription: {
    ...typography.bodySmall,
    color: colors.textMuted,
  },
});
