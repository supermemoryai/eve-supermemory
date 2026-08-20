import { defineEval } from "eve/evals";

import { createMemories, waitForForgottenMemory } from "./helpers";

export default defineEval({
  async test(t) {
    const topic = "Juniper relocation";
    const created = await createMemories([
      {
        content: `The current user plans to relocate to Portland in October as part of the ${topic}.`,
        metadata: { source: "relocation_planning" },
      },
      {
        content: `The current user prefers morning apartment tours for the ${topic}.`,
        metadata: { source: "relocation_planning" },
      },
    ]);
    const ids = created.memories.map((memory) => memory.id);
    if (ids.length !== 2) throw new Error("Direct memory creation did not return two memories.");

    const preview = await t.send(
      `I'm no longer planning the ${topic}. Forget everything you remember about that relocation, but show me what would be removed before deleting anything.`,
    );
    preview.expectOk();
    preview.loadedSkill("supermemory__forget-memory");
    preview.calledTool("supermemory__forget_matching", {
      input: { dryRun: true },
      count: 1,
    });

    await t.send("Yes, remove those memories.");
    t.requireInputRequest({ toolName: "supermemory__forget_matching" });
    const finalized = await t.respondAll("approve");
    finalized.expectOk();
    t.calledTool("supermemory__forget_matching", {
      input: {
        dryRun: false,
        ids: (value) => Array.isArray(value) && ids.every((id) => value.includes(id)),
      },
      count: 1,
    });
    await Promise.all(ids.map((id) => waitForForgottenMemory(id)));
    t.succeeded();
  },
});
