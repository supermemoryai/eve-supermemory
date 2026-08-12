import { basename, isAbsolute, relative, resolve } from "node:path";

import type { ToolContext } from "eve/tools";
import { toFile } from "supermemory";

import { supermemoryClient } from "./client";
import { requireExtractionContainerTag } from "./memory-space";

export type ExtractionInput = {
  kind: "file" | "text" | "url";
  title?: string;
  value: string;
};

function extractionMetadata(input: ExtractionInput, ctx: ToolContext) {
  return {
    source_type: "extraction",
    session_id: ctx.session.id,
    source: "eve-agent",
    input_type: input.kind,
    operation_id: ctx.callId,
    ...(input.title ? { title: input.title } : {}),
  };
}

async function sandboxAttachment(inputPath: string, ctx: ToolContext) {
  const sandbox = await ctx.getSandbox();
  const attachmentsRoot = resolve(sandbox.resolvePath("/workspace/attachments"));
  const resolvedPath = resolve(sandbox.resolvePath(inputPath));
  const relativePath = relative(attachmentsRoot, resolvedPath);

  if (!relativePath || relativePath.startsWith("..") || isAbsolute(relativePath)) {
    throw new Error("Files must come from Eve's /workspace/attachments directory.");
  }

  const bytes = await sandbox.readBinaryFile({
    path: resolvedPath,
    abortSignal: ctx.abortSignal,
  });
  if (!bytes) {
    throw new Error(`Attachment not found: ${inputPath}`);
  }

  return {
    file: await toFile(bytes, basename(resolvedPath)),
    filepath: resolvedPath,
  };
}

export async function extractSource(input: ExtractionInput, ctx: ToolContext) {
  const client = supermemoryClient();
  const containerTag = requireExtractionContainerTag(ctx);
  const metadata = extractionMetadata(input, ctx);

  if (input.kind === "file") {
    const { file, filepath } = await sandboxAttachment(input.value, ctx);
    const result = await client.documents.uploadFile(
      {
        file,
        containerTag,
        filepath,
        metadata: JSON.stringify(metadata),
        taskType: "superrag",
      },
      { signal: ctx.abortSignal },
    );

    return {
      documentId: result.id,
      status: result.status,
    };
  }

  const sourceId = `extraction_${ctx.callId}`;
  const result = await client.documents.add(
    {
      content: input.value,
      containerTag,
      customId: sourceId,
      metadata: {
        ...metadata,
        source_id: sourceId,
      },
      taskType: "superrag",
    },
    { signal: ctx.abortSignal },
  );

  return {
    documentId: result.id,
    status: result.status,
  };
}
