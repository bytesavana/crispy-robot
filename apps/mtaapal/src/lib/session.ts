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

/** Rotates to a brand-new thread id (used by "start a new conversation"). */
export function newThreadId(): string {
  threadId = Crypto.randomUUID();
  return threadId;
}

/** Switches to an existing thread id (used by "resume a past conversation"). */
export function setThreadId(id: string): void {
  threadId = id;
}

export function newRunId(): string {
  return Crypto.randomUUID();
}
