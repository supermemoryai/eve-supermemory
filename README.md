# @supermemory/eve

Durable user context for [Eve](https://eve.dev) agents, powered by
[Supermemory](https://supermemory.ai).

The extension gives an Eve agent persistent profile context, automatic conversation capture,
search and source reading, explicit remembering, document extraction, and agentic forgetting.
Every capability is scoped to the verified Eve caller.

## Setup

Install the extension:

```bash
pnpm add @supermemory/eve
```

Create `agent/extensions/supermemory.ts` in the consuming Eve agent:

```ts
import supermemory from "@supermemory/eve";

const apiKey = process.env.SUPERMEMORY_API_KEY;

if (!apiKey) {
  throw new Error("SUPERMEMORY_API_KEY is required");
}

export default supermemory({ apiKey });
```

The mount filename is the namespace. Mounting the package as `supermemory.ts` exposes the
`supermemory__search` tool and the distinct `supermemory__search-memory` skill.

## What it adds

### Automatic context

- **Session profile context** loads private user profile data, recent memories, and recent session
  summaries when an agent session starts.
- **Conversation capture** writes each successful user-assistant turn to the current session's
  Supermemory conversation document.
- Failed and cancelled turns are discarded.
- When a turn uses a Supermemory tool, capture applies a stricter extraction policy so retrieved or
  generated context is not learned again as a new user memory.

### Tools

| Tool | Purpose |
| --- | --- |
| `search` | Search memories, documents, conversations, or all stored context, optionally narrowed by source custom ID. |
| `read_session` | Read a known previous agent conversation, with bounded continuation offsets. |
| `read_document` | Read a known document from agent context or the extraction container. |
| `remember` | Save one prepared durable context object, optionally linked to an extracted source. |
| `extract` | Index an attachment, URL, or raw text for durable document analysis. |
| `forget` | Forget one exact memory identified by search. |
| `forget_matching` | Preview and then finalize forgetting a related group of memories. |

Scoped search follow-ups use `results[].documents[].metadata.source_id`, which is the source
custom ID. `read_session` and `read_document` instead use the real
`results[].documents[].id` returned by Supermemory.

### Skills

| Skill | Workflow |
| --- | --- |
| `search-memory` | Plan focused or multi-part retrieval, then read sources when snippets are insufficient. |
| `remember-context` | Compose durable context according to its type and preserve source provenance when needed. |
| `extract-sources` | Offload, index, and inspect sources that need durable or specialized processing. |
| `forget-memory` | Remove one exact memory or preview and confirm a related group. |

## Runtime model

The developer supplies one Supermemory API key. The extension derives the active identity from
Eve's verified session auth and keeps raw container tags away from the model.

With the default prefix, each caller receives:

- `agent_<principalId>` for memories, captured conversations, and persistent agent context;
- `agent_extraction_<principalId>` for files, URLs, and text being analyzed.

Conversation turns for one agent session are stored under `conv_<sessionId>`. Explicit memories use
`memory_<sessionId>`, and extracted sources use a call-scoped identifier.

The `read_document` tool exposes only the logical choices `agent_context` and `agent_extraction`.
The extension resolves the real per-user container and verifies that the requested document belongs
to it before returning content.

## Configuration

```ts
import supermemory from "@supermemory/eve";

const apiKey = process.env.SUPERMEMORY_API_KEY;

if (!apiKey) {
  throw new Error("SUPERMEMORY_API_KEY is required");
}

export default supermemory({
  apiKey,
  containerTagPrefix: "agent",
  profileContext: {
    timeZone: "America/Los_Angeles",
  },
  capture: {
    enabled: true,
    taskType: "memory",
    dreaming: "dynamic",
    metadata: {},
  },
});
```

| Option | Default | Purpose |
| --- | --- | --- |
| `apiKey` | Required | Supermemory project API key. |
| `containerTagPrefix` | `agent` | Prefix used for per-caller context and extraction containers. |
| `profileContext.timeZone` | `UTC` | IANA time zone used when rendering recent session dates. |
| `capture.enabled` | `true` | Enables automatic capture after successful turns. |
| `capture.entityContext` | Built in | Overrides the memory extraction guidance for conversation capture. |
| `capture.taskType` | `memory` | Supermemory ingestion task: `memory` or `superrag`. |
| `capture.dreaming` | `dynamic` | Memory processing mode: `instant` or `dynamic`. |
| `capture.metadata` | `{}` | Developer-owned metadata added to captured conversation documents. |

## Extension structure

```text
@supermemory/eve
├── package.json
└── extension
    ├── extension.ts
    ├── hooks
    │   └── capture.ts
    ├── instructions
    │   └── profile_context.ts
    ├── tools
    ├── skills
    └── lib
```

`extension/instructions/profile_context.ts` is executable Eve capability code, not documentation.
It defines a dynamic instruction for `session.started`, fetches the current caller's Supermemory
profile context, and contributes it to the model's system instructions for that session.

## Develop

```bash
npm ci
npm run check
npm run typecheck
npm run build
npm pack --dry-run
```

`eve extension build` writes the publishable package to `dist`. The npm package ships `dist` plus
the standard package metadata and README; consumers do not compile the extension source.
