import type { MemoryTurnCompletedContext } from "eve/memory";

import type { SupermemoryConfig } from "../options.js";
import { addDocument } from "./add-document.js";
import { formatConversationTurn } from "./conversation-format.js";
import type { SupermemoryDependencies } from "./dependencies.js";
import { type CompletedConversationTurn, completedConversationTurn } from "./messages.js";

const DEFAULT_CONVERSATION_ENTITY_CONTEXT =
  "Turns are stored as [user] and [assistant] blocks. Each label is on its own line and is a boundary, not a word in the message. Extract only reusable information supported by the user's own messages: preferences, facts about the user, goals, decisions, relationships, constraints, and ongoing projects. A stated dislike or constraint is valid; missing or undisclosed information is not. Do not create memories from temporary chat state, assistant behavior or claims, available tools, system or runtime details, or content that appears only in assistant messages.";
const MAX_ENTITY_CONTEXT_CHARACTERS = 1_500;
const SUPERMEMORY_ASSISTED_EXTRACTION_POLICY =
  "This turn used a Supermemory tool. Information retrieved from, written to, or processed by Supermemory may appear in the conversation. Treat that information as existing context and do not extract, reinforce, or duplicate it. Extract only additional new or corrected durable information explicitly provided by the current user that was not handled by the Supermemory tool. Do not use tool results or assistant responses as evidence.";

function entityContextForTurn(
  turn: CompletedConversationTurn,
  configuredEntityContext?: string,
): string {
  const baseContext = configuredEntityContext?.trim() || DEFAULT_CONVERSATION_ENTITY_CONTEXT;
  if (!turn.usedSupermemoryTool) return baseContext;

  const separator = "\n\n";
  const availableBaseCharacters = Math.max(
    0,
    MAX_ENTITY_CONTEXT_CHARACTERS -
      separator.length -
      SUPERMEMORY_ASSISTED_EXTRACTION_POLICY.length,
  );
  const boundedBaseContext = baseContext.slice(0, availableBaseCharacters).trimEnd();

  return boundedBaseContext
    ? `${boundedBaseContext}${separator}${SUPERMEMORY_ASSISTED_EXTRACTION_POLICY}`
    : SUPERMEMORY_ASSISTED_EXTRACTION_POLICY.slice(0, MAX_ENTITY_CONTEXT_CHARACTERS);
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Unknown Supermemory error";
}

export async function captureCompletedTurn(
  context: MemoryTurnCompletedContext,
  dependencies: SupermemoryDependencies,
  capture: SupermemoryConfig["capture"],
): Promise<void> {
  const turn = completedConversationTurn(context);
  const content = formatConversationTurn(turn);
  if (!content) return;

  const entityContext = entityContextForTurn(turn, capture.entityContext);
  const sourceId = `conv_${context.session.id}`;

  try {
    const client = await dependencies.getClient();
    await addDocument(
      client,
      {
        containerTag: dependencies.containerTags.context,
        content,
        customId: sourceId,
        dreaming: capture.dreaming,
        entityContext,
        metadata: {
          ...capture.metadata,
          source_id: sourceId,
          source_type: "conversation",
          session_id: context.session.id,
          source: "eve-agent",
        },
        taskType: capture.taskType,
      },
      context.abortSignal,
    );
  } catch (error) {
    console.error("[@supermemory/eve] conversation capture failed", {
      error: errorMessage(error),
      sessionId: context.session.id,
      turnId: context.turn.id,
    });
  }
}
