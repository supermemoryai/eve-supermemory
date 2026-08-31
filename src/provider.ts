import {
  defineMemoryProvider,
  type MemoryCompactionCompletedContext,
  type MemoryProvider,
  type MemoryRecallMessage,
  type MemoryTurnStartedContext,
} from "eve/memory";

import { EMPTY_AUTO_SEARCH_CONTEXT, loadAutoSearchContext } from "./lib/auto-search.js";
import { captureCompletedTurn } from "./lib/capture-conversation.js";
import { createSupermemoryClientFactory } from "./lib/client.js";
import { resolveContainerTags } from "./lib/container-tags.js";
import type { SupermemoryDependencies } from "./lib/dependencies.js";
import { loadProfileContext } from "./lib/profile-context.js";
import { resolveOptions, type SupermemoryOptions } from "./options.js";
import { createSupermemoryTools } from "./tools/index.js";

const PROFILE_CONTEXT_ID = "supermemory-profile-context";
const AUTO_SEARCH_CONTEXT_ID = "supermemory-auto-search";

type RecallContext = MemoryTurnStartedContext | MemoryCompactionCompletedContext;

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Unknown Supermemory error";
}

export function supermemory(options: SupermemoryOptions): MemoryProvider {
  const config = resolveOptions(options);
  const getClient = createSupermemoryClientFactory(config.apiKey);
  const dependencies = (scopeKey: string): SupermemoryDependencies => ({
    getClient,
    containerTags: resolveContainerTags(scopeKey, config.containerTagPrefix),
  });
  const recall = async (context: RecallContext) => {
    const messages: MemoryRecallMessage[] = [];

    try {
      const memory = dependencies(context.memory.scope.key);
      const content = await loadProfileContext({
        abortSignal: context.abortSignal,
        client: await memory.getClient(),
        containerTag: memory.containerTags.context,
        timeZone: config.profileContext.timeZone,
      });

      messages.push({ content, id: PROFILE_CONTEXT_ID });
    } catch (error) {
      console.error("[@supermemory/eve] profile context failed", {
        error: errorMessage(error),
        sessionId: context.session.id,
      });
    }

    if (config.autoSearch.enabled && context.turn) {
      try {
        const content = await loadAutoSearchContext({
          abortSignal: context.abortSignal,
          dependencies: dependencies(context.memory.scope.key),
          turn: context.turn,
        });

        messages.push({ content, id: AUTO_SEARCH_CONTEXT_ID });
      } catch (error) {
        console.error("[@supermemory/eve] auto search failed", {
          error: errorMessage(error),
          sessionId: context.session.id,
        });
        messages.push({ content: EMPTY_AUTO_SEARCH_CONTEXT, id: AUTO_SEARCH_CONTEXT_ID });
      }
    }

    return messages.length > 0 ? { messages } : null;
  };

  return defineMemoryProvider({
    recall: {
      "turn.started": recall,
      "compaction.completed": recall,
    },
    ...(config.capture.enabled
      ? {
          capture: {
            "turn.completed": (context) =>
              captureCompletedTurn(context, dependencies(context.memory.scope.key), config.capture),
          },
        }
      : {}),
    async tools(context) {
      return createSupermemoryTools(dependencies(context.memory.scope.key));
    },
  });
}
