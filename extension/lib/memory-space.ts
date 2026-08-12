import type { SessionAuth, SessionContext } from "eve/context";

import extension from "../extension";

const CONTAINER_TAG_PATTERN = /^[a-zA-Z0-9_.-]{1,100}$/;

interface SessionIdentityContext {
  readonly session: {
    readonly auth: SessionAuth;
  };
}

export function getSessionPrincipal(ctx: SessionIdentityContext) {
  return ctx.session.auth.initiator ?? ctx.session.auth.current;
}

function resolvePrefixedContainerTag(prefix: string, principalId: string): string | null {
  const containerTag = prefix ? `${prefix}_${principalId}` : principalId;
  return CONTAINER_TAG_PATTERN.test(containerTag) ? containerTag : null;
}

export function resolveContainerTag(principalId: string): string | null {
  return resolvePrefixedContainerTag(extension.config.containerTagPrefix, principalId);
}

export function resolveExtractionContainerTag(principalId: string): string | null {
  const { containerTagPrefix } = extension.config;
  const prefix = containerTagPrefix ? `${containerTagPrefix}_extraction` : "extraction";

  return resolvePrefixedContainerTag(prefix, principalId);
}

function requirePrincipalId(ctx: SessionContext): string {
  const principal = getSessionPrincipal(ctx);
  if (!principal) {
    throw new Error("Supermemory requires a verified Eve session identity.");
  }

  return principal.principalId;
}

export function requireContainerTag(ctx: SessionContext): string {
  const containerTag = resolveContainerTag(requirePrincipalId(ctx));
  if (!containerTag) {
    throw new Error("The configured Supermemory container tag is invalid.");
  }

  return containerTag;
}

export function requireExtractionContainerTag(ctx: SessionContext): string {
  const containerTag = resolveExtractionContainerTag(requirePrincipalId(ctx));
  if (!containerTag) {
    throw new Error("The configured Supermemory extraction container tag is invalid.");
  }

  return containerTag;
}
