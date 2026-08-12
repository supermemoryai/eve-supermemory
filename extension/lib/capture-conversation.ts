import type { HookContext, HookEvent } from "eve/hooks";

import extension from "../extension";
import { supermemoryClient } from "./client";
import { type BufferedConversationTurn, consumeConversationTurn } from "./conversation-buffer";
import { getSessionPrincipal, resolveContainerTag } from "./memory-space";

const DEFAULT_CONVERSATION_ENTITY_CONTEXT =
  "Extract only reusable information supported by the user's own messages: preferences, facts about the user, goals, decisions, relationships, constraints, and ongoing projects. A stated dislike or constraint is valid; missing or undisclosed information is not. Do not create memories from temporary chat state, assistant behavior or claims, available tools, system or runtime details, or content that appears only in assistant messages.";
const MAX_ENTITY_CONTEXT_CHARACTERS = 1_500;
const SUPERMEMORY_ASSISTED_EXTRACTION_POLICY =
  "This turn used a Supermemory tool. Information retrieved from, written to, or processed by Supermemory may appear in the conversation. Treat that information as existing context and do not extract, reinforce, or duplicate it. Extract only additional new or corrected durable information explicitly provided by the current user that was not handled by the Supermemory tool. Do not use tool results or assistant responses as evidence.";

function entityContextForTurn(
  turn: BufferedConversationTurn,
  configuredEntityContext?: string,
): string {
  const baseContext = configuredEntityContext?.trim() || DEFAULT_CONVERSATION_ENTITY_CONTEXT;
  if (!turn.usedSupermemoryTool) return baseContext;

  const separator = "\n\n";
  const policyContext = SUPERMEMORY_ASSISTED_EXTRACTION_POLICY;
  const availableBaseCharacters = Math.max(
    0,
    MAX_ENTITY_CONTEXT_CHARACTERS - separator.length - policyContext.length,
  );
  const boundedBaseContext = baseContext.slice(0, availableBaseCharacters).trimEnd();

  return boundedBaseContext
    ? `${boundedBaseContext}${separator}${policyContext}`
    : policyContext.slice(0, MAX_ENTITY_CONTEXT_CHARACTERS);
}

function formatConversationTurn(turn: BufferedConversationTurn): string | null {
  const messages: string[] = [];

  if (turn.userMessage?.trim()) {
    messages.push(`user: ${turn.userMessage.trim()}`);
  }

  if (turn.assistantMessage?.trim()) {
    messages.push(`assistant: ${turn.assistantMessage.trim()}`);
  }

  return messages.length > 0 ? messages.join("\n") : null;
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Unknown Supermemory error";
}

export async function captureCompletedTurn(
  event: HookEvent<"turn.completed">,
  ctx: HookContext,
): Promise<void> {
  const turn = consumeConversationTurn(event.data.turnId);
  if (!turn) return;

  const { capture } = extension.config;
  if (!capture.enabled) return;

  const content = formatConversationTurn(turn);
  if (!content) return;

  const principal = getSessionPrincipal(ctx);
  if (!principal) {
    console.warn("[@supermemory/eve] skipped conversation capture", {
      reason: "missing_verified_session_identity",
      sessionId: ctx.session.id,
      turnId: event.data.turnId,
    });
    return;
  }

  const resolvedContainerTag = resolveContainerTag(principal.principalId);

  if (!resolvedContainerTag) {
    console.warn("[@supermemory/eve] skipped conversation capture", {
      reason: "invalid_container_tag",
      sessionId: ctx.session.id,
      turnId: event.data.turnId,
    });
    return;
  }

  const entityContext = entityContextForTurn(turn, capture.entityContext);

  const sourceId = `conv_${ctx.session.id}`;
  const document = {
    containerTag: resolvedContainerTag,
    content,
    customId: sourceId,
    dreaming: capture.dreaming,
    ...(entityContext ? { entityContext } : {}),
    metadata: {
      ...capture.metadata,
      source_id: sourceId,
      source_type: "conversation",
      session_id: ctx.session.id,
      ...(ctx.channel.kind ? { channel: ctx.channel.kind } : {}),
      source: "eve-agent",
    },
    taskType: capture.taskType,
  };

  try {
    await supermemoryClient().add(document);
  } catch (error) {
    console.error("[@supermemory/eve] conversation capture failed", {
      error: errorMessage(error),
      sessionId: ctx.session.id,
      turnId: event.data.turnId,
    });
  }
}
