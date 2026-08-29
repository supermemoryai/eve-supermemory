import type Supermemory from "supermemory";
import { z } from "zod";

const addDocumentResponseSchema = z.object({
  id: z.string(),
  status: z.string(),
});

export interface AddDocumentInput {
  readonly containerTag: string;
  readonly content: string;
  readonly customId: string;
  readonly dreaming: "dynamic" | "instant";
  readonly entityContext?: string;
  readonly metadata: Readonly<Record<string, string | number | boolean | readonly string[]>>;
  readonly taskType: "memory" | "superrag";
}

export async function addDocument(
  client: Supermemory,
  input: AddDocumentInput,
  signal: AbortSignal,
) {
  return addDocumentResponseSchema.parse(
    await client.post<unknown>("/v3/documents", {
      body: input,
      signal,
    }),
  );
}
