import { useSyncExternalStore } from "react";

import type { Address } from "./agUiClient";
import { getAgentApiUrl } from "./config";

export type CoverageStatus = "checking" | "covered" | "not_covered";

export type SelectedAddress = Address & {
  coverage: CoverageStatus;
};

let selected: SelectedAddress | null = null;
let checkToken = 0;
const listeners = new Set<() => void>();

function emit(): void {
  listeners.forEach((listener) => listener());
}

export function subscribeSelectedAddress(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getSelectedAddress(): SelectedAddress | null {
  return selected;
}

export function useSelectedAddress(): SelectedAddress | null {
  return useSyncExternalStore(subscribeSelectedAddress, getSelectedAddress, getSelectedAddress);
}

export async function selectAddressAndCheckCoverage(candidate: Address): Promise<void> {
  const token = ++checkToken;
  selected = { ...candidate, coverage: "checking" };
  emit();

  let served = false;
  try {
    const response = await fetch(
      `${getAgentApiUrl()}/address/coverage?lat=${candidate.latitude}&lng=${candidate.longitude}`,
    );
    const body = response.ok ? ((await response.json()) as { served?: boolean }) : null;
    served = body?.served === true;
  } catch {
    served = false;
  }

  if (token !== checkToken) return;
  selected = { ...candidate, coverage: served ? "covered" : "not_covered" };
  emit();
}


export function markAddressConfirmedFromThread(address: Address, covered: boolean): void {
  checkToken++;
  selected = { ...address, coverage: covered ? "covered" : "not_covered" };
  emit();
}
