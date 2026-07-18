import type { Message as AgUiMessage } from "@ag-ui/client";

import { buildIdentityHeaders, getAgentApiUrl } from "./agUiClient";
import { refreshAccessToken } from "./auth";

export type Conversation = {
  threadId: string;
  title: string | null;
  createdAt: string;
  updatedAt: string;
};

type ConversationDto = {
  thread_id: string;
  title: string | null;
  created_at: string;
  updated_at: string;
};

function toConversation(dto: ConversationDto): Conversation {
  return {
    threadId: dto.thread_id,
    title: dto.title,
    createdAt: dto.created_at,
    updatedAt: dto.updated_at,
  };
}

async function fetchWithAuthRetry<T>(path: string, init?: RequestInit): Promise<T> {
  const request = async (): Promise<Response> =>
    fetch(`${getAgentApiUrl()}${path}`, {
      ...init,
      headers: { ...(await buildIdentityHeaders()), ...init?.headers },
    });

  let response = await request();
  if (response.status === 401) {
    const refreshed = await refreshAccessToken();
    if (refreshed) response = await request();
  }
  if (!response.ok) {
    throw new Error(`Request to ${path} failed (${response.status})`);
  }
  return response.status === 204 ? (undefined as T) : (response.json() as Promise<T>);
}

export async function fetchConversations(): Promise<Conversation[]> {
  const dtos = await fetchWithAuthRetry<ConversationDto[]>("/conversations");
  return dtos.map(toConversation);
}

export type ConversationResume = {
  messages: AgUiMessage[];
  state: Record<string, unknown>;
};

/** The AG-UI HttpAgent's initialMessages/initialState for a past conversation, straight
 * from the backend's LangGraph checkpoint — so resuming restores real state (cart, zone,
 * offerings, ...), not just the transcript. */
export async function fetchConversation(threadId: string): Promise<ConversationResume> {
  return fetchWithAuthRetry<ConversationResume>(`/conversations/${threadId}`);
}

/** Registers this device's Expo push token against the signed-in customer (or guest device
 * id) — idempotent server-side, so safe to call on every app start/sign-in. Lets the backend
 * push a notification when a background fulfillment event (see effective-happiness) needs the
 * app to refresh an open or backgrounded conversation. */
export async function registerPushToken(token: string): Promise<void> {
  await fetchWithAuthRetry<void>("/push-tokens", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token }),
  });
}
