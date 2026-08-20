import { defineEval } from "eve/evals";
import { includes } from "eve/evals/expect";

import {
  createConversationDocument,
  createMemories,
  marker,
  waitForDocument,
  waitForMemoryFact,
  waitForProfileFact,
} from "./helpers";

export default defineEval({
  async test(t) {
    const name = "Maya Chen";
    const preference = "architecture diagrams before implementation details";
    const recentProject = "Project Lantern";

    await createMemories([
      {
        content: `The current user's name is ${name}.`,
        isStatic: true,
        metadata: { source: "user_profile" },
      },
      {
        content: `${name} prefers ${preference}.`,
        isStatic: false,
        metadata: { source: "communication_preference" },
      },
      {
        content: `${name} is currently preparing ${recentProject}'s accessibility launch checklist.`,
        isStatic: false,
        metadata: { source: "ongoing_project" },
      },
    ]);
    const conversation = await createConversationDocument({
      content: [
        `user: I'm preparing the accessibility launch checklist for ${recentProject}.`,
        "assistant: Which part should we review first?",
        "user: Start with keyboard navigation, then check the screen-reader labels on the onboarding flow.",
        "assistant: Understood. We'll review keyboard navigation before the onboarding labels.",
      ].join("\n"),
      customId: marker("conv_project_lantern"),
      sessionId: marker("profile_session"),
      taskType: "superrag",
    });

    await Promise.all([
      waitForProfileFact(name),
      waitForMemoryFact(preference),
      waitForMemoryFact(recentProject),
      waitForDocument(conversation.id),
    ]);

    const turn = await t.send(
      "Don't search or use any tools for this answer. Based only on the context you already have, what do you know about me, how do I prefer technical explanations, and what am I currently working on?",
    );

    turn.expectOk();
    turn.usedNoTools();
    t.check(turn.message, includes(name));
    t.check(turn.message, includes(/architecture diagrams[\s\S]*before implementation details/iu));
    t.check(turn.message, includes(recentProject));
    t.succeeded();
  },
});
