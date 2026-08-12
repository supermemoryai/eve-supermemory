import { defineHook, type HookEvent } from "eve/hooks";
import { toolResultFrom } from "eve/tools";
import { captureCompletedTurn } from "../lib/capture-conversation";
import {
  bufferAssistantMessage,
  bufferUserMessage,
  discardConversationTurn,
  markSupermemoryToolUsed,
} from "../lib/conversation-buffer";
import extract from "../tools/extract";
import forget from "../tools/forget";
import forgetMatching from "../tools/forget_matching";
import readDocument from "../tools/read_document";
import readSession from "../tools/read_session";
import remember from "../tools/remember";
import search from "../tools/search";

function recordUserMessage(event: HookEvent<"message.received">): void {
  bufferUserMessage(event.data.turnId, event.data.message);
}

function recordAssistantMessage(event: HookEvent<"message.completed">): void {
  if (event.data.finishReason === "tool-calls" || !event.data.message) return;

  bufferAssistantMessage(event.data.turnId, event.data.message);
}

function recordStructuredResult(event: HookEvent<"result.completed">): void {
  bufferAssistantMessage(event.data.turnId, JSON.stringify(event.data.result));
}

function recordSupermemoryAction(event: HookEvent<"action.result">): void {
  const { result, turnId } = event.data;

  if (
    toolResultFrom(result, search) ||
    toolResultFrom(result, readSession) ||
    toolResultFrom(result, readDocument) ||
    toolResultFrom(result, remember) ||
    toolResultFrom(result, extract) ||
    toolResultFrom(result, forget) ||
    toolResultFrom(result, forgetMatching)
  ) {
    markSupermemoryToolUsed(turnId);
  }
}

function discardTurn(event: HookEvent<"turn.failed"> | HookEvent<"turn.cancelled">): void {
  discardConversationTurn(event.data.turnId);
}

export default defineHook({
  events: {
    "action.result": recordSupermemoryAction,
    "message.received": recordUserMessage,
    "message.completed": recordAssistantMessage,
    "result.completed": recordStructuredResult,
    "turn.completed": captureCompletedTurn,
    "turn.failed": discardTurn,
    "turn.cancelled": discardTurn,
  },
});
