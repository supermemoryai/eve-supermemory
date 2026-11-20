import type Supermemory from "supermemory";

export interface AddDocumentInput {
  readonly namespace: string;
  readonly content: string;
  readonly id: string;
  readonly dreaming: "dynamic" | "instant";
  readonly supportingContext?: string;
  readonly metadata: Readonly<Record<string, string | number | boolean | readonly string[]>>;
  readonly taskType: "memory" | "superrag";
}

export async function addDocument(
  client: Supermemory,
  { namespace, metadata, ...input }: AddDocumentInput,
  abortSignal: AbortSignal,
) {
  return client.add(
    namespace,
    {
      ...input,
      metadata: Object.fromEntries(
        Object.entries(metadata).map(([key, value]) => [
          key,
          typeof value === "object" ? [...value] : value,
        ]),
      ),
    },
    { abortSignal },
  );
}
