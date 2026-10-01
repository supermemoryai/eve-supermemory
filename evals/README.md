# Live Eve evals

These evals run an Eve agent against Supermemory. Each run uses its own container prefix. Upstream pull request #1 targeted the old extension, so these cases now follow the memory provider.

`eve eval` discovers `evals/*.eval.ts` next to `agent/`. Add that agent in this repository. The helpers import this package's source, and they derive the container tag from Eve's scope key.

```ts
// agent/memory/supermemory.ts
import supermemory from "@supermemory/eve";
import { defineMemory } from "eve/memory";

export default defineMemory({
  namespace: process.env.SUPERMEMORY_E2E_NAMESPACE,
  description: "Recall and manage durable context for the current user.",
  provider: supermemory({
    containerTagPrefix: process.env.SUPERMEMORY_E2E_PREFIX,
  }),
  scope: process.env.SUPERMEMORY_E2E_SCOPE ?? "e2e",
});
```

Also export `askQuestion()` from `agent/tools/ask_question.ts`. The slot file name must stay `supermemory.ts` so the tools are `supermemory__*`.

```text
OPENAI_API_KEY
SUPERMEMORY_API_KEY
SUPERMEMORY_E2E_PREFIX
SUPERMEMORY_E2E_NAMESPACE
SUPERMEMORY_E2E_RUN_ID
```

`SUPERMEMORY_E2E_SCOPE` defaults to `e2e`. `SUPERMEMORY_BASE_URL` points the helpers at a self-hosted server. Omit it for `https://api.supermemory.ai`.

```bash
eve eval --max-concurrency 1 --timeout 180000 --verbose
```
