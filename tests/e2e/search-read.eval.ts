import { defineEval } from "eve/evals";
import { includes } from "eve/evals/expect";

import { createConversationDocument, marker, waitForDocument } from "./helpers";

export default defineEval({
  async test(t) {
    const topic = "Project Atlas migration";
    const conversation = await createConversationDocument({
      content: [
        `user: For the ${topic}, schedule the database cutover for Friday at 9:00 PM Pacific.`,
        "assistant: Friday at 9:00 PM Pacific is recorded for the database cutover.",
        "user: Priya Nair owns the rollback, and writes should freeze 30 minutes before cutover.",
        "assistant: Understood. Priya owns rollback and the write freeze begins 30 minutes before cutover.",
      ].join("\n"),
      customId: marker("conv_project_atlas"),
      sessionId: marker("project_atlas_session"),
      taskType: "superrag",
    });
    await waitForDocument(conversation.id);

    const turn = await t.send(
      `What did we decide in our previous session about the ${topic}? Read that session and tell me the cutover time, who owns rollback, and when writes should freeze.`,
    );

    turn.expectOk();
    turn.loadedSkill("supermemory__search-memory");
    turn.calledTool("supermemory__search", {
      input: { scope: "conversations" },
    });
    turn.calledTool("supermemory__read_session");
    t.check(turn.message, includes(/Friday[\s\S]*9(?::00)?\s*PM/iu));
    t.check(turn.message, includes("Priya Nair"));
    t.check(turn.message, includes("30 minutes"));
    t.succeeded();
  },
});
