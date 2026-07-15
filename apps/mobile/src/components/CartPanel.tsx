import { useEffect, useState } from "react";
import { Dimensions, Modal, Pressable, StyleSheet } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";

import { CartBar } from "@/components/CartBar";
import { CartSheet } from "@/components/CartSheet";
import type { Cart } from "@/lib/cartTypes";

type CartPanelProps = {
  cart: Cart | undefined;
};

const SCREEN_HEIGHT = Dimensions.get("window").height;

export function CartPanel({ cart }: CartPanelProps) {
  const [expanded, setExpanded] = useState(false);
  const translateY = useSharedValue(SCREEN_HEIGHT);

  useEffect(() => {
    translateY.value = withTiming(expanded ? 0 : SCREEN_HEIGHT, { duration: 250 });
  }, [expanded, translateY]);

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  if (!cart) return null;

  return (
    <>
      <CartBar cart={cart} onPress={() => setExpanded(true)} />
      <Modal
        visible={expanded}
        transparent
        animationType="fade"
        onRequestClose={() => setExpanded(false)}
      >
        <Pressable style={styles.backdrop} onPress={() => setExpanded(false)} />
        <Animated.View style={[styles.sheetWrapper, sheetStyle]}>
          <CartSheet cart={cart} onCollapse={() => setExpanded(false)} />
        </Animated.View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "rgba(0, 0, 0, 0.4)",
  },
  sheetWrapper: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
  },
});
