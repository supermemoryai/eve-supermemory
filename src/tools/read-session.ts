import { defineTool } from "eve/tools";
import { z } from "zod";

import type { SupermemoryDependencies } from "../lib/dependencies.js";
import { readStoredDocument } from "../lib/documents.js";

export function createReadSessionTool(dependencies: SupermemoryDependencies) {
  return defineTool({
    description:
      "Read a previous agent conversation/session. Use after search returns a conversation result whenever answering the user requires the surrounding exchange, what the user or assistant actually said, the sequence of decisions, or exact earlier wording. Pass the exact results[].documents[].id whose metadata.source_type is conversation and start with offset 0. Continue with the returned nextOffset whenever more of that session is needed.",
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
      return readStoredDocument(documentId, offset, "agent_context", ctx, dependencies);
    },
  });
}
