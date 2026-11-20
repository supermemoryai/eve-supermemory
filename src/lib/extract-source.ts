import { basename, isAbsolute, relative, resolve } from "node:path";

import type { ToolContext } from "eve/tools";

import type { SupermemoryDependencies } from "./dependencies.js";

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
  const attachmentsRoot = resolve(sandbox.resolvePath("/workspace/.eve/attachments"));
  const resolvedPath = resolve(sandbox.resolvePath(inputPath));
  const relativePath = relative(attachmentsRoot, resolvedPath);

  if (!relativePath || relativePath.startsWith("..") || isAbsolute(relativePath)) {
    throw new Error("Files must come from Eve's /workspace/.eve/attachments directory.");
  }

  const bytes = await sandbox.readBinaryFile({
    path: resolvedPath,
    signal: ctx.abortSignal,
  });
  if (!bytes) {
    throw new Error(`Attachment not found: ${inputPath}`);
  }

  return {
    file: new File([Uint8Array.from(bytes)], basename(resolvedPath)),
  };
}

export async function extractSource(
  input: ExtractionInput,
  ctx: ToolContext,
  dependencies: SupermemoryDependencies,
) {
  const client = await dependencies.getClient();
  const { namespaces } = dependencies;
  const metadata = extractionMetadata(input, ctx);

  if (input.kind === "file") {
    const { file } = await sandboxAttachment(input.value, ctx);
    const result = await client.documents.uploadFile(
      namespaces.extraction,
      {
        file,
        metadata: JSON.stringify(metadata),
        taskType: "superrag",
      },
      { abortSignal: ctx.abortSignal },
    );

    return {
      documentId: result.id,
      status: result.status,
    };
  }

  const sourceId = `extraction_${ctx.callId}`;
  const result = await client.add(
    namespaces.extraction,
    {
      content: input.value,
      id: sourceId,
      metadata: {
        ...metadata,
        source_id: sourceId,
      },
      taskType: "superrag",
    },
    { abortSignal: ctx.abortSignal },
  );

  return {
    documentId: result.id,
    status: result.status,
  };
}
