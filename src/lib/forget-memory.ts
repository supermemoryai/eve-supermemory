import type { ToolContext } from "eve/tools";

import type { SupermemoryDependencies } from "./dependencies.js";

export type ForgetMemoryInput = {
  memoryId: string;
  reason?: string;
};

export async function forgetMemory(
  input: ForgetMemoryInput,
  ctx: ToolContext,
  dependencies: SupermemoryDependencies,
) {
  const client = await dependencies.getClient();
  const response = await client.memories.forget(
    dependencies.namespaces.context,
    { ids: [input.memoryId] },
    { abortSignal: ctx.abortSignal },
  );
  return { ...response, ...(input.reason ? { reason: input.reason } : {}) };
}
