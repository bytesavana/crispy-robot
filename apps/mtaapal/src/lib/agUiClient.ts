import { HttpAgent } from "@ag-ui/client";
import Constants from "expo-constants";

import { getAccessToken } from "./auth";
import { getDeviceId } from "./deviceId";
import { HARDCODED_ZONE_NAME } from "./identity";
import { getThreadId } from "./session";

function getAgentApiUrl(): string {
  const extra = Constants.expoConfig?.extra as { agentApiUrl?: string } | undefined;
  return extra?.agentApiUrl ?? "http://localhost:8000";
}

let agent: HttpAgent | null = null;

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
 * HttpAgent.headers is a mutable property re-read fresh on every request, so this can run
 * right before each runAgent() call instead of only at construction time. Signed-in users send
 * their auth token and nothing else; guests send the persisted per-install device id — never
 * both, so the backend can't confuse a guest for a signed-in user or vice versa.
 */
export async function syncAgentHeaders(): Promise<void> {
  const a = getAgent();
  const token = await getAccessToken();
  a.headers = token
    ? { Authorization: `Bearer ${token}`, "X-Zone-Name": HARDCODED_ZONE_NAME }
    : { "X-Customer-Id": await getDeviceId(), "X-Zone-Name": HARDCODED_ZONE_NAME };
}
