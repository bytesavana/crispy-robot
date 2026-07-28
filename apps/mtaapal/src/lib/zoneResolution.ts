import { useSyncExternalStore } from "react";
import * as Location from "expo-location";

import { getAgent } from "./agUiClient";

/**
 * Device GPS permission/read status — unrelated to whether the current thread's
 * location is covered by MtaaPal. That's a thread-state question now (see
 * useAddress.ts's address/zone), not a device one; LocationBar reads both.
 */
export type ZoneStatus = "unresolved" | "resolving" | "resolved" | "no_location";

let zoneStatus: ZoneStatus = "unresolved";
const listeners = new Set<() => void>();

function setStatus(status: ZoneStatus): void {
  zoneStatus = status;
  listeners.forEach((listener) => listener());
}

export function subscribeZoneStatus(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getZoneStatus(): ZoneStatus {
  return zoneStatus;
}

export function useZoneStatus(): ZoneStatus {
  return useSyncExternalStore(subscribeZoneStatus, getZoneStatus, getZoneStatus);
}

/**
 * Seeds pending_address on the agent's local state from a GPS reading, so the
 * very first run of a new thread already carries a location — the same early-
 * seed behavior the old X-Zone-Name header gave, without reintroducing a second
 * door into the location (see agent/state.py's module docstring).
 *
 * Only fills a hole: if this thread already has a bound address (a resumed
 * conversation, or the customer picked one earlier this session), a GPS reading
 * must never silently move it — per agent/prompts.py rule 1b, that's the
 * customer's call, made through the picker or by asking in chat, not something
 * their phone does to them by walking around.
 */
function seedPendingAddress(latitude: number, longitude: number): void {
  const agent = getAgent();
  const state = agent.state as { address?: unknown } | null | undefined;
  if (state?.address) return;
  agent.setState({ ...agent.state, pending_address: { latitude, longitude, source: "gps" } });
}

/**
 * Non-prompting resolution: only proceeds if location permission was already
 * granted (e.g. a returning user). Safe to call on every app launch.
 */
export async function resolveZone(): Promise<void> {
  setStatus("resolving");
  try {
    const permission = await Location.getForegroundPermissionsAsync();
    if (!permission.granted) {
      setStatus("no_location");
      return;
    }
    const position = await Location.getCurrentPositionAsync();
    seedPendingAddress(position.coords.latitude, position.coords.longitude);
    setStatus("resolved");
  } catch {
    setStatus("no_location");
  }
}

/**
 * Prompts the OS permission dialog — only call this from a deliberate user action
 * (e.g. the onboarding screen's "Allow" button), not silently on mount.
 */
export async function requestLocationAndResolveZone(): Promise<void> {
  setStatus("resolving");
  try {
    const permission = await Location.requestForegroundPermissionsAsync();
    if (!permission.granted) {
      setStatus("no_location");
      return;
    }
    const position = await Location.getCurrentPositionAsync();
    seedPendingAddress(position.coords.latitude, position.coords.longitude);
    setStatus("resolved");
  } catch {
    setStatus("no_location");
  }
}
