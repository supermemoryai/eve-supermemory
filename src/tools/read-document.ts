import { defineTool } from "eve/tools";
import { z } from "zod";

import type { SupermemoryDependencies } from "../lib/dependencies.js";
import { DOCUMENT_CONTAINERS, readStoredDocument } from "../lib/documents.js";

export function createReadDocumentTool(dependencies: SupermemoryDependencies) {
  return defineTool({
    description:
      "Read a stored or extracted source document. Use after search identifies a document whenever answering the user requires its original wording, evidence, surrounding content, or details beyond the search result. Also use after extract to inspect the processed source before relying on it. For a search result, pass its exact results[].documents[].id with container agent_context. For an extracted source, pass the returned documentId with container agent_extraction. Start with offset 0 and continue with the returned nextOffset whenever more content is needed.",
    inputSchema: z.object({
      container: z
        .enum(DOCUMENT_CONTAINERS)
        .describe(
          "Use agent_context for persistent context and indexed documents. Use agent_extraction for a file, URL, or text source created by extraction.",
        ),
      documentId: z
        .string()
        .trim()
        .min(1)
        .max(200)
        .describe(
          "The exact results[].documents[].id returned by search, or the documentId returned by extraction.",
        ),
      offset: z
        .number()
        .int()
        .nonnegative()
        .default(0)
        .describe("The exact nextOffset returned by the previous read, or zero."),
    }),
    execute({ container, documentId, offset }, ctx) {
      return readStoredDocument(documentId, offset, container, ctx, dependencies);
    },
  });
}
