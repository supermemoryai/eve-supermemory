import type { ToolContext } from "eve/tools";

import { supermemoryClient } from "./client";
import { accessibleDocument } from "./documents";
import { requireContainerTag, requireExtractionContainerTag } from "./memory-space";

export type RememberInput = {
  memory: string;
  sourceDocumentId?: string;
};

export async function rememberContext(input: RememberInput, ctx: ToolContext) {
  const sourceId = `memory_${ctx.session.id}`;
  const conversationId = `conv_${ctx.session.id}`;
  const dreaming = "instant";
  const taskType: "memory" = "memory";
  const client = supermemoryClient();
  const requestedSourceDocumentId = input.sourceDocumentId?.trim();
  let sourceDocumentId: string | undefined;

  if (requestedSourceDocumentId) {
    const source = await accessibleDocument(
      client,
      requestedSourceDocumentId,
      requireExtractionContainerTag(ctx),
      ctx.abortSignal,
    );
    if (source.status !== "done") {
      throw new Error(
        "The source document is still processing. Read it again before remembering its contents.",
      );
    }

    sourceDocumentId = source.id;
  }

  const document = {
    containerTag: requireContainerTag(ctx),
    content: input.memory,
    customId: sourceId,
    dreaming,
    metadata: {
      source_id: sourceId,
      source_type: "memory",
      conversation_id: conversationId,
      session_id: ctx.session.id,
      ...(sourceDocumentId ? { source_document_id: sourceDocumentId } : {}),
      source: "eve-agent",
    },
    taskType,
  };

  const result = await client.add(document, {
    signal: ctx.abortSignal,
  });

  return {
    documentId: result.id,
    status: result.status,
    sourceDocumentId: sourceDocumentId ?? null,
  };
}
