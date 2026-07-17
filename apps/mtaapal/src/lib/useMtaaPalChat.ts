import { useCallback, useState, useSyncExternalStore } from "react";
import * as Crypto from "expo-crypto";
import type { AgentSubscriber, Message as AgUiMessage } from "@ag-ui/client";

import { getAgent, runAgentWithAuth, subscribeAgent } from "./agUiClient";

export type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  text: string;
};

const FRIENDLY_ERROR_MESSAGE = "Something went wrong — please try again.";

function contentToText(content: AgUiMessage["content"]): string {
  return typeof content === "string" ? content : "";
}

function toDisplayMessages(messages: readonly AgUiMessage[]): ChatMessage[] {
  return messages
    .filter(
      (message): message is AgUiMessage & { role: "user" | "assistant" } =>
        message.role === "user" || message.role === "assistant",
    )
    .map((message) => ({
      id: message.id,
      role: message.role,
      text: contentToText(message.content),
    }));
}

/** Drives one AG-UI thread directly against @ag-ui/client's HttpAgent — no chat UI framework involved. */
export function useMtaaPalChat() {
  const agent = useSyncExternalStore(subscribeAgent, getAgent, getAgent);
  const [messages, setMessages] = useState<ChatMessage[]>(() => toDisplayMessages(agent.messages));
  const [isRunning, setIsRunning] = useState(false);

  // Re-sync local state whenever the agent singleton is rebound (new/resumed conversation).
  // Adjusting state during render (not in an effect) per React's guidance for "reset state
  // when a value changes" — avoids an extra commit/render pass from a useEffect setState.
  const [syncedAgent, setSyncedAgent] = useState(agent);
  if (agent !== syncedAgent) {
    setSyncedAgent(agent);
    setMessages(toDisplayMessages(agent.messages));
    setIsRunning(false);
  }

  const appendErrorMessage = useCallback(
    (text: string) => {
      agent.addMessage({ id: Crypto.randomUUID(), role: "assistant", content: text });
      setMessages(toDisplayMessages(agent.messages));
    },
    [agent],
  );

  const sendMessage = useCallback(
    (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || agent.isRunning) return;

      agent.addMessage({ id: Crypto.randomUUID(), role: "user", content: trimmed });
      setMessages(toDisplayMessages(agent.messages));
      setIsRunning(true);

      const subscriber: AgentSubscriber = {
        onTextMessageContentEvent({ messages: current }) {
          setMessages(toDisplayMessages(current));
        },
        onRunErrorEvent({ event }) {
          appendErrorMessage(event.message ?? FRIENDLY_ERROR_MESSAGE);
        },
      };

      runAgentWithAuth(subscriber)
        .catch((e) => {
          console.error(e ?? FRIENDLY_ERROR_MESSAGE);
          appendErrorMessage(FRIENDLY_ERROR_MESSAGE);
        })
        .finally(() => setIsRunning(false));
    },
    [agent, appendErrorMessage],
  );

  return { messages, isRunning, sendMessage };
}
