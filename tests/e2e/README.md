# Eve extension end-to-end tests

These tests exercise a consuming Eve agent against the live Supermemory API.
They use an isolated per-run container prefix and realistic user scenarios so
they do not touch a developer's normal agent context.

## What is tested

1. Direct API seeding of static memory, dynamic memory, and a conversation document.
2. Profile context injection on `session.started` with no model-facing tool calls.
3. Successful-turn conversation capture and its stored metadata.
4. Search followed by reading a complete previous session.
5. Explicit remembering, fresh-session availability, and frustration routing.
6. Attachment extraction followed by reading from the extraction container.
7. Exact forgetting by memory ID.
8. Matching forget preview, approval, and exact-ID finalization.

Each eval gets a fresh Eve session. Run the suite serially because the cases
create and mutate remote state.

## Required environment

```text
OPENAI_API_KEY
SUPERMEMORY_API_KEY
SUPERMEMORY_E2E_PREFIX
SUPERMEMORY_E2E_RUN_ID
```

The consuming agent must mount `@supermemory/eve` with
`containerTagPrefix: process.env.SUPERMEMORY_E2E_PREFIX`.

Run from the consuming Eve agent:

```bash
eve eval --max-concurrency 1 --timeout 180000 --verbose
```

Artifacts are written by Eve under `.eve/evals/` and contain the complete event
stream, tool inputs, tool outputs, and assertions for every case.
