import { useSyncExternalStore } from "react";
import * as Location from "expo-location";

import type { AgentThreadState } from "./agUiClient";
import { getAgent } from "./agUiClient";
import { selectAddressAndCheckCoverage } from "./selectedAddress";

export type DeviceLocationStatus = "unresolved" | "resolving" | "resolved" | "no_location";

let locationStatus: DeviceLocationStatus = "unresolved";
const listeners = new Set<() => void>();

function setStatus(status: DeviceLocationStatus): void {
  locationStatus = status;
  listeners.forEach((listener) => listener());
}

export function subscribeDeviceLocationStatus(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getDeviceLocationStatus(): DeviceLocationStatus {
  return locationStatus;
}

export function useDeviceLocationStatus(): DeviceLocationStatus {
  return useSyncExternalStore(subscribeDeviceLocationStatus, getDeviceLocationStatus, getDeviceLocationStatus);
}

async function seedPendingAddress(latitude: number, longitude: number): Promise<void> {
  const agent = getAgent();
  const state: AgentThreadState | null | undefined = agent.state;
  if (state?.address) return;
  const candidate = { latitude, longitude, source: "gps" as const };
  agent.setState({ ...agent.state, pending_address: candidate });
  await selectAddressAndCheckCoverage(candidate);
}

export async function resolveDeviceLocation(prompt = false): Promise<void> {
  setStatus("resolving");
  try {
    const permission = prompt
      ? await Location.requestForegroundPermissionsAsync()
      : await Location.getForegroundPermissionsAsync();
    if (!permission.granted) {
      setStatus("no_location");
      return;
    }
    const position = await Location.getCurrentPositionAsync();
    await seedPendingAddress(position.coords.latitude, position.coords.longitude);
    setStatus("resolved");
  } catch {
    setStatus("no_location");
  }
}
