import { StyleSheet, Text, View } from "react-native";

import { colors, typography } from "@/theme";

type AvatarProps = {
  name: string;
  size?: number;
};

export function Avatar({ name, size = 48 }: AvatarProps) {
  const initial = name.trim().charAt(0).toUpperCase() || "?";

  return (
    <View style={[styles.circle, { width: size, height: size, borderRadius: size / 2 }]}>
      <Text style={[styles.initial, { fontSize: size * 0.42 }]}>{initial}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  circle: {
    backgroundColor: colors.accentPeach,
    alignItems: "center",
    justifyContent: "center",
  },
  initial: {
    ...typography.heading,
    color: colors.primaryDark,
  },
});
