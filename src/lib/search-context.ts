import type { SupermemoryDependencies } from "./dependencies.js";

export const SEARCH_SCOPES = ["all", "memories", "documents", "conversations"] as const;

export type SearchScope = (typeof SEARCH_SCOPES)[number];
type SearchMode = "memories" | "chunks" | "hybrid";

const SEARCH_MODE_BY_SCOPE = {
  all: "hybrid",
  memories: "memories",
  documents: "chunks",
  conversations: "hybrid",
} satisfies Record<SearchScope, SearchMode>;

export async function searchStoredContext(
  input: {
    query: string;
    scope: SearchScope;
    customId?: string;
  },
  options: {
    limit?: number;
    signal: AbortSignal;
  },
  dependencies: SupermemoryDependencies,
) {
  const filters: Array<{ field: string; operator: "eq"; value: string }> = [];

  if (input.scope === "conversations") {
    filters.push({ field: "source_type", operator: "eq", value: "conversation" });
  }

  if (input.customId) {
    filters.push({ field: "source_id", operator: "eq", value: input.customId });
  }

  const client = await dependencies.getClient();
  const response = await client.search(
    dependencies.namespaces.context,
    {
      query: input.query,
      searchMode: SEARCH_MODE_BY_SCOPE[input.scope],
      limit: options.limit ?? 10,
      include: { documents: true },
      ...(filters.length > 0 ? { filter: { operator: "and", operands: filters } } : {}),
    },
    { abortSignal: options.signal },
  );

  return {
    ...response,
    results: response.results.map((result) => ({
      ...result,
      documents: result.included?.document ? [result.included.document] : [],
    })),
  };
}
