import assert from "node:assert/strict";
import test from "node:test";

import { createSupermemoryClientFactory } from "../src/lib/client.js";
import { resolveOptions } from "../src/options.js";

const ENV_KEYS = ["SUPERMEMORY_API_KEY", "SUPERMEMORY_BASE_URL", "SUPERMEMORY_LOG"] as const;

function withSupermemoryEnv(
  values: Partial<Record<(typeof ENV_KEYS)[number], string | undefined>>,
  run: () => Promise<void>,
): Promise<void> {
  const previous = new Map<string, string | undefined>();
  for (const key of ENV_KEYS) previous.set(key, process.env[key]);

  for (const key of ENV_KEYS) {
    const value = values[key];
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }

  return run().finally(() => {
    for (const [key, value] of previous) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  });
}

test("omitted client fields leave the SDK environment defaults in place", async () => {
  await withSupermemoryEnv(
    {
      SUPERMEMORY_API_KEY: "sm_from_env",
      SUPERMEMORY_BASE_URL: "http://127.0.0.1:6767",
    },
    async () => {
      const client = await createSupermemoryClientFactory()();

      assert.equal(client.apiKey, "sm_from_env");
      assert.equal(client.baseURL, "http://127.0.0.1:6767");
    },
  );
});

test("explicit client options override the SDK environment defaults", async () => {
  await withSupermemoryEnv(
    {
      SUPERMEMORY_API_KEY: "sm_from_env",
      SUPERMEMORY_BASE_URL: "http://127.0.0.1:6767",
    },
    async () => {
      const client = await createSupermemoryClientFactory(() => "sm_from_code", {
        baseURL: "http://localhost:9999",
        timeout: 1234,
      })();

      assert.equal(client.apiKey, "sm_from_code");
      assert.equal(client.baseURL, "http://localhost:9999");
      assert.equal(client.timeout, 1234);
    },
  );
});

test("resolveOptions keeps the full client options object", () => {
  const config = resolveOptions({
    client: {
      baseURL: "http://localhost:6767",
      maxRetries: 0,
      timeout: 20_000,
    },
  });

  assert.equal(config.apiKey, undefined);
  assert.deepEqual(config.client, {
    baseURL: "http://localhost:6767",
    maxRetries: 0,
    timeout: 20_000,
  });
});

test("an empty API key resolver fails before a client is created", async () => {
  await assert.rejects(createSupermemoryClientFactory(() => "")(), /empty value/);
});
