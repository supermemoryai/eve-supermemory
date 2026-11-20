const NAMESPACE_PATTERN = /^[a-zA-Z0-9_.-]{1,100}$/;

export interface Namespaces {
  readonly context: string;
  readonly extraction: string;
}

function requireNamespace(prefix: string, scopeKey: string): string {
  const namespace = `${prefix}_${scopeKey}`;
  if (!NAMESPACE_PATTERN.test(namespace)) {
    throw new Error("The configured Supermemory namespace is invalid.");
  }

  return namespace;
}

export function resolveNamespaces(scopeKey: string, prefix: string): Namespaces {
  return {
    context: requireNamespace(prefix, scopeKey),
    extraction: requireNamespace(`${prefix}_extraction`, scopeKey),
  };
}
