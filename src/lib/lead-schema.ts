import { z } from "zod";

import { leadSources, serviceInterests } from "@/lib/supabase/types";

/**
 * Field limits, shared by the client and server schemas so the two cannot
 * drift into a state where the browser accepts what the route rejects.
 *
 * `phone` is 40 rather than 30: this schema already shipped at 40 and
 * tightening it would start rejecting numbers a visitor can currently type.
 */
export const leadFieldLimits = {
  name: 100,
  email: 200,
  phone: 40,
  company: 120,
  message: 2000,
} as const;

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
      .max(leadFieldLimits.name, { message: messages.tooLong }),
    email: z
      .string()
      .trim()
      .min(1, { message: messages.emailRequired })
      .max(leadFieldLimits.email, { message: messages.tooLong })
      .pipe(z.email({ message: messages.emailInvalid })),
    phone: optionalText(leadFieldLimits.phone),
    company: optionalText(leadFieldLimits.company),
    message: optionalText(leadFieldLimits.message),
  });
}

export type LeadInput = z.infer<ReturnType<typeof createLeadSchema>>;

const optionalServerText = (max: number) =>
  z.string().trim().max(max).optional().or(z.literal(""));

/**
 * The server-side contract for POST /api/lead.
 *
 * The browser check in `createLeadSchema` is a courtesy; this is the
 * enforcement point (hard rule 5). It re-validates the same five fields under
 * the same limits and adds the parts a client must never be trusted to set on
 * its own: the source enum, the service enum, and the attribution fields.
 *
 * Unknown keys are stripped rather than rejected — zod objects are
 * non-strict by default — so a stray field from a browser extension cannot
 * turn a real enquiry into a 400.
 */
export const leadServerSchema = z.object({
  name: z.string().trim().min(1).max(leadFieldLimits.name),
  email: z.string().trim().min(1).max(leadFieldLimits.email).pipe(z.email()),
  phone: optionalServerText(leadFieldLimits.phone),
  company: optionalServerText(leadFieldLimits.company),
  message: optionalServerText(leadFieldLimits.message),

  source: z.enum(leadSources),
  service_interest: z.enum(serviceInterests).optional(),

  // Attribution. The client sends these; they are capped so a crafted request
  // cannot use them to write unbounded text into the row.
  landing_page: optionalServerText(500),
  referrer: optionalServerText(500),
  utm_source: optionalServerText(200),
  utm_medium: optionalServerText(200),
  utm_campaign: optionalServerText(200),
  locale: optionalServerText(10),

  /**
   * Honeypot. NOT the `website` column on the `leads` table — the names are
   * deliberately similar but this value is never persisted anywhere. A real
   * visitor cannot see or tab to the field, so any non-empty value means a
   * bot, and the route discards the submission while returning 200.
   */
  website_url: optionalServerText(200),
});

export type LeadServerInput = z.infer<typeof leadServerSchema>;
