import { useEffect, useState } from "react";

import { getAgent } from "./agUiClient";
import type { Cart } from "./cartTypes";

function extractCart(state: unknown): Cart | undefined {
  const cart = (state as { cart?: Cart } | null | undefined)?.cart;
  return cart && cart.tasks.length > 0 ? cart : undefined;
}

/**
 * Mirrors the AG-UI agent's `cart` state surface. The backend re-syncs the full
 * cart from the orchestrator after every tool round and emits it as a state
 * snapshot, so `onStateChanged` (fired once the client has merged the latest
 * snapshot/delta into `agent.state`) is sufficient — no diffing needed.
 * Not persisted across app restarts, matching the rest of the session state.
 */
export function useCart(): Cart | undefined {
  const agent = getAgent();
  const [cart, setCart] = useState<Cart | undefined>(() => extractCart(agent.state));

  useEffect(() => {
    const { unsubscribe } = agent.subscribe({
      onStateChanged({ state }) {
        setCart(extractCart(state));
      },
    });
    return unsubscribe;
  }, [agent]);

  return cart;
}
