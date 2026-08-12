import { defineTool } from "eve/tools";
import { z } from "zod";

import { SEARCH_SCOPES, searchStoredContext } from "../lib/search-context";

export default defineTool({
  description:
    "Search stored Supermemory memories and document content in the current caller's agent context container. Optionally narrow a follow-up using a source custom ID returned in document metadata.",
  inputSchema: z.object({
    query: z
      .string()
      .trim()
      .min(1)
      .max(2_000)
      .describe("A standalone natural-language retrieval query."),
    scope: z
      .enum(SEARCH_SCOPES)
      .default("all")
      .describe(
        "Search all stored context, durable memories, document chunks, or previous conversations.",
      ),
    customId: z
      .string()
      .trim()
      .max(200)
      .optional()
      .describe(
        "The exact results[].documents[].metadata.source_id from an earlier search result when continuing within that source.",
      ),
  }),
  execute(input, ctx) {
    return searchStoredContext(input, ctx);
  },
});
