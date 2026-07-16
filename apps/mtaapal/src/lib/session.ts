import * as Crypto from "expo-crypto";

let threadId: string | null = null;

/**
 * One thread_id per app session. The backend's default CHECKPOINTER=memory
 * doesn't survive a server restart anyway, so there's no need to persist this
 * across app launches yet.
 */
export function getThreadId(): string {
  if (!threadId) {
    threadId = Crypto.randomUUID();
  }
  return threadId;
}

export function newRunId(): string {
  return Crypto.randomUUID();
}
