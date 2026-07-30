import type { AgentSubscriber, Message } from "@ag-ui/client";
import { HttpAgent } from "@ag-ui/client";

import { getAccessToken, refreshAccessToken } from "./auth";
import { getAgentApiUrl } from "./config";
import { getDeviceId } from "./deviceId";
import { LOCATION_TOOLS } from "./locationTools";
import { getSelectedAddress, markAddressConfirmedFromThread } from "./selectedAddress";
import { getThreadId, newThreadId, setThreadId } from "./session";

export { getAgentApiUrl } from "./config";

let agent: HttpAgent | null = null;
const agentListeners = new Set<() => void>();

function mirrorAddress(state: Record<string, unknown> | undefined): void {
  const address = (
    state as { address?: { latitude: number; longitude: number; name?: string; source: string } } | undefined
  )?.address;
  if (!address) return;
  markAddressConfirmedFromThread(address, Boolean((state as { zone?: unknown } | undefined)?.zone));
}

/** One HttpAgent instance per app session, bound to the session's thread_id. */
export function getAgent(): HttpAgent {
  if (!agent) {
    agent = new HttpAgent({
      url: `${getAgentApiUrl()}/agent`,
      threadId: getThreadId(),
    });
    agent.subscribe({ onStateChanged: ({ state }) => mirrorAddress(state as Record<string, unknown>) });
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
  initialState?: Record<string, unknown>,
): void {
  agent = new HttpAgent({
    url: `${getAgentApiUrl()}/agent`,
    threadId,
    initialMessages,
    initialState,
  });
  mirrorAddress(initialState);
  agent.subscribe({ onStateChanged: ({ state }) => mirrorAddress(state as Record<string, unknown>) });
  agentListeners.forEach((listener) => listener());
}

export function startNewConversation(): void {
  const seed = getSelectedAddress();
  rebindAgent(newThreadId(), undefined, seed ? { pending_address: seed } : undefined);
}

export function switchToConversation(
  threadId: string,
  messages: Message[],
  state?: Record<string, unknown>,
): void {
  setThreadId(threadId);
  rebindAgent(threadId, messages, state);
}


export async function buildIdentityHeaders(): Promise<Record<string, string>> {
  const token = await getAccessToken();
  return token ? { Authorization: `Bearer ${token}` } : { "X-Customer-Id": await getDeviceId() };
}

/**
 * HttpAgent.headers is a mutable property re-read fresh on every request, so this can run
 * right before each runAgent() call instead of only at construction time.
 */
export async function syncAgentHeaders(): Promise<void> {
  const a = getAgent();
  a.headers = await buildIdentityHeaders();
}

/**
 * Runs the agent with fresh headers, transparently retrying once after refreshing the access
 * token if the backend rejects it with a 401 (e.g. "Signature has expired"). Guests have no
 * refresh token, so refreshAccessToken() is a no-op for them and the original 401 propagates.
 *
 * LOCATION_TOOLS is sent on every run, not just the first — the client resends
 * its tool declarations on every call (ag_ui_langgraph never persists them), so
 * omitting it on a later run would silently drop the agent's ability to ask for
 * a location on that turn.
 */
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
