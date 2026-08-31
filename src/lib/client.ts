import Supermemory from "supermemory";

import type { SupermemoryApiKey } from "../options.js";

export function createSupermemoryClientFactory(
  apiKey: SupermemoryApiKey,
): () => Promise<Supermemory> {
  if (typeof apiKey === "string") {
    const client = new Supermemory({ apiKey });
    return async () => client;
  }

  const resolveApiKey = apiKey;
  return async () => {
    const resolvedApiKey = await resolveApiKey();
    if (!resolvedApiKey) {
      throw new Error("The Supermemory API key resolver returned an empty value.");
    }

    return new Supermemory({ apiKey: resolvedApiKey });
  };
}
