import Supermemory from "supermemory";

import type { SupermemoryApiKey, SupermemoryClientOptions } from "../options.js";

export function createSupermemoryClientFactory(
  apiKey?: SupermemoryApiKey,
  clientOptions?: SupermemoryClientOptions,
): () => Promise<Supermemory> {
  const createClient = async () => {
    const resolvedApiKey = typeof apiKey === "function" ? await apiKey() : apiKey;
    if (apiKey !== undefined && !resolvedApiKey) {
      throw new Error("The Supermemory API key resolver returned an empty value.");
    }

    return new Supermemory({
      ...clientOptions,
      ...(resolvedApiKey ? { apiKey: resolvedApiKey } : {}),
    });
  };

  if (typeof apiKey === "function") return createClient;

  let pending: Promise<Supermemory> | undefined;
  return () => {
    pending ??= createClient().catch((error: unknown) => {
      pending = undefined;
      throw error;
    });
    return pending;
  };
}
