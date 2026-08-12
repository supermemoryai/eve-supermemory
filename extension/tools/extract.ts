import { defineTool } from "eve/tools";
import { z } from "zod";

import { extractSource } from "../lib/extract-source";

export default defineTool({
  description:
    "Create one Supermemory SuperRAG document from an Eve attachment, URL, or raw text and return its document ID and processing status.",
  inputSchema: z.object({
    kind: z.enum(["file", "url", "text"]).describe("The kind of source being extracted."),
    value: z
      .string()
      .trim()
      .min(1)
      .max(1_000_000)
      .describe(
        "For a file, its exact Eve attachment path; for a URL, the full URL; for text, the raw source text.",
      ),
    title: z
      .string()
      .trim()
      .min(1)
      .max(300)
      .optional()
      .describe("An optional human-readable title for the source."),
  }),
  execute(input, ctx) {
    return extractSource(input, ctx);
  },
});
