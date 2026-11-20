import type { ToolContext } from "eve/tools";
import type Supermemory from "supermemory";

import type { SupermemoryDependencies } from "./dependencies.js";

const MAX_DOCUMENT_CONTENT_BYTES = 50 * 1024;

export const DOCUMENT_CONTAINERS = ["agent_context", "agent_extraction"] as const;
export type DocumentContainer = (typeof DOCUMENT_CONTAINERS)[number];

export async function accessibleDocument(
  client: Supermemory,
  documentId: string,
  namespace: string,
  signal: AbortSignal,
) {
  return client.documents.get(namespace, documentId, {}, { abortSignal: signal });
}

function contentWindow(content: string, offset: number) {
  if (offset > content.length) {
    throw new Error(
      `Offset ${offset} is past the end of the document (${content.length} characters).`,
    );
  }

  let bytes = 0;
  let endOffset = offset;

  for (const character of content.slice(offset)) {
    const characterBytes = Buffer.byteLength(character, "utf8");
    if (bytes + characterBytes > MAX_DOCUMENT_CONTENT_BYTES) break;

    bytes += characterBytes;
    endOffset += character.length;
  }

  return {
    content: content.slice(offset, endOffset),
    offset,
    nextOffset: endOffset < content.length ? endOffset : null,
    totalCharacters: content.length,
  };
}

export async function readStoredDocument(
  documentId: string,
  offset: number,
  container: DocumentContainer,
  ctx: ToolContext,
  dependencies: SupermemoryDependencies,
) {
  const namespace =
    container === "agent_extraction"
      ? dependencies.namespaces.extraction
      : dependencies.namespaces.context;
  const client = await dependencies.getClient();
  const document = await accessibleDocument(client, documentId, namespace, ctx.abortSignal);
  const details = {
    id: document.id,
    customId: document.metadata.source_id ?? document.id,
    title: document.title,
    type: document.type,
    status: document.system.status,
    metadata: document.metadata,
    summary: document.summary,
    system: document.system,
    createdAt: document.system.createdAt,
    updatedAt: document.system.updatedAt,
  };

  if (document.system.status !== "done" || document.content === null) {
    return {
      ...details,
      content: null,
      offset,
      nextOffset: null,
      totalCharacters: document.system.status === "done" ? 0 : null,
    };
  }

  return {
    ...details,
    ...contentWindow(document.content, offset),
  };
}
