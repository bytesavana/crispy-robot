import type { ChatMessage } from "@/lib/useMtaaPalChat";

import { ActivityLine } from "./ActivityLine";
import { AssistantMessage } from "./AssistantMessage";
import { UserBubble } from "./UserBubble";

export function ChatMessageItem({ message }: { message: ChatMessage }) {
  if (message.role === "activity") {
    return <ActivityLine text={message.text} />;
  }
  return message.role === "user" ? (
    <UserBubble text={message.text} imageUris={message.imageUris} />
  ) : (
    <AssistantMessage text={message.text} />
  );
}
