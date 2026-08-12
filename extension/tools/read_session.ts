import { defineTool } from "eve/tools";
import { z } from "zod";

import { readStoredDocument } from "../lib/documents";

export default defineTool({
  description:
    "Read a known previous conversation session using its document ID from a Supermemory search result.",
  inputSchema: z.object({
    documentId: z
      .string()
      .trim()
      .min(1)
      .max(200)
      .describe(
        "The exact results[].documents[].id for a source whose metadata.source_type is conversation.",
      ),
    offset: z
      .number()
      .int()
      .nonnegative()
      .default(0)
      .describe("The exact nextOffset returned by the previous read, or zero."),
  }),
  execute({ documentId, offset }, ctx) {
    return readStoredDocument(documentId, offset, "agent_context", ctx);
  },
});
