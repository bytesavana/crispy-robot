import { useCallback, useState, useSyncExternalStore } from "react";
import * as Crypto from "expo-crypto";
import type {
  AgentSubscriber,
  HttpAgent,
  Message as AgUiMessage,
  UserMessage as AgUiUserMessage,
} from "@ag-ui/client";

import { getAgent, runAgentWithAuth, subscribeAgent } from "./agUiClient";
import { executeLocationTool, isLocationTool } from "./locationTools";
import { requestAddressPick } from "./locationPickerBridge";
import { selectAddressAndCheckCoverage } from "./selectedAddress";

export type ChatMessage = {
  id: string;
  role: "user" | "assistant" | "activity" | "location";
  text: string;
  imageUris?: string[];
  activityType?: string;
};

export type OutgoingImage = {
  base64: string;
  mimeType: string;
};

const FRIENDLY_ERROR_MESSAGE = "Something went wrong — please try again.";

const LOCATION_UPDATE_NAME = "location_update";

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
      const text = contentToText(message.content);
      const imageUris = contentToImageUris(message.content);
      if (message.role === "user" && message.name === LOCATION_UPDATE_NAME) {
        const locationText = text.trim();
        return locationText ? [{ id: message.id, role: "location", text: locationText }] : [];
      }
      if (!text.trim() && !imageUris) return [];
      return [{ id: message.id, role: message.role, text, imageUris }];
    }
    if (message.role === "activity") {
      const text = typeof message.content.message === "string" ? message.content.message : "";
      return [{ id: message.id, role: "activity", activityType: message.activityType, text }];
    }
    return [];
  });
}

async function runAgentUntilSettled(agent: HttpAgent, subscriber: AgentSubscriber): Promise<void> {
  let sawLocationToolCall = false;

  await runAgentWithAuth({
    ...subscriber,
    async onToolCallEndEvent(params) {
      const { toolCallName, event } = params;
      if (isLocationTool(toolCallName)) {
        sawLocationToolCall = true;
        const result = await executeLocationTool(toolCallName);
        agent.addMessage({
          id: Crypto.randomUUID(),
          role: "tool",
          toolCallId: event.toolCallId,
          content: JSON.stringify(result),
        });
        if (result?.status === "resolved") {
          agent.setState({
            ...agent.state,
            pending_address: {
              latitude: result.latitude,
              longitude: result.longitude,
              name: result.name,
              source: result.source,
            },
          });
        }
      }
      return subscriber.onToolCallEndEvent?.(params);
    },
  });

  if (sawLocationToolCall) {
    await runAgentUntilSettled(agent, subscriber);
  }
}

export function useMtaaPalChat() {
  const agent = useSyncExternalStore(subscribeAgent, getAgent, getAgent);
  const [messages, setMessages] = useState<ChatMessage[]>(() => toDisplayMessages(agent.messages));
  const [isRunning, setIsRunning] = useState(false);

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

  const makeSubscriber = useCallback((): AgentSubscriber => {
    return {
      onTextMessageContentEvent({ messages: current }) {
        setMessages(toDisplayMessages(current));
      },
      onRunErrorEvent({ event }) {
        appendErrorMessage(event.message ?? FRIENDLY_ERROR_MESSAGE);
      },
    };
  }, [appendErrorMessage]);

  const runAndSettle = useCallback(
    (run: (subscriber: AgentSubscriber) => Promise<void>) => {
      setIsRunning(true);
      run(makeSubscriber())
        .catch((e) => {
          console.error(e ?? FRIENDLY_ERROR_MESSAGE);
          appendErrorMessage(FRIENDLY_ERROR_MESSAGE);
        })
        .finally(() => setIsRunning(false));
    },
    [makeSubscriber, appendErrorMessage],
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
      runAndSettle((subscriber) => runAgentUntilSettled(agent, subscriber));
    },
    [agent, runAndSettle],
  );


  const pickLocation = useCallback(() => {
    if (agent.isRunning) return;

    if (messages.length === 0) {
      void (async () => {
        const picked = await requestAddressPick();
        if (picked === "cancelled") return;
        agent.setState({ ...agent.state, pending_address: picked });
        await selectAddressAndCheckCoverage(picked);
      })();
      return;
    }

    runAndSettle(async (subscriber) => {
      const picked = await requestAddressPick();
      if (picked === "cancelled") return;
      agent.setState({ ...agent.state, pending_address: picked });
      await runAgentUntilSettled(agent, subscriber);
    });
  }, [agent, runAndSettle, messages.length]);

  return { messages, isRunning, sendMessage, pickLocation };
}
