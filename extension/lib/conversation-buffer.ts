import { defineState } from "eve/context";

export interface BufferedConversationTurn {
  readonly assistantMessage?: string;
  readonly usedSupermemoryTool?: boolean;
  readonly turnId: string;
  readonly userMessage?: string;
}

interface ConversationBuffer {
  readonly turn?: BufferedConversationTurn;
}

const conversationBuffer = defineState<ConversationBuffer>("conversation-buffer", () => ({}));

function updateTurn(
  turnId: string,
  update: (turn: BufferedConversationTurn) => BufferedConversationTurn,
): void {
  conversationBuffer.update((buffer) => {
    const turn = buffer.turn?.turnId === turnId ? buffer.turn : { turnId };

    return { turn: update(turn) };
  });
}

export function bufferUserMessage(turnId: string, message: string): void {
  updateTurn(turnId, (turn) => ({
    ...turn,
    userMessage: message,
  }));
}

export function bufferAssistantMessage(turnId: string, message: string): void {
  updateTurn(turnId, (turn) => ({
    ...turn,
    assistantMessage: message,
  }));
}

export function markSupermemoryToolUsed(turnId: string): void {
  updateTurn(turnId, (turn) => ({
    ...turn,
    usedSupermemoryTool: true,
  }));
}

export function consumeConversationTurn(turnId: string): BufferedConversationTurn | undefined {
  const turn = conversationBuffer.get().turn;
  if (turn?.turnId !== turnId) return;

  conversationBuffer.update(() => ({}));
  return turn;
}

export function discardConversationTurn(turnId: string): void {
  const turn = conversationBuffer.get().turn;
  if (turn?.turnId === turnId) {
    conversationBuffer.update(() => ({}));
  }
}
