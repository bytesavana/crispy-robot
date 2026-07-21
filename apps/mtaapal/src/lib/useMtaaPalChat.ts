import { useCallback, useState, useSyncExternalStore } from "react";
import * as Crypto from "expo-crypto";
import type { AgentSubscriber, Message as AgUiMessage, UserMessage as AgUiUserMessage } from "@ag-ui/client";

import { getAgent, runAgentWithAuth, subscribeAgent } from "./agUiClient";

export type ChatMessage = {
  id: string;
  role: "user" | "assistant" | "activity";
  text: string;
  /** Data URIs for any attached images, when the message included at least one. */
  imageUris?: string[];
  /** Only set for role "activity" — e.g. "arrived", "purchasing", "provider_assigned". */
  activityType?: string;
};

/** An image attached to an outgoing message, already resized/compressed by the caller. */
export type OutgoingImage = {
  base64: string;
  mimeType: string;
};

const FRIENDLY_ERROR_MESSAGE = "Something went wrong — please try again.";

function contentToText(content: AgUiMessage["content"]): string {
  if (typeof content === "string") return content;
  if (!Array.isArray(content)) return "";
  const textPart = content.find((part) => part.type === "text");
  return textPart && textPart.type === "text" ? textPart.text : "";
}

function contentToImageUris(content: AgUiMessage["content"]): string[] | undefined {
  if (typeof content === "string" || !Array.isArray(content)) return undefined;
  const uris = content
    .filter((part) => part.type === "image")
    .map((part) => {
      const { source } = part;
      return source.type === "data" ? `data:${source.mimeType};base64,${source.value}` : source.value;
    });
  return uris.length > 0 ? uris : undefined;
}

function toDisplayMessages(messages: readonly AgUiMessage[]): ChatMessage[] {
  return messages.flatMap((message): ChatMessage[] => {
    if (message.role === "user" || message.role === "assistant") {
      return [
        {
          id: message.id,
          role: message.role,
          text: contentToText(message.content),
          imageUris: contentToImageUris(message.content),
        },
      ];
    }
    // A silent status update from a background fulfillment event (see
    // effective-happiness/didactic-invention) — never part of the model's own turn, so it's
    // rendered as a status line, not a chat bubble.
    if (message.role === "activity") {
      const text = typeof message.content.message === "string" ? message.content.message : "";
      return [{ id: message.id, role: "activity", activityType: message.activityType, text }];
    }
    return [];
  });
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
    (text: string, images?: OutgoingImage[]) => {
      const trimmed = text.trim();
      const hasImages = images && images.length > 0;
      if (!trimmed && !hasImages) return;
      if (agent.isRunning) return;

      const content: AgUiUserMessage["content"] = hasImages
        ? [
            ...images.map((image) => ({
              type: "image" as const,
              source: { type: "data" as const, value: image.base64, mimeType: image.mimeType },
            })),
            ...(trimmed ? [{ type: "text" as const, text: trimmed }] : []),
          ]
        : trimmed;

      agent.addMessage({ id: Crypto.randomUUID(), role: "user", content });
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
