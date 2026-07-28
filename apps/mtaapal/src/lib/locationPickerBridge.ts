import { useSyncExternalStore } from "react";

export type PickedAddress = {
  latitude: number;
  longitude: number;
  name?: string;
  source: "gps" | "picker" | "saved_address";
};

type Resolver = (value: PickedAddress | "cancelled") => void;

/**
 * Bridges the imperative `ask_customer_for_address` tool call (fired from deep
 * inside useMtaaPalChat's AG-UI subscriber, outside React) to the LocationPicker
 * component (rendered by HomeChatScreen). Same external-store shape as
 * zoneResolution.ts, since this is the same kind of cross-cutting concern: a
 * single flag plus a listener set, read via useSyncExternalStore.
 */
let pendingResolver: Resolver | null = null;
const listeners = new Set<() => void>();

function notify(): void {
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** Whether a pick is currently outstanding — true between a requestAddressPick()
 * call and the matching resolveAddressPick(). Non-hook form for use outside
 * render (e.g. the location modal's unmount cleanup, to catch a swipe-to-dismiss
 * that never called resolveAddressPick itself). */
export function isAddressPickPending(): boolean {
  return pendingResolver !== null;
}

/** Whether the picker should be rendered/navigated to right now. */
export function useIsAddressPickRequested(): boolean {
  return useSyncExternalStore(subscribe, isAddressPickPending, isAddressPickPending);
}

/**
 * Opens the picker and resolves once the customer picks something or dismisses
 * it. Only one request can be in flight — a second call while one is pending
 * cancels the first rather than leaving it hanging forever (which would leak
 * a promise the original caller is still awaiting).
 */
export function requestAddressPick(): Promise<PickedAddress | "cancelled"> {
  if (pendingResolver) resolveAddressPick("cancelled");
  return new Promise((resolve) => {
    pendingResolver = resolve;
    notify();
  });
}

/** Called by LocationPicker when the customer picks a row, uses their current
 * location, or dismisses the sheet. */
export function resolveAddressPick(value: PickedAddress | "cancelled"): void {
  const resolver = pendingResolver;
  pendingResolver = null;
  notify();
  resolver?.(value);
}
