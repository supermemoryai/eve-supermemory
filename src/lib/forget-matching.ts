import type { ToolContext } from "eve/tools";
import { z } from "zod";

import type { SupermemoryDependencies } from "./dependencies.js";

export type ForgetMatchingInput = {
  query?: string;
  dryRun: boolean;
  ids?: string[];
  threshold?: number;
  maxForget?: number;
  reason?: string;
};

const forgetCandidateSchema = z.object({
  id: z.string(),
  memory: z.string(),
  score: z.number(),
});

const forgetMatchingResponseSchema = z.discriminatedUnion("dryRun", [
  z.object({
    dryRun: z.literal(true),
    count: z.number().int().nonnegative(),
    forgetBatchId: z.null(),
    summary: z.string(),
    candidates: z.array(forgetCandidateSchema),
  }),
  z.object({
    dryRun: z.literal(false),
    count: z.number().int().nonnegative(),
    forgetBatchId: z.string().nullable(),
    summary: z.string(),
    forgotten: z.array(forgetCandidateSchema),
  }),
]);

export async function forgetMatchingMemories(
  input: ForgetMatchingInput,
  ctx: ToolContext,
  dependencies: SupermemoryDependencies,
) {
  const query = input.query?.trim();
  if (input.dryRun && !query) {
    throw new Error("A query is required for a dry-run preview.");
  }

  if (!input.dryRun && !input.ids?.length) {
    throw new Error("Finalizing requires the exact candidate IDs returned by a dry-run preview.");
  }

  return forgetMatchingResponseSchema.parse(
    await dependencies.client.post<unknown>("/v4/memories/forget-matching", {
      body: {
        ...(query ? { query } : {}),
        containerTag: dependencies.containerTags.context,
        dryRun: input.dryRun,
        ...(!input.dryRun ? { ids: input.ids } : {}),
        ...(input.dryRun && input.threshold !== undefined ? { threshold: input.threshold } : {}),
        ...(input.dryRun && input.maxForget !== undefined ? { maxForget: input.maxForget } : {}),
        ...(input.reason ? { reason: input.reason } : {}),
      },
      signal: ctx.abortSignal,
    }),
  );
}
