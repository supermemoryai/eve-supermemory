import { defineEval } from "eve/evals";
import { includes } from "eve/evals/expect";

import { waitForDocumentContent, waitForMemoryFact } from "./helpers.js";

export default defineEval({
  async test(t) {
    const preference = "list the failing check before the explanation";
    const turn = await t.send(
      `Remember this for future sessions: when you report test failures, ${preference}.`,
    );

    turn.expectOk();
    turn.calledTool("supermemory__remember", {
      input: {
        memory: (value) =>
          typeof value === "string" &&
          /failing check[\s\S]*(?:before|followed by)[\s\S]*(?:explanation|details)/iu.test(value),
      },
      count: 1,
    });
    await Promise.all([
      waitForDocumentContent(`memory_${turn.sessionId}`, "failing check"),
      waitForMemoryFact("failing check"),
    ]);

    const fresh = await t.session();
    const recall = await fresh.send(
      "Don't search or use any tools. How should you format test failures for me?",
    );
    recall.expectOk();
    recall.usedNoTools();
    t.check(
      recall.message,
      includes(/failing check[\s\S]*(?:before|followed by)[\s\S]*(?:explanation|details)/iu),
    );
    t.succeeded();
  },
});
