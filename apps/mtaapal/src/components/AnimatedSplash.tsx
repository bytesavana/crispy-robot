import { useEffect } from "react";
import { StyleSheet, View } from "react-native";
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withTiming,
} from "react-native-reanimated";

import { MtaaPalLogo } from "@/components/MtaaPalLogo";
import { colors } from "@/theme";

type AnimatedSplashProps = {
  onFinish: () => void;
};

export function AnimatedSplash({ onFinish }: AnimatedSplashProps) {
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.85);
  const overlayOpacity = useSharedValue(1);

  useEffect(() => {
    opacity.value = withTiming(1, { duration: 450, easing: Easing.out(Easing.cubic) });
    scale.value = withTiming(1, { duration: 450, easing: Easing.out(Easing.cubic) });

    overlayOpacity.value = withDelay(
      950,
      withSequence(
        withTiming(0, { duration: 350, easing: Easing.in(Easing.cubic) }, (finished) => {
          if (finished) {
            runOnJS(onFinish)();
          }
        }),
      ),
    );
  }, [opacity, overlayOpacity, scale, onFinish]);

  const logoStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  const overlayStyle = useAnimatedStyle(() => ({
    opacity: overlayOpacity.value,
  }));

  return (
    <Animated.View style={[styles.overlay, overlayStyle]} pointerEvents="none">
      <View style={styles.center}>
        <Animated.View style={logoStyle}>
          <MtaaPalLogo width={220} height={73} />
        </Animated.View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.background,
    zIndex: 10,
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});
