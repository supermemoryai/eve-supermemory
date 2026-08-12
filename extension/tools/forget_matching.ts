import { defineTool } from "eve/tools";
import { z } from "zod";

import { forgetMatchingMemories } from "../lib/forget-matching";

export default defineTool({
  description:
    "Preview semantic matches for a broad forget request or finalize a previously previewed set of exact memory IDs. Finalization requires user approval.",
  inputSchema: z.object({
    query: z
      .string()
      .trim()
      .max(2_000)
      .optional()
      .describe(
        "For dryRun true: a specific natural-language description of everything the user wants forgotten.",
      ),
    dryRun: z
      .boolean()
      .default(true)
      .describe(
        "Use true to preview without changing anything. Use false only to finalize the exact IDs from that preview.",
      ),
    ids: z
      .array(z.string().trim().min(1).max(200))
      .max(500)
      .optional()
      .describe(
        "For dryRun false: the exact candidates[].id values returned by the preceding dry-run call.",
      ),
    threshold: z
      .number()
      .min(0)
      .max(1)
      .optional()
      .describe("Optional similarity floor from 0 to 1. Higher values produce a narrower preview."),
    maxForget: z
      .number()
      .int()
      .min(1)
      .max(500)
      .optional()
      .describe(
        "Optional maximum number of matching memories to include in the preview, up to 500.",
      ),
    reason: z
      .string()
      .trim()
      .max(500)
      .optional()
      .describe("An optional short reason recorded when memories are forgotten."),
  }),
  approval: ({ toolInput }) => (toolInput?.dryRun === false ? "user-approval" : "not-applicable"),
  execute(input, ctx) {
    return forgetMatchingMemories(input, ctx);
  },
});
