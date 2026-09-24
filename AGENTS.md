# Eve Memory Provider Package

This package exports a first-class Eve memory provider. A consuming agent binds
it to a trusted scope in `agent/memory/<slot>.ts` with `defineMemory`.

Before writing code, read the Memory guide from the installed Eve package docs
at `node_modules/eve/docs/memory/overview.mdx`. If package docs are unavailable, use
https://eve.dev/docs/memory as a fallback.

## Authoring

- Declare the provider in `src/provider.ts` with `defineMemoryProvider` from
  `eve/memory`.
- Keep recall, capture, and provider-tool implementations under `src/` with
  shared Supermemory behavior in `src/lib/`.
- Use Eve's opaque `memory.scope.key` as the storage partition for every read
  and write. The consuming agent owns the slot name, scope, namespace, and
  visibility policy.
- Provider tools return a flat map with unqualified names. Eve adds the memory
  slot prefix at runtime.
- This package is not an Eve extension and must not require a companion mount
  under `agent/extensions/`.

## Build and publish

The build emits JavaScript and declarations from `src/` into `dist/`. Ship
`dist/` only. Keep Eve as a peer dependency so the consumer's runtime owns the
memory lifecycle, and pin the Eve development dependency exactly so provider
contract checks remain reproducible.
