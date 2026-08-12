import { defineDynamic, defineInstructions } from "eve/instructions";

import extension from "../extension";
import { supermemoryClient } from "../lib/client";
import { getSessionPrincipal, resolveContainerTag } from "../lib/memory-space";
import { loadProfileContext } from "../lib/profile-context";

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Unknown Supermemory error";
}

export default defineDynamic({
  events: {
    "session.started": async (_event, ctx) => {
      const principal = getSessionPrincipal(ctx);
      if (!principal) return null;

      const containerTag = resolveContainerTag(principal.principalId);
      if (!containerTag) return null;

      try {
        const markdown = await loadProfileContext({
          client: supermemoryClient(),
          containerTag,
          timeZone: extension.config.profileContext.timeZone,
        });

        return defineInstructions({ markdown });
      } catch (error) {
        console.error("[@supermemory/eve] profile context failed", {
          error: errorMessage(error),
          sessionId: ctx.session.id,
        });

        return null;
      }
    },
  },
});
