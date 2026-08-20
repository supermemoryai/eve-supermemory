import { defineEval } from "eve/evals";
import { equals, includes } from "eve/evals/expect";

import { waitForDocumentContent } from "./helpers";

export default defineEval({
  async test(t) {
    const update = "The staging deployment completed successfully.";
    const turn = await t.send(`Acknowledge this update in one short sentence: ${update}`);
    turn.expectOk();
    turn.usedNoTools();

    const customId = `conv_${turn.sessionId}`;
    const document = await waitForDocumentContent(customId, update);
    const metadata = document?.metadata;

    t.check(document?.customId, equals(customId));
    t.check(document?.content, includes(update));
    t.check(
      metadata && typeof metadata === "object" ? Reflect.get(metadata, "source_type") : null,
      equals("conversation"),
    );
    t.check(
      metadata && typeof metadata === "object" ? Reflect.get(metadata, "session_id") : null,
      equals(turn.sessionId),
    );
    t.succeeded();
  },
});
