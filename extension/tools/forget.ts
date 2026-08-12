import { defineTool } from "eve/tools";
import { z } from "zod";

import { forgetMemory } from "../lib/forget-memory";

export default defineTool({
  description: "Forget one stored Supermemory memory by its exact memory ID.",
  inputSchema: z.object({
    memoryId: z
      .string()
      .trim()
      .min(1)
      .max(200)
      .describe(
        "The exact results[].id from a Supermemory search result containing a memory field.",
      ),
    reason: z
      .string()
      .trim()
      .max(500)
      .optional()
      .describe("An optional short reason recorded with the forgotten memory."),
  }),
  execute(input, ctx) {
    return forgetMemory(input, ctx);
  },
});
