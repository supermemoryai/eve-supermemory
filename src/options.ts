import { z } from "zod";

const metadataValue = z.union([z.string(), z.number(), z.boolean(), z.array(z.string())]);

export type SupermemoryApiKey = string | (() => string | Promise<string>);

const apiKey = z.union([
  z.string().min(1),
  z.custom<() => string | Promise<string>>((value) => typeof value === "function"),
]);

function isTimeZone(value: string): boolean {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: value });
    return true;
  } catch {
    return false;
  }
}

const optionsSchema = z.object({
  apiKey,
  containerTagPrefix: z
    .string()
    .min(1)
    .max(35)
    .regex(/^[a-zA-Z0-9_.-]+$/)
    .default("eve_agent"),
  autoSearch: z
    .object({
      enabled: z.boolean().default(true),
    })
    .default({ enabled: true }),
  profileContext: z
    .object({
      timeZone: z
        .string()
        .max(64)
        .refine(isTimeZone, "Must be a valid IANA time zone.")
        .default("UTC"),
    })
    .default({ timeZone: "UTC" }),
  capture: z
    .object({
      enabled: z.boolean().default(true),
      entityContext: z.string().max(1_500).optional(),
      taskType: z.enum(["memory", "superrag"]).default("memory"),
      dreaming: z.enum(["instant", "dynamic"]).default("dynamic"),
      metadata: z.record(z.string(), metadataValue).default({}),
    })
    .default({
      enabled: true,
      taskType: "memory",
      dreaming: "dynamic",
      metadata: {},
    }),
});

export type SupermemoryMetadataValue = string | number | boolean | readonly string[];

export interface SupermemoryOptions {
  readonly apiKey: SupermemoryApiKey;
  readonly containerTagPrefix?: string;
  readonly autoSearch?: {
    readonly enabled?: boolean;
  };
  readonly profileContext?: {
    readonly timeZone?: string;
  };
  readonly capture?: {
    readonly enabled?: boolean;
    readonly entityContext?: string;
    readonly taskType?: "memory" | "superrag";
    readonly dreaming?: "instant" | "dynamic";
    readonly metadata?: Readonly<Record<string, SupermemoryMetadataValue>>;
  };
}

export interface SupermemoryConfig {
  readonly apiKey: SupermemoryApiKey;
  readonly containerTagPrefix: string;
  readonly autoSearch: {
    readonly enabled: boolean;
  };
  readonly profileContext: {
    readonly timeZone: string;
  };
  readonly capture: {
    readonly enabled: boolean;
    readonly entityContext?: string;
    readonly taskType: "memory" | "superrag";
    readonly dreaming: "instant" | "dynamic";
    readonly metadata: Readonly<Record<string, SupermemoryMetadataValue>>;
  };
}

export function resolveOptions(options: SupermemoryOptions): SupermemoryConfig {
  return optionsSchema.parse(options);
}
