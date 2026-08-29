import type { MemoryTurnCompletedContext } from "eve/memory";

type ModelMessage = MemoryTurnCompletedContext["messages"][number];

function textContent(message: ModelMessage): string | undefined {
  if (typeof message.content === "string") {
    const content = message.content.trim();
    return content || undefined;
  }

  const content = message.content
    .filter((part) => part.type === "text")
    .map((part) => part.text.trim())
    .filter(Boolean)
    .join("\n");

  return content || undefined;
}

function toolBelongsToSlot(message: ModelMessage, slot: string): boolean {
  if (typeof message.content === "string" || message.role === "system" || message.role === "user") {
    return false;
  }

  const prefix = `${slot}__`;
  return message.content.some(
    (part) =>
      (part.type === "tool-call" || part.type === "tool-result") &&
      part.toolName.startsWith(prefix),
  );
}

export interface CompletedConversationTurn {
  readonly assistantMessage?: string;
  readonly usedSupermemoryTool: boolean;
  readonly userMessage?: string;
}

function lastUserMessageIndex(messages: MemoryTurnCompletedContext["messages"]): number {
  for (let index = messages.length - 1; index >= 0; index -= 1) {
    if (messages[index]?.role === "user") return index;
  }

  return -1;
}

export function completedConversationTurn(
  context: MemoryTurnCompletedContext,
): CompletedConversationTurn {
  const userMessage = [...context.turn.input].reverse().find((message) => message.role === "user");
  const currentUserIndex = lastUserMessageIndex(context.messages);
  const currentTurnMessages =
    currentUserIndex >= 0 ? context.messages.slice(currentUserIndex + 1) : context.messages;
  const assistantMessage = [...currentTurnMessages]
    .reverse()
    .find((message) => message.role === "assistant" && textContent(message));

  return {
    assistantMessage: assistantMessage ? textContent(assistantMessage) : undefined,
    usedSupermemoryTool: currentTurnMessages.some((message) =>
      toolBelongsToSlot(message, context.memory.slot),
    ),
    userMessage: userMessage ? textContent(userMessage) : undefined,
  };
}
