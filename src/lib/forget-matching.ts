import type { ToolContext } from "eve/tools";

import type { SupermemoryDependencies } from "./dependencies.js";

export type ForgetMatchingInput = {
  query?: string;
  dryRun: boolean;
  ids?: string[];
  threshold?: number;
  maxForget?: number;
  reason?: string;
};

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

  const client = await dependencies.getClient();
  const response = input.dryRun
    ? await client.memories.forgetMatching(
        dependencies.namespaces.context,
        { query: query ?? "", dryRun: true },
        { abortSignal: ctx.abortSignal },
      )
    : await client.memories.forget(
        dependencies.namespaces.context,
        { ids: input.ids ?? [] },
        { abortSignal: ctx.abortSignal },
      );
  let candidates = response.matches;
  if (input.dryRun && input.threshold !== undefined) {
    const scored = await client.search(
      dependencies.namespaces.context,
      {
        query: query ?? "",
        searchMode: "memories",
        threshold: input.threshold,
        limit: 100,
      },
      { abortSignal: ctx.abortSignal },
    );
    const scoredIds = new Set(scored.results.map((result) => result.id));
    candidates = candidates.filter((candidate) => scoredIds.has(candidate.id));
  }
  const matches =
    input.dryRun && input.maxForget !== undefined
      ? candidates.slice(0, input.maxForget)
      : candidates;

  return {
    ...response,
    matches,
    ...(input.reason ? { reason: input.reason } : {}),
    dryRun: input.dryRun,
    count: input.dryRun ? matches.length : response.count,
    forgetBatchId: null,
    summary:
      response.errors.length > 0
        ? `Processed ${response.count} memories with ${response.errors.length} failures.`
        : `${input.dryRun ? "Matched" : "Forgot"} ${input.dryRun ? matches.length : response.count} memories.`,
    ...(input.dryRun ? { candidates: matches } : { forgotten: matches }),
  };
}
