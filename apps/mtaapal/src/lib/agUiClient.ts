import { HttpAgent } from "@ag-ui/client";
import Constants from "expo-constants";

import { HARDCODED_CUSTOMER_ID, HARDCODED_ZONE_NAME } from "./identity";
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
      headers: {
        "X-Customer-Id": HARDCODED_CUSTOMER_ID,
        "X-Zone-Name": HARDCODED_ZONE_NAME,
      },
      threadId: getThreadId(),
    });
  }
  return agent;
}
