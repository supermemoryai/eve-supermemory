import type { CompletedConversationTurn } from "./messages.js";

export const USER_TURN_LABEL = "[user]";
export const ASSISTANT_TURN_LABEL = "[assistant]";

export function formatConversationTurn(turn: CompletedConversationTurn): string | null {
  const blocks: string[] = [];

  if (turn.userMessage) {
    blocks.push(`${USER_TURN_LABEL}\n${turn.userMessage}`);
  }

  if (turn.assistantMessage) {
    blocks.push(`${ASSISTANT_TURN_LABEL}\n${turn.assistantMessage}`);
  }

  if (blocks.length === 0) return null;

  // The blank line and trailing newline keep the next role label from reading as a word in the previous message.
  return `${blocks.join("\n\n")}\n`;
}

export function countConversationTurns(content?: string): number {
  if (!content) return 0;

  const marked = content.match(/(^|\n)\[user\](?=\n|$)/g)?.length ?? 0;
  const legacy = content.match(/(^|\n)user:/g)?.length ?? 0;
  return marked + legacy;
}
