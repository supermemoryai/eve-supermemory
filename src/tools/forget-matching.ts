import { defineTool } from "eve/tools";
import { z } from "zod";

import type { SupermemoryDependencies } from "../lib/dependencies.js";
import { forgetMatchingMemories } from "../lib/forget-matching.js";

export function createForgetMatchingTool(dependencies: SupermemoryDependencies) {
  return defineTool({
    description:
      "Forget every stored memory within a broad user-defined boundary. Use whenever the user wants to forget, delete, remove, or erase all, everything, or anything about a topic, person, project, or category. First call this tool with dryRun true and a precise query describing the complete boundary; this only previews the matching memories. Show the candidate count and enough candidate detail with ask_question so the user can choose whether to proceed. Their answer to ask_question is the confirmation boundary. When the user confirms, call this tool again with dryRun false and exactly the candidates[].id values returned by that preview, then report the finalized count. This removes derived memories; source documents remain available.",
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
          "Use true to preview without changing anything. Use false only after the user confirms the exact IDs from that preview.",
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
        .describe("Optional similarity floor from 0 to 1. Higher values narrow the preview."),
      maxForget: z
        .number()
        .int()
        .min(1)
        .max(500)
        .optional()
        .describe("Optional maximum number of matching memories in the preview, up to 500."),
      reason: z
        .string()
        .trim()
        .max(500)
        .optional()
        .describe("An optional short reason recorded when memories are forgotten."),
    }),
    execute(input, ctx) {
      return forgetMatchingMemories(input, ctx, dependencies);
    },
  });
}
