import type { AgentSubscriber, Message } from "@ag-ui/client";
import { HttpAgent } from "@ag-ui/client";

import { getAccessToken, refreshAccessToken } from "./auth";
import { getAgentApiUrl } from "./config";
import { getDeviceId } from "./deviceId";
import { LOCATION_TOOLS } from "./locationTools";
import { getSelectedAddress, markAddressConfirmedFromThread } from "./selectedAddress";
import { getThreadId, newThreadId, setThreadId } from "./session";

export { getAgentApiUrl } from "./config";

export type Address = {
  latitude: number;
  longitude: number;
  name?: string;
  source: string;
};

export type PendingAddress = Address & {
  
};

export type ThreadAddress = PendingAddress & {
  served: boolean;
};

export type AgentThreadState = {
  address?: ThreadAddress;
  pending_address?: PendingAddress;
};

let agent: HttpAgent | null = null;
const agentListeners = new Set<() => void>();


export function getAgent(): HttpAgent {
  if (!agent) {
    agent = new HttpAgent({
      url: `${getAgentApiUrl()}/agent`,
      threadId: getThreadId(),
    });
    agent.subscribe({
      onStateChanged: ({ state }) => {
        console.log("agent state changed", state);

        const address = state?.address;
        if (address){
          markAddressConfirmedFromThread(address, address.served);
        }
      }
    });
  }
  return agent;
}

export function subscribeAgent(listener: () => void): () => void {
  agentListeners.add(listener);
  return () => agentListeners.delete(listener);
}

function rebindAgent(
  threadId: string,
  initialMessages?: Message[],
  initialState?: AgentThreadState,
): void {
  agent = new HttpAgent({
    url: `${getAgentApiUrl()}/agent`,
    threadId,
    initialMessages,
    initialState,
  });
  mirrorThreadAddress(initialState);
  agent.subscribe({ onStateChanged: ({ state }) => mirrorThreadAddress(state) });
  agentListeners.forEach((listener) => listener());
}

export function startNewConversation(): void {
  const seed = getSelectedAddress();
  rebindAgent(newThreadId(), undefined, seed ? { pending_address: seed } : undefined);
}

export function switchToConversation(
  threadId: string,
  messages: Message[],
  state?: AgentThreadState,
): void {
  setThreadId(threadId);
  rebindAgent(threadId, messages, state);
}


export async function buildIdentityHeaders(): Promise<Record<string, string>> {
  const token = await getAccessToken();
  return token ? { Authorization: `Bearer ${token}` } : { "X-Customer-Id": await getDeviceId() };
}

export async function syncAgentHeaders(): Promise<void> {
  const a = getAgent();
  a.headers = await buildIdentityHeaders();
}

export async function runAgentWithAuth(subscriber: AgentSubscriber): Promise<void> {
  const a = getAgent();
  await syncAgentHeaders();
  try {
    await a.runAgent({ tools: LOCATION_TOOLS }, subscriber);
  } catch (error) {
    if ((error as { status?: number } | undefined)?.status !== 401) throw error;

    const refreshed = await refreshAccessToken();
    if (!refreshed) throw error;

    await syncAgentHeaders();
    await a.runAgent({ tools: LOCATION_TOOLS }, subscriber);
  }
}
