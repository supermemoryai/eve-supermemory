import { z } from "zod";

import { resolveContainerTags } from "../src/lib/container-tags.js";
import { formatConversationTurn } from "../src/lib/conversation-format.js";
import { memoryScopeKey } from "./scope-key.js";

const API_BASE_URL = (
  process.env.SUPERMEMORY_BASE_URL?.trim() || "https://api.supermemory.ai"
).replace(/\/$/, "");
const POLL_INTERVAL_MILLISECONDS = 1_000;
const POLL_TIMEOUT_MILLISECONDS = 90_000;

const memorySchema = z.object({
  id: z.string(),
  memory: z.string(),
  isStatic: z.boolean().optional(),
  isForgotten: z.boolean().optional(),
});

const createMemoriesResponseSchema = z.object({
  documentId: z.string().nullable(),
  memories: z.array(memorySchema),
});

const memoryListResponseSchema = z.object({
  memoryEntries: z.array(
    memorySchema.extend({
      createdAt: z.string(),
      isLatest: z.boolean(),
    }),
  ),
});

const documentAddResponseSchema = z.object({
  id: z.string(),
  status: z.string(),
});

export const documentSchema = z.object({
  id: z.string(),
  content: z.string().nullable(),
  customId: z.string().nullable(),
  metadata: z.unknown(),
  status: z.enum([
    "unknown",
    "queued",
    "extracting",
    "chunking",
    "embedding",
    "indexing",
    "done",
    "failed",
  ]),
  summary: z.string().nullable(),
});

const profileResponseSchema = z.object({
  profile: z.object({
    dynamic: z.array(z.string()),
    static: z.array(z.string()),
  }),
});

function requiredEnvironment(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} is required for Supermemory E2E tests.`);
  return value;
}

export const runId = requiredEnvironment("SUPERMEMORY_E2E_RUN_ID");
export const containerPrefix = requiredEnvironment("SUPERMEMORY_E2E_PREFIX");
const namespace = requiredEnvironment("SUPERMEMORY_E2E_NAMESPACE");
const scope = process.env.SUPERMEMORY_E2E_SCOPE?.trim() || "e2e";

const tags = (async () => {
  const scopeKey = await memoryScopeKey(namespace, scope);
  return resolveContainerTags(scopeKey, containerPrefix);
})();

function apiKey(): string {
  return requiredEnvironment("SUPERMEMORY_API_KEY");
}

function headers(): Record<string, string> {
  return {
    Authorization: `Bearer ${apiKey()}`,
    "Content-Type": "application/json",
  };
}

async function jsonRequest(path: string, init: RequestInit): Promise<unknown> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: { ...headers(), ...init.headers },
  });
  const text = await response.text();

  if (!response.ok) {
    throw new Error(`${init.method ?? "GET"} ${path} failed (${response.status}): ${text}`);
  }

  return text ? JSON.parse(text) : null;
}

export function marker(name: string): string {
  return `${name}_${runId}`.replace(/[^a-zA-Z0-9_.-]/g, "_");
}

export function conversationTranscript(
  turns: readonly { assistant: string; user: string }[],
): string {
  return turns
    .map((turn) => {
      const content = formatConversationTurn({
        assistantMessage: turn.assistant,
        usedSupermemoryTool: false,
        userMessage: turn.user,
      });
      if (!content) throw new Error("A seeded conversation turn was empty.");
      return content;
    })
    .join("");
}

export async function createMemories(
  memories: Array<{
    content: string;
    isStatic?: boolean;
    metadata?: Record<string, string | number | boolean>;
  }>,
) {
  const { context } = await tags;
  const response = await jsonRequest("/v4/memories", {
    method: "POST",
    body: JSON.stringify({ containerTag: context, memories }),
  });

  return createMemoriesResponseSchema.parse(response);
}

export async function listMemories() {
  const { context } = await tags;
  const response = await jsonRequest("/v4/memories/list", {
    method: "POST",
    body: JSON.stringify({
      containerTags: [context],
      page: 1,
      limit: 100,
      sort: "createdAt",
      order: "desc",
    }),
  });

  return memoryListResponseSchema.parse(response).memoryEntries;
}

export async function createConversationDocument(input: {
  content: string;
  customId: string;
  sessionId: string;
  taskType?: "memory" | "superrag";
}) {
  const { context } = await tags;
  const response = await jsonRequest("/v3/documents", {
    method: "POST",
    body: JSON.stringify({
      containerTag: context,
      content: input.content,
      customId: input.customId,
      entityContext:
        "Conversation between a user and an agent. Extract durable facts, preferences, decisions, projects, and ongoing context explicitly stated by the user. Do not infer user information from assistant responses.",
      metadata: {
        source_id: input.customId,
        source_type: "conversation",
        session_id: input.sessionId,
        source: "eve-agent",
        e2e_run: runId,
      },
      taskType: input.taskType ?? "memory",
    }),
  });

  return documentAddResponseSchema.parse(response);
}

export async function getDocument(idOrCustomId: string) {
  const response = await fetch(`${API_BASE_URL}/v3/documents/${encodeURIComponent(idOrCustomId)}`, {
    headers: headers(),
  });

  if (response.status === 404) return null;
  const text = await response.text();
  if (!response.ok) {
    throw new Error(`GET /v3/documents/${idOrCustomId} failed (${response.status}): ${text}`);
  }

  return documentSchema.parse(JSON.parse(text));
}

export async function waitForDocument(idOrCustomId: string) {
  return waitFor(
    () => getDocument(idOrCustomId),
    (document) => document?.status === "done",
    `document ${idOrCustomId} to finish`,
  );
}

export async function waitForDocumentContent(idOrCustomId: string, token: string) {
  return waitFor(
    () => getDocument(idOrCustomId),
    (document) => document?.content?.includes(token) === true,
    `document ${idOrCustomId} to contain ${token}`,
  );
}

export async function loadProfile() {
  const { context } = await tags;
  const response = await jsonRequest("/v4/profile", {
    method: "POST",
    body: JSON.stringify({ containerTag: context }),
  });

  return profileResponseSchema.parse(response).profile;
}

export async function waitForProfileFact(fact: string) {
  return waitFor(
    loadProfile,
    (profile) => [...profile.static, ...profile.dynamic].some((entry) => entry.includes(fact)),
    `profile to contain ${fact}`,
  );
}

export async function waitForMemoryFact(fact: string) {
  return waitFor(
    listMemories,
    (memories) => memories.some((entry) => !entry.isForgotten && entry.memory.includes(fact)),
    `memory list to contain ${fact}`,
  );
}

export async function waitForForgottenMemory(memoryId: string) {
  return waitFor(
    listMemories,
    (memories) => {
      const memory = memories.find((entry) => entry.id === memoryId);
      return memory === undefined || memory.isForgotten === true;
    },
    `memory ${memoryId} to be forgotten`,
  );
}

async function waitFor<T>(
  read: () => Promise<T>,
  ready: (value: T) => boolean,
  label: string,
): Promise<T> {
  const deadline = Date.now() + POLL_TIMEOUT_MILLISECONDS;
  let latest = await read();

  while (!ready(latest)) {
    if (Date.now() >= deadline) throw new Error(`Timed out waiting for ${label}.`);
    await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MILLISECONDS));
    latest = await read();
  }

  return latest;
}
