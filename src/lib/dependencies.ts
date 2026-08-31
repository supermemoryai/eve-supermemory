import type Supermemory from "supermemory";

import type { ContainerTags } from "./container-tags.js";

export interface SupermemoryDependencies {
  readonly getClient: () => Promise<Supermemory>;
  readonly containerTags: ContainerTags;
}
