import type { ToolContext } from "eve/tools";
import type Supermemory from "supermemory";

import { supermemoryClient } from "./client";
import { requireContainerTag, requireExtractionContainerTag } from "./memory-space";

const MAX_DOCUMENT_CONTENT_BYTES = 50 * 1024;

export const DOCUMENT_CONTAINERS = ["agent_context", "agent_extraction"] as const;
export type DocumentContainer = (typeof DOCUMENT_CONTAINERS)[number];

export async function accessibleDocument(
  client: Supermemory,
  documentId: string,
  containerTag: string,
  signal: AbortSignal,
) {
  const document = await client.documents.get(documentId, { signal });

  if (!document.containerTags?.includes(containerTag)) {
    throw new Error("This document is not available in the selected container.");
  }

  return document;
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
) {
  const containerTag =
    container === "agent_extraction"
      ? requireExtractionContainerTag(ctx)
      : requireContainerTag(ctx);

  const document = await accessibleDocument(
    supermemoryClient(),
    documentId,
    containerTag,
    ctx.abortSignal,
  );

  const details = {
    id: document.id,
    customId: document.customId,
    connectionId: document.connectionId,
    title: document.title,
    type: document.type,
    status: document.status,
    taskType: document.taskType,
    metadata: document.metadata,
    summary: document.summary,
    source: document.source,
    url: document.url,
    filepath: document.filepath,
    createdAt: document.createdAt,
    updatedAt: document.updatedAt,
  };

  if (document.status !== "done" || document.content === null) {
    return {
      ...details,
      content: null,
      offset,
      nextOffset: null,
      totalCharacters: document.status === "done" ? 0 : null,
    };
  }

  return {
    ...details,
    ...contentWindow(document.content, offset),
  };
}
