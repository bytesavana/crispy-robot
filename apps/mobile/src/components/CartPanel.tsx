import { router } from "expo-router";

import { CartBar } from "@/components/CartBar";
import type { Cart } from "@/lib/cartTypes";

type CartPanelProps = {
  cart: Cart | undefined;
};

export function CartPanel({ cart }: CartPanelProps) {
  if (!cart) return null;
  return <CartBar cart={cart} onPress={() => router.push("/cart-modal")} />;
}
