import { defineTool } from "eve/tools";
import { z } from "zod";

import { rememberContext } from "../lib/remember";

export default defineTool({
  description:
    "Write one prepared durable context object to the current caller's Supermemory context, optionally linked to an extracted source document.",
  inputSchema: z.object({
    memory: z
      .string()
      .trim()
      .min(1)
      .max(3_000)
      .refine((memory) => memory.split(/\s+/u).length <= 180, "Memory must be 180 words or fewer.")
      .describe(
        "A dense standalone memory of at most 180 words, composed according to the remember-context skill.",
      ),
    sourceDocumentId: z
      .string()
      .trim()
      .max(200)
      .optional()
      .describe(
        "Omit for ordinary memories. When remembering from an extracted source, use the exact document ID returned by Supermemory extraction.",
      ),
  }),
  execute(input, ctx) {
    return rememberContext(input, ctx);
  },
});
