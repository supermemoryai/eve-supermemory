import type { SupermemoryDependencies } from "./dependencies.js";

export const SEARCH_SCOPES = ["all", "memories", "documents", "conversations"] as const;

export type SearchScope = (typeof SEARCH_SCOPES)[number];
type SearchMode = "memories" | "documents" | "hybrid";

const SEARCH_MODE_BY_SCOPE = {
  all: "hybrid",
  memories: "memories",
  documents: "documents",
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
  const filters: Array<{ key: string; value: string }> = [];

  if (input.scope === "conversations") {
    filters.push({ key: "source_type", value: "conversation" });
  }

  if (input.customId) {
    filters.push({ key: "source_id", value: input.customId });
  }

  return dependencies.client.search(
    {
      q: input.query,
      containerTag: dependencies.containerTags.context,
      searchMode: SEARCH_MODE_BY_SCOPE[input.scope],
      limit: options.limit ?? 10,
      include: { documents: true },
      ...(filters.length > 0 ? { filters: { AND: filters } } : {}),
    },
    { signal: options.signal },
  );
}
