import { useSyncExternalStore } from "react";

export type PickedAddress = {
  latitude: number;
  longitude: number;
  name?: string;
  source: "gps" | "picker" | "saved_address";
};

type Resolver = (value: PickedAddress | "cancelled") => void;

let pendingResolver: Resolver | null = null;
const listeners = new Set<() => void>();

function notify(): void {
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function isAddressPickPending(): boolean {
  return pendingResolver !== null;
}

export function useIsAddressPickRequested(): boolean {
  return useSyncExternalStore(subscribe, isAddressPickPending, isAddressPickPending);
}

export function requestAddressPick(): Promise<PickedAddress | "cancelled"> {
  if (pendingResolver) resolveAddressPick("cancelled");
  return new Promise((resolve) => {
    pendingResolver = resolve;
    notify();
  });
}

export function resolveAddressPick(value: PickedAddress | "cancelled"): void {
  const resolver = pendingResolver;
  pendingResolver = null;
  notify();
  resolver?.(value);
}
