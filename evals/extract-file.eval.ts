import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { defineEval } from "eve/evals";
import { includes } from "eve/evals/expect";

export default defineEval({
  async test(t) {
    const fixturePath = resolve(
      dirname(fileURLToPath(import.meta.url)),
      "fixtures/extraction-source.txt",
    );
    const session = await t.session();
    const turn = await session.sendFile(
      "Add this migration brief to Supermemory so we can search it in later sessions. Once it is indexed, read it back and confirm when the production freeze begins and who owns the rollback.",
      fixturePath,
      "text/plain",
    );

    turn.expectOk();
    turn.calledTool("supermemory__extract", { input: { kind: "file" } });
    turn.calledTool("supermemory__read_document", {
      input: { container: "agent_extraction" },
    });
    t.check(turn.message, includes("October 14"));
    t.check(turn.message, includes("Priya Nair"));
    t.succeeded();
  },
});
