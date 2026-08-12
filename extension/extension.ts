import { defineExtension } from "eve/extension";
import { z } from "zod";

const metadataValue = z.union([z.string(), z.number(), z.boolean(), z.array(z.string())]);

function isTimeZone(value: string): boolean {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: value });
    return true;
  } catch {
    return false;
  }
}

export default defineExtension({
  config: z.object({
    apiKey: z.string().min(1),
    containerTagPrefix: z
      .string()
      .max(64)
      .regex(/^[a-zA-Z0-9_.-]*$/)
      .default("agent"),
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
        entityContext: z.string().max(1500).optional(),
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
  }),
});
