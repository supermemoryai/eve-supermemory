import { defineEval } from "eve/evals";

export default defineEval({
  async test(t) {
    const correction = await t.send(
      "What the hell are you doing? I already asked you to explain the cause before changing files, and you changed them first again. Do you fucking get it?",
    );
    correction.expectOk();
    correction.loadedSkill("supermemory__remember-context");
    correction.calledTool("supermemory__remember", {
      input: {
        memory: (value) =>
          typeof value === "string" &&
          /explain|cause|diagnos/iu.test(value) &&
          /before|prior/iu.test(value),
      },
      count: 1,
    });

    const transient = t.newSession();
    const complaint = await transient.send("This compiler error is fucking annoying.");
    complaint.expectOk();
    complaint.notCalledTool("supermemory__remember");
    t.succeeded();
  },
});
