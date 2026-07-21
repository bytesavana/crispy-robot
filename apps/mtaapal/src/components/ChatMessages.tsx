import type { ChatMessage } from "@/lib/useMtaaPalChat";

import { ActivityLine } from "./ActivityLine";
import { AssistantCard } from "./AssistantCard";
import { UserBubble } from "./UserBubble";

export function ChatMessageItem({ message }: { message: ChatMessage }) {
  if (message.role === "activity") {
    return <ActivityLine text={message.text} />;
  }
  return message.role === "user" ? (
    <UserBubble text={message.text} imageUris={message.imageUris} />
  ) : (
    <AssistantCard text={message.text} />
  );
}
