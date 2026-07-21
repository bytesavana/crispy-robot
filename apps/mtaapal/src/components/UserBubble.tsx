import { Image, StyleSheet, Text, View } from "react-native";

import { colors, radii, spacing, typography } from "@/theme";

type UserBubbleProps = {
  text: string;
  imageUris?: string[];
};

export function UserBubble({ text, imageUris }: UserBubbleProps) {
  // A single photo reads better large; once there's more than one, shrink them into a
  // grid so the bubble doesn't grow to an unwieldy height.
  const imageStyle = imageUris && imageUris.length > 1 ? styles.imageSmall : styles.image;

  return (
    <View style={styles.container}>
      {imageUris && imageUris.length > 0 ? (
        <View style={styles.imageGrid}>
          {imageUris.map((uri) => (
            <Image key={uri} source={{ uri }} style={imageStyle} />
          ))}
        </View>
      ) : null}
      {text ? <Text style={styles.text}>{text}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignSelf: "flex-end",
    backgroundColor: colors.accentPeach,
    borderRadius: radii.md,
    borderTopRightRadius: spacing.xs,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    marginVertical: spacing.xs,
    maxWidth: "85%",
  },
  text: {
    ...typography.body,
    color: colors.text,
  },
  imageGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  image: {
    width: 200,
    height: 200,
    borderRadius: radii.md,
  },
  imageSmall: {
    width: 92,
    height: 92,
    borderRadius: radii.sm,
  },
});
