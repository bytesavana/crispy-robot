import type { AgentSubscriber, Message } from "@ag-ui/client";
import { HttpAgent } from "@ag-ui/client";

import { getAccessToken, refreshAccessToken } from "./auth";
import { getAgentApiUrl } from "./config";
import { getDeviceId } from "./deviceId";
import { LOCATION_TOOLS } from "./locationTools";
import { getThreadId, newThreadId, setThreadId } from "./session";

export { getAgentApiUrl } from "./config";

let agent: HttpAgent | null = null;
const agentListeners = new Set<() => void>();

/** One HttpAgent instance per app session, bound to the session's thread_id. */
export function getAgent(): HttpAgent {
  if (!agent) {
    agent = new HttpAgent({
      url: `${getAgentApiUrl()}/agent`,
      threadId: getThreadId(),
    });
  }
  return agent;
}

/**
 * Subscribes to the agent singleton being rebound to a different thread (new or resumed
 * conversation). Pairs with `useSyncExternalStore(subscribeAgent, getAgent, getAgent)` so
 * components re-render with the fresh instance instead of holding a stale reference.
 */
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
  agentListeners.forEach((listener) => listener());
}

/** Starts a brand-new conversation: fresh thread id, empty chat/cart. */
export function startNewConversation(): void {
  rebindAgent(newThreadId());
}

/** Resumes a past conversation, seeding the chat with its real message history and state
 * (cart, zone, offerings, ...) instead of just the transcript. */
export function switchToConversation(
  threadId: string,
  messages: Message[],
  state?: Record<string, unknown>,
): void {
  setThreadId(threadId);
  rebindAgent(threadId, messages, state);
}

/**
 * Signed-in users send their auth token and nothing else; guests send the persisted
 * per-install device id — never both, so the backend can't confuse a guest for a
 * signed-in user or vice versa. Shared by the agent and the plain conversations fetch.
 *
 * No location header any more: a location is set via pending_address in agent
 * state (see zoneResolution.ts and locationTools.ts), the same request-body path
 * every source — GPS, the picker, a saved address — now goes through.
 */
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
