import { useEffect } from "react";
import { StyleSheet, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";

import { colors, spacing } from "@/theme";

const BOUNCE_DURATION = 350;
const DOT_STAGGER = 120;

function Dot({ delay }: { delay: number }) {
  const bounce = useSharedValue(0);

  useEffect(() => {
    bounce.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(1, { duration: BOUNCE_DURATION }),
          withTiming(0, { duration: BOUNCE_DURATION }),
        ),
        -1,
      ),
    );
  }, [bounce, delay]);

  const style = useAnimatedStyle(() => ({
    opacity: 0.3 + bounce.value * 0.7,
    transform: [{ translateY: -bounce.value * 4 }],
  }));

  return <Animated.View style={[styles.dot, style]} />;
}

export function TypingIndicator() {
  return (
    <View style={styles.container}>
      <Dot delay={0} />
      <Dot delay={DOT_STAGGER} />
      <Dot delay={DOT_STAGGER * 2} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingVertical: spacing.md,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: colors.textMuted,
  },
});
