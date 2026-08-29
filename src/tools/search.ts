import { defineTool } from "eve/tools";
import { z } from "zod";

import type { SupermemoryDependencies } from "../lib/dependencies.js";
import { SEARCH_SCOPES, searchStoredContext } from "../lib/search-context.js";

export function createSearchTool(dependencies: SupermemoryDependencies) {
  return defineTool({
    description:
      "Search saved memory/context and previous user conversation/session. Use whenever answering the user or carrying out their request could benefit from something they shared, preferred, decided, discussed, or worked on before. For example, before ordering food, search for what they like; before doing a task, search for relevant preferences, decisions, or prior work. Also use when the user asks what you know about them, about a memory or earlier conversation, or about a stored document. Results are summaries; use read_session or read_document when the underlying context is needed.",
    inputSchema: z.object({
      query: z
        .string()
        .trim()
        .min(1)
        .max(2_000)
        .describe("A standalone natural-language retrieval query with one retrieval intent."),
      scope: z
        .enum(SEARCH_SCOPES)
        .default("all")
        .describe(
          "Use memories for durable facts and decisions, conversations for previous agent sessions, documents for stored source wording, or all when the storage form is mixed or unclear.",
        ),
      customId: z
        .string()
        .trim()
        .max(200)
        .optional()
        .describe(
          "Only for a follow-up within a known source: the exact results[].documents[].metadata.source_id from an earlier search result.",
        ),
    }),
    execute(input, ctx) {
      return searchStoredContext(input, { signal: ctx.abortSignal }, dependencies);
    },
  });
}
