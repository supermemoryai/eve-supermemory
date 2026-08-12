import type { ToolContext } from "eve/tools";

import { supermemoryClient } from "./client";
import { requireContainerTag } from "./memory-space";

export type ForgetMemoryInput = {
  memoryId: string;
  reason?: string;
};

export function forgetMemory(input: ForgetMemoryInput, ctx: ToolContext) {
  return supermemoryClient().memories.forget(
    {
      containerTag: requireContainerTag(ctx),
      id: input.memoryId,
      ...(input.reason ? { reason: input.reason } : {}),
    },
    { signal: ctx.abortSignal },
  );
}
