import Supermemory from "supermemory";

import extension from "../extension";

export function supermemoryClient(): Supermemory {
  return new Supermemory({ apiKey: extension.config.apiKey });
}
