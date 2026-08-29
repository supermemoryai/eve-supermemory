import Supermemory from "supermemory";

export function createSupermemoryClient(apiKey: string): Supermemory {
  return new Supermemory({ apiKey });
}
