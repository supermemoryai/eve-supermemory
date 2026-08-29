import type { SupermemoryDependencies } from "../lib/dependencies.js";
import { createExtractTool } from "./extract.js";
import { createForgetTool } from "./forget.js";
import { createForgetMatchingTool } from "./forget-matching.js";
import { createReadDocumentTool } from "./read-document.js";
import { createReadSessionTool } from "./read-session.js";
import { createRememberTool } from "./remember.js";
import { createSearchTool } from "./search.js";

export function createSupermemoryTools(dependencies: SupermemoryDependencies) {
  return {
    search: createSearchTool(dependencies),
    read_session: createReadSessionTool(dependencies),
    read_document: createReadDocumentTool(dependencies),
    remember: createRememberTool(dependencies),
    extract: createExtractTool(dependencies),
    forget: createForgetTool(dependencies),
    forget_matching: createForgetMatchingTool(dependencies),
  };
}
