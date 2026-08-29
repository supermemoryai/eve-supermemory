import type { ToolContext } from "eve/tools";

import type { SupermemoryDependencies } from "./dependencies.js";

export type ForgetMemoryInput = {
  memoryId: string;
  reason?: string;
};

export function forgetMemory(
  input: ForgetMemoryInput,
  ctx: ToolContext,
  dependencies: SupermemoryDependencies,
) {
  return dependencies.client.memories.forget(
    {
      containerTag: dependencies.containerTags.context,
      id: input.memoryId,
      ...(input.reason ? { reason: input.reason } : {}),
    },
    { signal: ctx.abortSignal },
  );
}
