import { defineTool } from "eve/tools";
import { z } from "zod";

import type { SupermemoryDependencies } from "../lib/dependencies.js";
import { forgetMemory } from "../lib/forget-memory.js";

export function createForgetTool(dependencies: SupermemoryDependencies) {
  return defineTool({
    description:
      "Forget one specific stored memory. Use when the user says forget that, delete this from memory, remove what you know about this, do not retain this, or corrects a fact whose old version must be removed, and one unambiguous stored memory represents what they want deleted. First call search with scope memories unless the exact memory result is already available. Identify the result containing the memory field and pass its exact results[].id as memoryId. When the user identifies several specific memories, call this tool once for each exact ID. Use forget_matching when the request covers all, everything, anything about, or another broad topic, person, project, or category.",
    inputSchema: z.object({
      memoryId: z
        .string()
        .trim()
        .min(1)
        .max(200)
        .describe("The exact results[].id from a search result containing a memory field."),
      reason: z
        .string()
        .trim()
        .max(500)
        .optional()
        .describe("An optional short reason recorded with the forgotten memory."),
    }),
    execute(input, ctx) {
      return forgetMemory(input, ctx, dependencies);
    },
  });
}
