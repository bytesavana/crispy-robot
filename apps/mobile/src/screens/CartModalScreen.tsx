import { router } from "expo-router";

import { CartSheet } from "@/components/CartSheet";
import { useCart } from "@/lib/useCart";

export function CartModalScreen() {
  const cart = useCart();

  if (!cart) {
    router.back();
    return null;
  }

  return <CartSheet cart={cart} onCollapse={() => router.back()} />;
}
