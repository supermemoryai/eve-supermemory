import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, unlinkSync, writeFileSync } from "node:fs";
import { setTimeout as delay } from "node:timers/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import Supermemory from "supermemory";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const envFile = join(root, ".env.local");
const dotenvFile = join(root, ".env");
const overrideFile = join(root, ".env.supermemory");
const baseURL = "http://127.0.0.1:6767";
const forwardedKeys = [
  "OPENAI_API_KEY",
  "OPENAI_BASE_URL",
  "OPENAI_MODEL",
  "OPENAI_FAST_MODEL",
  "OPENAI_TEXT_MODEL",
  "ANTHROPIC_API_KEY",
  "GEMINI_API_KEY",
  "GROQ_API_KEY",
];

const command = process.argv[2] ?? "up";
const azureShimURL = "http://azure-shim:8080/v1";
let composePrefix = [];

function compose(args, options = {}) {
  return execFileSync("docker", ["compose", ...composePrefix, ...args], {
    cwd: root,
    encoding: "utf8",
    stdio: options.silent ? ["ignore", "pipe", "pipe"] : "inherit",
  });
}

function redact(text) {
  let redacted = text
    .replace(/\bsm_[A-Za-z0-9_-]+\b/g, "sm_…")
    .replace(/\bsk-[A-Za-z0-9_-]+\b/g, "sk-…");
  for (const path of [dotenvFile, envFile, overrideFile]) {
    for (const [key, value] of readEnv(path)) {
      if (/KEY|TOKEN|SECRET/i.test(key) && value.length > 8) {
        redacted = redacted.split(value).join(`${key}=…`);
      }
    }
  }
  return redacted;
}

// A custom base URL makes the server use its OpenAI-compatible client, which
// posts to `{base}/chat/completions`. Portal samples often include `/responses`.
function normalizeOpenAIBaseURL(value) {
  let url;
  try {
    url = new URL(value);
  } catch {
    return value.trim().replace(/\/+$/, "");
  }
  let path = url.pathname.replace(/\/+$/, "");
  if (path.endsWith("/responses")) path = path.slice(0, -"/responses".length);
  url.pathname = path || "/";
  url.search = "";
  url.hash = "";
  return url.toString().replace(/\/+$/, "");
}

function fail(message) {
  let logs = "";
  try {
    logs = compose(["logs", "--tail", "80", "supermemory"], { silent: true });
  } catch {
    logs = "";
  }
  console.error(`FAILED: ${message}`);
  if (logs.trim()) console.error(redact(logs).trim());
  process.exit(1);
}

