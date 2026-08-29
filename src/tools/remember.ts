import { defineTool } from "eve/tools";
import { z } from "zod";

import type { SupermemoryDependencies } from "../lib/dependencies.js";
import { rememberContext } from "../lib/remember.js";

export function createRememberTool(dependencies: SupermemoryDependencies) {
  return defineTool({
    description:
      "Decide whether the current conversation contains context worth carrying into future sessions, and save it when appropriate. Use when the user says remember this, save this, keep this for later, don't forget, from now on, always, never, stop doing this, or next time; corrects behavior they expect changed in future interactions; expresses frustration such as why do you keep doing this when the surrounding conversation reveals a reusable correction; or shares or corrects durable personal information, identity, relationships, preferences, boundaries, goals, commitments, decisions, or ongoing project context. Compose one concise standalone memory grounded in what the user said or confirmed. For identity or relationships, preserve the entity, relationship, and stable detail. For a preference, constraint, or correction, preserve the desired behavior, its scope or trigger, and any boundary. For a decision or commitment, preserve the context, settled choice, and relevant condition. For project state, preserve the objective, current state, decisions, constraints or blockers, and concrete next actions. When frustration reveals the instruction, save the reusable behavior change rather than the temporary emotion. When the memory comes from an extracted source, include its exact sourceDocumentId.",
    inputSchema: z.object({
      memory: z
        .string()
        .trim()
        .min(1)
        .max(3_000)
        .refine(
          (memory) => memory.split(/\s+/u).length <= 180,
          "Memory must be 180 words or fewer.",
        )
        .describe(
          "One dense standalone memory. Include the relevant subject and scope: a short identity fact, a scoped preference or correction, a decision with its condition, or project state with constraints and next actions.",
        ),
      sourceDocumentId: z
        .string()
        .trim()
        .max(200)
        .optional()
        .describe(
          "Only when the memory was synthesized from an extracted source: its exact extraction document ID. Omit for ordinary conversation memories.",
        ),
    }),
    execute(input, ctx) {
      return rememberContext(input, ctx, dependencies);
    },
  });
}
