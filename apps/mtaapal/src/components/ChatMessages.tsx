import type { ChatMessage } from "@/lib/useMtaaPalChat";

import { AssistantCard } from "./AssistantCard";
import { UserBubble } from "./UserBubble";

export function ChatMessageItem({ message }: { message: ChatMessage }) {
  return message.role === "user" ? (
    <UserBubble text={message.text} />
  ) : (
    <AssistantCard text={message.text} />
  );
}
