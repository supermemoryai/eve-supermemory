import type { ToolContext } from "eve/tools";
import { addDocument } from "./add-document.js";
import type { SupermemoryDependencies } from "./dependencies.js";
import { accessibleDocument } from "./documents.js";

export type RememberInput = {
  memory: string;
  sourceDocumentId?: string;
};

export async function rememberContext(
  input: RememberInput,
  ctx: ToolContext,
  dependencies: SupermemoryDependencies,
) {
  const sourceId = `memory_${ctx.session.id}`;
  const conversationId = `conv_${ctx.session.id}`;
  const requestedSourceDocumentId = input.sourceDocumentId?.trim();
  let sourceDocumentId: string | undefined;
  const client = await dependencies.getClient();

  if (requestedSourceDocumentId) {
    const source = await accessibleDocument(
      client,
      requestedSourceDocumentId,
      dependencies.containerTags.extraction,
      ctx.abortSignal,
    );
    if (source.status !== "done") {
      throw new Error(
        "The source document is still processing. Read it again before remembering its contents.",
      );
    }

    sourceDocumentId = source.id;
  }

  const result = await addDocument(
    client,
    {
      containerTag: dependencies.containerTags.context,
      content: input.memory,
      customId: sourceId,
      dreaming: "instant",
      metadata: {
        source_id: sourceId,
        source_type: "memory",
        conversation_id: conversationId,
        session_id: ctx.session.id,
        ...(sourceDocumentId ? { source_document_id: sourceDocumentId } : {}),
        source: "eve-agent",
      },
      taskType: "memory",
    },
    ctx.abortSignal,
  );

  return {
    documentId: result.id,
    status: result.status,
    sourceDocumentId: sourceDocumentId ?? null,
  };
}