function readEnv(path) {
  if (!existsSync(path)) return new Map();
  const values = new Map();
  for (const line of readFileSync(path, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    values.set(trimmed.slice(0, eq), trimmed.slice(eq + 1));
  }
  return values;
}

function writeEnv(path, values) {
  const lines = [...values.entries()].map(([key, value]) => `${key}=${value}`);
  writeFileSync(path, `${lines.join("\n")}\n`, { mode: 0o600 });
}

function scrapeApiKey(logs) {
  return logs.match(/\bsm_[A-Za-z0-9_-]+\b/)?.[0] ?? "";
}

async function waitForServer() {
  const deadline = Date.now() + 8 * 60 * 1000;
  while (Date.now() < deadline) {
    let state = "";
    try {
      state = compose(["ps", "-a", "--format", "{{.Service}} {{.State}}"], { silent: true });
    } catch (error) {
      fail(error instanceof Error ? error.message : String(error));
    }
    const line = state
      .split("\n")
      .map((entry) => entry.trim())
      .find((entry) => entry.startsWith("supermemory "));
    if (line && /\b(exited|dead|removing)\b/.test(line)) {
      fail(`container stopped (${line})`);
    }
    try {
      await fetch(baseURL, { signal: AbortSignal.timeout(2000) });
      return;
    } catch {
      await delay(2000);
    }
  }
  fail("timed out waiting for http://127.0.0.1:6767");
}

async function smoke(apiKey) {
  process.env.SUPERMEMORY_API_KEY = apiKey;
  process.env.SUPERMEMORY_BASE_URL = baseURL;
  const client = new Supermemory();
  const marker = `local-docker-${Date.now()}`;
  const added = await client.documents.add({
    content: `Local docker smoke marker ${marker}.`,
    containerTag: "eve_local_docker",
  });
  const document = await client.documents.get(added.id);
  if (!document.content?.includes(marker)) {
    throw new Error(`stored document ${added.id} did not contain the smoke marker`);
  }

  const deadline = Date.now() + 180_000;
  let lastStatus = document.status;
  while (Date.now() < deadline) {
    const current = await client.documents.get(added.id);
    lastStatus = current.status;
    if (current.status === "failed") break;
    const found = await client.search.documents({
      q: marker,
      containerTags: ["eve_local_docker"],
    });
    if (found.results.some((result) => result.documentId === added.id)) {
      return { id: added.id, status: current.status, searchable: true };
    }
    if (current.status === "done") break;
    await delay(2000);
  }
  return { id: added.id, status: lastStatus, searchable: false };
}

function providerEnv() {
  const values = readEnv(dotenvFile);
  for (const [key, value] of readEnv(envFile)) values.set(key, value);
  for (const key of forwardedKeys) {
    const value = process.env[key]?.trim();
    if (value) values.set(key, value);
  }
  return values;
}

async function up() {
  const provider = providerEnv();
  const rawBase = provider.get("OPENAI_BASE_URL")?.trim() ?? "";
  const normalized = rawBase ? normalizeOpenAIBaseURL(rawBase) : "";
  const azure = /services\.ai\.azure\.com|openai\.azure\.com/i.test(normalized);
  const overrides = new Map();
  if (azure) overrides.set("OPENAI_BASE_URL", azureShimURL);
  else if (normalized && normalized !== rawBase.replace(/\/+$/, "")) {
    overrides.set("OPENAI_BASE_URL", normalized);
  }
  const model = provider.get("OPENAI_MODEL")?.trim();
  if (provider.get("OPENAI_API_KEY") && azure && !model) {
    fail(
      "Azure Foundry needs OPENAI_MODEL set to a deployment name. The server default gpt-5.1 is not a deployment.",
    );
  }
  composePrefix = azure ? ["--profile", "azure"] : [];
  if (overrides.size > 0) writeEnv(overrideFile, overrides);
  else if (existsSync(overrideFile)) unlinkSync(overrideFile);

  const values = readEnv(envFile);
  let changed = false;
  for (const key of forwardedKeys) {
    const value = process.env[key]?.trim();
    if (value && values.get(key) !== value) {
      values.set(key, value);
      changed = true;
    }
  }
  if (changed) writeEnv(envFile, values);

  try {
    compose(["up", "-d", "--build"]);
  } catch {
    fail("docker compose up failed");
  }

  await waitForServer();

  let logs = "";
  try {
    logs = compose(["logs", "supermemory"], { silent: true });
  } catch {
    logs = "";
  }
  const apiKey = scrapeApiKey(logs) || values.get("SUPERMEMORY_API_KEY") || "";
  if (!apiKey) fail("server did not print an sm_ API key");

  values.set("SUPERMEMORY_API_KEY", apiKey);
  values.set("SUPERMEMORY_BASE_URL", baseURL);
  writeEnv(envFile, values);
  const tail = apiKey.slice(-4);

  let result;
  try {
    result = await smoke(apiKey);
  } catch (error) {
    fail(`API smoke failed: ${error instanceof Error ? error.message : String(error)}`);
  }

  if (!result.searchable) {
    console.log(
      `READY: server is up and document ${result.id} round-tripped, status ${result.status}. Search did not find it. Check docker compose logs supermemory. Key saved as sm_…${tail}.`,
    );
    return;
  }

  console.log(
    `READY: http://127.0.0.1:6767 stored and searched document ${result.id}. Key saved as sm_…${tail} in .env.local.`,
  );
}

if (command === "down") {
  compose(["down"]);
} else if (command === "up") {
  await up();
} else {
  console.error("usage: node scripts/local-supermemory.mjs [up|down]");
  process.exit(1);
}
