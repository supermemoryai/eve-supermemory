import { defineTool } from "eve/tools";
import { z } from "zod";

import { DOCUMENT_CONTAINERS, readStoredDocument } from "../lib/documents";

export default defineTool({
  description:
    "Read a known document from the agent context or agent extraction container using its exact Supermemory document ID. Returns its current processing status and available content.",
  inputSchema: z.object({
    container: z
      .enum(DOCUMENT_CONTAINERS)
      .describe(
        "Choose agent_context for persistent agent context such as memories, previous conversations, and indexed documents. Choose agent_extraction for documents created by extracting a file, URL, or raw text.",
      ),
    documentId: z
      .string()
      .trim()
      .min(1)
      .max(200)
      .describe(
        "The exact results[].documents[].id returned by Supermemory search, or the documentId returned by extraction.",
      ),
    offset: z
      .number()
      .int()
      .nonnegative()
      .default(0)
      .describe("The exact nextOffset returned by the previous read, or zero."),
  }),
  execute({ container, documentId, offset }, ctx) {
    return readStoredDocument(documentId, offset, container, ctx);
  },
});
