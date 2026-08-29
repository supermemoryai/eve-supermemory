import type Supermemory from "supermemory";

import type { ContainerTags } from "./container-tags.js";

export interface SupermemoryDependencies {
  readonly client: Supermemory;
  readonly containerTags: ContainerTags;
}
