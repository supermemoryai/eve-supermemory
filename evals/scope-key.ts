import { createRequire } from "node:module";
import { pathToFileURL } from "node:url";

type MemoryLockModule = {
  createMemoryLock(input: {
    namespace: string;
    scope: string;
    slot: string;
    turn: null;
    visibility: "scope";
  }): {
    scope: {
      key: string;
    };
  };
};

export async function memoryScopeKey(namespace: string, scope: string): Promise<string> {
  const require = createRequire(import.meta.url);
  const packageJsonPath = require.resolve("eve/package.json");
  const moduleUrl = pathToFileURL(
    packageJsonPath.replace(/package\.json$/, "dist/src/shared/memory-state.js"),
  );
  const memoryState = (await import(moduleUrl.href)) as MemoryLockModule;
  const lock = memoryState.createMemoryLock({
    namespace,
    scope,
    slot: "supermemory",
    turn: null,
    visibility: "scope",
  });

  return lock.scope.key;
}
