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

// Matches didactic-invention's agent/state.py LOCATION_UPDATE_PREFIX. The agent
// injects a `[Location update] ...` message into conversation history whenever
// apply_address_selection resolves a location change — a fact for the model to
// relay in its own words, never something the customer typed. It runs inline
// inside a live /agent run, so the message streams to this client like any
// other; the AG-UI wire schema has no field for additional_kwargs to mark it,
// so content is the only thing both this filter and the server's own resume-
// path filter (store/conversations.py's to_ag_ui_messages) can check.
const LOCATION_UPDATE_PREFIX = "[Location update]";

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
      // A location update the agent injected for itself, not the customer —
      // see LOCATION_UPDATE_PREFIX above. Must be checked before the blank-
      // content skip below, since this message is never blank.
      if (message.role === "user" && text.startsWith(LOCATION_UPDATE_PREFIX)) return [];
      // Tool-call-only assistant turns carry no visible content (e.g. the model calling a
      // backend function produces an empty `content` alongside a `toolCalls` array) — skip
      // the blank bubble instead of rendering it; the typing indicator already covers the gap.
      if (!text.trim() && !imageUris) return [];
      return [{ id: message.id, role: message.role, text, imageUris }];
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

/**
 * Runs the agent, and — if the model called a client-side location tool — answers
 * it and runs again, repeating until a run produces no client tool call.
 *
 * The server's route_after_agent ends a run the instant the model calls a tool
 * not in its own tool list (see agent/graph.py); there is no server-side
 * resolve_customer_location, so the run stops with the call unanswered rather
 * than erroring. This is the other half: execute it here, push a real
 * ToolMessage with the tool_call_id so the model sees a genuine answer next
 * turn (not `_repair_dangling_tool_calls`'s generic "interrupted" placeholder,
 * which would misdescribe a deliberate client answer as a network failure),
 * and set pending_address via agent.setState so apply_address_selection picks
 * it up on the next run. `runAgentWithAuth` already resends LOCATION_TOOLS on
 * every call, so a second or third round trip works the same as the first.
 *
 * Recursive rather than a while-loop purely for readability — a location
 * exchange is at most a couple of rounds (GPS or picker, then the model's
 * reaction), never unbounded.
 */
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

  /**
   * The manual counterpart to the model calling ask_customer_for_address:
   * opens the picker (LocationBar/AttachMenu's "Location" option), and — if the
   * customer actually chose something rather than dismissing it — sets
   * pending_address and runs the agent with no new user message, exactly like
   * the GPS cold-start seed in zoneResolution.ts. apply_address_selection
   * applies the same basket/confirmed-order guards either way and the model
   * narrates the outcome, so this never needs to duplicate that logic.
   */
  const pickLocation = useCallback(() => {
    if (agent.isRunning) return;
    runAndSettle(async (subscriber) => {
      const picked = await requestAddressPick();
      if (picked === "cancelled") return;
      agent.setState({ ...agent.state, pending_address: picked });
      await runAgentUntilSettled(agent, subscriber);
    });
  }, [agent, runAndSettle]);

  return { messages, isRunning, sendMessage, pickLocation };
}
