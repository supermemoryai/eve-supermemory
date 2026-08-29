import { defineTool } from "eve/tools";
import { z } from "zod";

import type { SupermemoryDependencies } from "../lib/dependencies.js";
import { extractSource } from "../lib/extract-source.js";

export function createExtractTool(dependencies: SupermemoryDependencies) {
  return defineTool({
    description:
      "Extract and durably index a file attachment with SuperRAG. Use whenever the user provides a PDF, image, audio, video, or any other attached file so it can be processed outside the model's context at lower token cost. This is especially useful when the source needs OCR, transcription, or parsing; is too large or unsupported for direct model inspection; must remain searchable across turns; will be accessed repeatedly; or a source-backed memory needs a document ID. Call this tool with one source, keep the returned documentId, then call read_document with container agent_extraction and offset 0 to inspect the processed source before relying on its contents. If processing is still underway, read the same document again after it advances, and continue from nextOffset whenever more content is needed.",
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
      return extractSource(input, ctx, dependencies);
    },
  });
}
