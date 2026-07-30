import { useEffect, useState, useSyncExternalStore } from "react";

import { getAgent, subscribeAgent } from "./agUiClient";

export type SavedAddress = {
  id: string;
  label: string;
  address_text: string;
  latitude: number | null;
  longitude: number | null;
  is_active: boolean;
};

type ThreadState = {
  customer?: { addresses?: SavedAddress[] } | null;
};

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

export function formatAddressLabel(a: { name?: string; latitude: number; longitude: number }): string {
  return a.name ?? `${a.latitude.toFixed(4)}, ${a.longitude.toFixed(4)}`;
}

function extractSavedAddresses(state: unknown): SavedAddress[] {
  return (state as ThreadState | null | undefined)?.customer?.addresses ?? [];
}

export function useSavedAddresses(): SavedAddress[] {
  return useThreadStateValue(extractSavedAddresses).filter((a) => a.is_active);
}
