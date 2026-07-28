import { useEffect, useState, useSyncExternalStore } from "react";

import { getAgent, subscribeAgent } from "./agUiClient";

export type ThreadAddress = {
  latitude: number;
  longitude: number;
  name?: string;
  source: "gps" | "picker" | "saved_address";
};

export type ThreadZone = { zone_id: string; zone_name: string };

export type SavedAddress = {
  id: string;
  label: string;
  address_text: string;
  latitude: number | null;
  longitude: number | null;
  is_active: boolean;
};

type ThreadState = {
  address?: ThreadAddress | null;
  zone?: ThreadZone | null;
  customer?: { addresses?: SavedAddress[] } | null;
};

/**
 * Shared shape behind every hook below: re-derive a value from `agent.state`,
 * resyncing on agent rebind (new/resumed conversation — mirrors useCart's
 * pattern) and on every subsequent onStateChanged. A resumed thread ships its
 * address/zone/customer in the state payload from GET /conversations/{id}, so
 * switching conversations reflects the right values immediately rather than
 * whatever the previous thread last held.
 */
function useThreadStateValue<T>(extract: (state: unknown) => T): T {
  const agent = useSyncExternalStore(subscribeAgent, getAgent, getAgent);
  const [value, setValue] = useState<T>(() => extract(agent.state));

  const [syncedAgent, setSyncedAgent] = useState(agent);
  if (agent !== syncedAgent) {
    setSyncedAgent(agent);
    setValue(extract(agent.state));
  }

  useEffect(() => {
    const { unsubscribe } = agent.subscribe({
      onStateChanged({ state }) {
        setValue(extract(state));
      },
    });
    return unsubscribe;
  }, [agent, extract]);

  return value;
}

function extractLabel(state: unknown): string | undefined {
  const { address, zone } = (state as ThreadState | null | undefined) ?? {};
  // The address is what the customer actually recognizes ("Home", "Office"); the
  // zone name is a fallback for a GPS-sourced address with no name attached yet
  // (see agent/nodes.py — reverse geocoding isn't wired up). Neither is "the
  // zone" as a concept the customer should ever see — see agent/state.py's
  // module docstring on why address, not zone, is the primary value.
  return address?.name ?? zone?.zone_name;
}

function extractSavedAddresses(state: unknown): SavedAddress[] {
  return (state as ThreadState | null | undefined)?.customer?.addresses ?? [];
}

function extractIsAddressUncovered(state: unknown): boolean {
  const { address, zone } = (state as ThreadState | null | undefined) ?? {};
  return Boolean(address) && !zone;
}

/**
 * The display label for the current conversation's location — what LocationBar
 * shows in its pill state. Not "the zone": a zone is an internal detail deciding
 * what's bookable and what it costs, never something the customer picks or sees
 * named as such (see agent/state.py). This is the address they recognize.
 *
 * Deliberately not GPS read directly: an address is bound once per thread (via
 * apply_address_selection) and only the customer can change it — through the
 * picker or by asking in chat — so reading it back from agent state is the only
 * way the bar and the booking ever agree. zoneResolution.ts's GPS helper only
 * *seeds* a location by producing a point for pending_address; it is not itself
 * a source of truth for what a thread is bound to.
 */
export function useAddressLabel(): string | undefined {
  return useThreadStateValue(extractLabel);
}

/** The customer's active saved addresses, for the location picker. No network
 * call — load_context already put the whole profile (addresses included) into
 * agent.state.customer, so this is a pure read. */
export function useSavedAddresses(): SavedAddress[] {
  return useThreadStateValue(extractSavedAddresses).filter((a) => a.is_active);
}

/** True once the thread has a real address but it resolves to no zone — a
 * settled "we don't serve this area yet" rather than a loading state.
 * LocationBar uses this alongside zoneResolution.ts's separate, device-level
 * GPS permission status: a customer can have GPS granted and still be
 * uncovered, or have it denied while a saved address already covers them. */
export function useIsAddressUncovered(): boolean {
  return useThreadStateValue(extractIsAddressUncovered);
}
