import type Supermemory from "supermemory";

import type { Namespaces } from "./namespaces.js";

export interface SupermemoryDependencies {
  readonly getClient: () => Promise<Supermemory>;
  readonly namespaces: Namespaces;
}
