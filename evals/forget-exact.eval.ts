import { defineEval } from "eve/evals";

import { createMemories, waitForForgottenMemory } from "./helpers.js";

export default defineEval({
  async test(t) {
    const fact = "daily standups at 8:30 AM";
    const created = await createMemories([
      {
        content: `The current user prefers ${fact}.`,
        metadata: { source: "user_preference" },
      },
    ]);
    const memory = created.memories[0];
    if (!memory) throw new Error("Direct memory creation returned no memory.");

    const turn = await t.send(
      `I no longer want you to remember that I prefer ${fact}. Forget that one preference.`,
    );
    turn.expectOk();
    turn.calledTool("supermemory__search", { input: { scope: "memories" } });
    turn.calledTool("supermemory__forget", {
      input: { memoryId: memory.id },
      count: 1,
    });
    await waitForForgottenMemory(memory.id);
    t.succeeded();
  },
});
