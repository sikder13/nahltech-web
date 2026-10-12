import { z } from "zod";

/**
 * What a demo page may report, and nothing else.
 *
 * The pages under /demo are built and deployed elsewhere, so this app has no
 * list of their tokens to check against the way /api/visit does. The shape is
 * the whole check: a token is lowercase letters, digits and hyphens, and a
 * kind is one of three words. Anything else is dropped.
 */
export const DEMO_VISIT_KINDS = ["view", "tab_findings", "cta_click"] as const;

export type DemoVisitKind = (typeof DEMO_VISIT_KINDS)[number];

export const demoVisitSchema = z.object({
  token: z.string().regex(/^[a-z0-9-]{3,80}$/),
  kind: z.enum(DEMO_VISIT_KINDS),
});

export type DemoVisit = z.infer<typeof demoVisitSchema>;

/** Each token may report this many times an hour, whoever is sending. */
export const DEMO_VISITS_PER_TOKEN_PER_HOUR = 30;
