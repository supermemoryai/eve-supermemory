# eve Extension Package

This package is an eve extension — a reusable package of tools, connections,
skills, hooks, and instruction fragments that a consuming agent mounts under
`agent/extensions/`.

Before writing code, read the Extensions guide from the installed eve package
docs. In most installs, those docs are at `node_modules/eve/docs/extensions.md`.
In workspaces or local package installs, resolve the installed `eve` package
location first and read its `docs/extensions.md`. If package docs are
unavailable, use https://eve.dev/docs/extensions as a fallback.

## Authoring

- Declare the extension in `extension/extension.ts` with `defineExtension` from
  `eve/extension`. Config is optional; read bound values via the handle's
  `.config` in tools and hooks.
- Add contributions under `extension/` the same way as in an agent:
  `tools/`, `connections/`, `skills/`, `hooks/`, and optional instruction
  fragments. Names come from file paths; the mount supplies the namespace, so
  name tools for what they do (`search`, not `crm_search`).
- An extension cannot declare `agent.ts`, `sandbox`, `schedules`, or nested
  `extensions/` — those belong to the consuming agent.

## Build and publish

`eve extension build` (wired to `build`/`prepare`) transforms the complete
agent-shaped source tree into `dist/extension/`, emits type declarations and a
compatibility manifest, and fills the package `exports` map. Ship `dist/` only.
Keep `eve` as a required wildcard peer so the consumer's eve is the one that runs;
eve validates extension compatibility from the generated manifest. Keep the eve
development dependency pinned exactly so builds remain reproducible. Upgrade it
when the extension intentionally adopts a newer eve authoring API.
