import type { ToolContext } from "eve/tools";

import { supermemoryClient } from "./client";
import { requireContainerTag } from "./memory-space";

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
  ctx: ToolContext,
) {
  const filters: Array<{ key: string; value: string }> = [];

  if (input.scope === "conversations") {
    filters.push({ key: "source_type", value: "conversation" });
  }

  if (input.customId) {
    filters.push({ key: "source_id", value: input.customId });
  }

  return supermemoryClient().search(
    {
      q: input.query,
      containerTag: requireContainerTag(ctx),
      searchMode: SEARCH_MODE_BY_SCOPE[input.scope],
      limit: 10,
      include: { documents: true },
      ...(filters.length > 0 ? { filters: { AND: filters } } : {}),
    },
    { signal: ctx.abortSignal },
  );
}
