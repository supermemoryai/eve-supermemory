const CONTAINER_TAG_PATTERN = /^[a-zA-Z0-9_.-]{1,100}$/;

export interface ContainerTags {
  readonly context: string;
  readonly extraction: string;
}

function requireContainerTag(prefix: string, scopeKey: string): string {
  const containerTag = `${prefix}_${scopeKey}`;
  if (!CONTAINER_TAG_PATTERN.test(containerTag)) {
    throw new Error("The configured Supermemory container tag is invalid.");
  }

  return containerTag;
}

export function resolveContainerTags(scopeKey: string, prefix: string): ContainerTags {
  return {
    context: requireContainerTag(prefix, scopeKey),
    extraction: requireContainerTag(`${prefix}_extraction`, scopeKey),
  };
}
