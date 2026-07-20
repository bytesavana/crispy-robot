import { useSyncExternalStore } from "react";
import * as Location from "expo-location";

import { getAgentApiUrl } from "./config";

export type ZoneStatus = "unresolved" | "resolving" | "resolved" | "no_location" | "not_covered";

let zoneStatus: ZoneStatus = "unresolved";
let zoneName: string | null = null;
const listeners = new Set<() => void>();

function setState(status: ZoneStatus, name: string | null = null): void {
  zoneStatus = status;
  zoneName = name;
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

/** Used outside React (e.g. building request headers) — null means "no zone known yet". */
export function getZoneName(): string | null {
  return zoneName;
}

export function useZoneName(): string | null {
  return useSyncExternalStore(subscribeZoneStatus, getZoneName, getZoneName);
}

async function lookupZone(latitude: number, longitude: number): Promise<void> {
  const response = await fetch(
    `${getAgentApiUrl()}/zones/resolve?lat=${latitude}&lng=${longitude}`,
  );
  if (!response.ok) {
    setState("no_location");
    return;
  }
  const body = (await response.json()) as { zone: { zone_id: string; zone_name: string } | null };
  if (body.zone) {
    setState("resolved", body.zone.zone_name);
  } else {
    setState("not_covered");
  }
}

/**
 * Non-prompting resolution: only proceeds if location permission was already granted
 * (e.g. a returning user). Safe to call on every app launch.
 */
export async function resolveZone(): Promise<void> {
  setState("resolving");
  try {
    const permission = await Location.getForegroundPermissionsAsync();
    if (!permission.granted) {
      setState("no_location");
      return;
    }
    const position = await Location.getCurrentPositionAsync();
    await lookupZone(position.coords.latitude, position.coords.longitude);
  } catch {
    setState("no_location");
  }
}

/**
 * Prompts the OS permission dialog — only call this from a deliberate user action
 * (e.g. the onboarding screen's "Allow" button), not silently on mount.
 */
export async function requestLocationAndResolveZone(): Promise<void> {
  setState("resolving");
  try {
    const permission = await Location.requestForegroundPermissionsAsync();
    if (!permission.granted) {
      setState("no_location");
      return;
    }
    const position = await Location.getCurrentPositionAsync();
    await lookupZone(position.coords.latitude, position.coords.longitude);
  } catch {
    setState("no_location");
  }
}
