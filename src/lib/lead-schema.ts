import { z } from "zod";

export type LeadFieldErrors = {
  nameRequired: string;
  emailRequired: string;
  emailInvalid: string;
  tooLong: string;
};

/**
 * Validation contract for the lead form.
 *
 * Built from injected messages so the copy still comes from the dictionary
 * rather than being hardcoded in a lib file. Phase 4 re-parses the same shape
 * server-side in /api/lead — the client check is a courtesy, never the
 * enforcement point (hard rule 5).
 *
 * Only name and email are required. Every optional field accepts the empty
 * string, because a browser always submits an untouched input as "" and a
 * half-filled form must never be rejected outright — losing a lead is worse
 * than storing a sparse one (hard rule 6).
 */
export function createLeadSchema(messages: LeadFieldErrors) {
  const optionalText = (max: number) =>
    z
      .string()
      .trim()
      .max(max, { message: messages.tooLong })
      .optional()
      .or(z.literal(""));

  return z.object({
    name: z
      .string()
      .trim()
      .min(1, { message: messages.nameRequired })
      .max(100, { message: messages.tooLong }),
    email: z
      .string()
      .trim()
      .min(1, { message: messages.emailRequired })
      .pipe(z.email({ message: messages.emailInvalid })),
    phone: optionalText(40),
    company: optionalText(120),
    message: optionalText(2000),
  });
}

export type LeadInput = z.infer<ReturnType<typeof createLeadSchema>>;
