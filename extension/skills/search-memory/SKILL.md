---
name: search-memory
description: Search stored user context, previous agent sessions, and indexed sources with Supermemory. Use when a request may depend on what the user prefers, previously said, decided, or worked on; when they ask “what do you know about me?”, “what did we decide?”, “continue where we left off”, “find the document about…”, or “what did I say about…?”; and whenever prior context would materially improve accuracy or continuity.
---

# Search Supermemory

Use the tools from this skill's mounted extension namespace whose runtime names
end in `__search`, `__read_session`, and `__read_document`.

## Build the retrieval plan

Turn the user's request into natural-language questions with one retrieval
intent each. Resolve references such as “that”, “it”, and “the earlier plan”
from the visible conversation before searching.

Use one search for a focused fact. For a broad request, split the request into
two to four independent facets and search them in parallel. Useful facets
include identity and background, preferences and working style, projects and
goals, and decisions, constraints, or relationships.

Choose the narrowest useful scope:

- `memories`: durable facts, preferences, relationships, decisions, and ongoing context;
- `conversations`: what happened or was said in previous agent sessions;
- `documents`: wording or evidence from stored documents and files;
- `all`: mixed requests or cases where the relevant storage form is unclear.

Start without `customId`. Use an exact
`results[].documents[].metadata.source_id` as `customId` only after a result
identifies the source that should constrain the next search.

## Evaluate and continue

Answer directly when compact memory results are sufficient. Read a source when
the surrounding exchange, exact wording, or documentary evidence matters.

For weak or incomplete results:

1. Rewrite the query as a clearer standalone question or broaden its scope.
2. When a likely source is known, search within its exact custom ID before
   reading the entire source.
3. Inspect the strongest one or two sources when several match.
4. Merge overlapping results and state any remaining uncertainty.

Use `__read_session` when `metadata.source_type` is `conversation`. Use
`__read_document` with `container: agent_context` for other sources. Readers
take the exact `results[].documents[].id`, not the source custom ID. Continue
from `nextOffset` only while more source content is needed.
