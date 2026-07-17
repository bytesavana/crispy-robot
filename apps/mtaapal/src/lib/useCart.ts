import { useEffect, useState, useSyncExternalStore } from "react";

import { getAgent, subscribeAgent } from "./agUiClient";
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
  const agent = useSyncExternalStore(subscribeAgent, getAgent, getAgent);
  const [cart, setCart] = useState<Cart | undefined>(() => extractCart(agent.state));

  // Re-sync whenever the agent singleton is rebound (new/resumed conversation). Adjusting
  // state during render (not in an effect) per React's guidance for "reset state when a
  // value changes" — avoids an extra commit/render pass from a useEffect setState.
  const [syncedAgent, setSyncedAgent] = useState(agent);
  if (agent !== syncedAgent) {
    setSyncedAgent(agent);
    setCart(extractCart(agent.state));
  }

  // Resubscribing is a genuine side effect (registering a callback with an external
  // object), so this part stays in an effect; it only calls setState from the callback,
  // never synchronously in the effect body.
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
