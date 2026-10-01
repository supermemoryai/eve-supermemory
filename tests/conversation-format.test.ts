import assert from "node:assert/strict";
import test from "node:test";

import { countConversationTurns, formatConversationTurn } from "../src/lib/conversation-format.js";

test("role labels stay outside the previous message", () => {
  const content = formatConversationTurn({
    assistantMessage: "Stored in team memory: “Wyn is the best.”",
    usedSupermemoryTool: false,
    userMessage: "store in my team memory: Wyn is the best",
  });

  assert.equal(
    content,
    `[user]
store in my team memory: Wyn is the best

[assistant]
Stored in team memory: “Wyn is the best.”
`,
  );
  assert.equal(content?.includes("best assistant"), false);
});

test("user text that mentions a role is kept verbatim", () => {
  const content = formatConversationTurn({
    assistantMessage: "Noted.",
    usedSupermemoryTool: false,
    userMessage: "Call the assistant: Sam.",
  });

  assert.match(content ?? "", /\[user\]\nCall the assistant: Sam\./);
});

test("turn counts include the current labels and older user: transcripts", () => {
  const current = `[user]
First

[assistant]
Ok

[user]
Second
`;
  const legacy = "user: First\nassistant: Ok\nuser: Second\n";

  assert.equal(countConversationTurns(current), 2);
  assert.equal(countConversationTurns(legacy), 2);
  assert.equal(countConversationTurns(`${legacy}${current}`), 4);
  assert.equal(countConversationTurns(undefined), 0);
});
