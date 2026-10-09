import { z } from "zod";

/**
 * Audit pages: the page behind a letter that offers a paid audit.
 *
 * A hero and eight numbered sections with one job, getting the reader to
 * book, call, text or write: the reference sheets, what changed this year, a
 * preview of the screen the audit could lead to, where the money usually is,
 * what similar agencies are doing, the audit and its price, the questions an
 * owner asks, and the ways to reply.
 *
 * Configs live in `content/letter-audits/` and render at `/m3/<token>`,
 * beside the proposal pages in `content/letter-pages/`. Every word on the
 * page is in the config; nothing in the components names a provider.
 */

const text = z.string().min(1);
const https = z.url().startsWith("https://");

const sectionHead = { title: text, eyebrow: text };

const sourced = z.strictObject({ line: text, source: text, href: https });

export const auditPageSchema = z
  .strictObject({
    kind: z.literal("audit"),
    /** The short address the letter prints: nahltech.com/<slug>. */
    slug: z.string().regex(/^[a-z0-9]{2,40}$/),
    /** Fixed once listed in the ledger. Never replaced. */
    token: z.string().regex(/^[a-z0-9-]{8,80}$/),
    company: z.strictObject({ name: text }),
    tabTitle: text,
    eyebrow: text,
    firm: text,
    hero: z.strictObject({
      title: text,
      lead: text,
      sheetsButton: text,
      quiet: text,
    }),
    /** The one primary action. It appears three times and nowhere else. */
    book: text,
    /** The quiet line that sits beside the primary action. */
    safety: text,
    bar: z.strictObject({ book: text, text, sheets: text }),
    sheets: z.strictObject({
      ...sectionHead,
      lead: text,
      /** `sheet` is an id in `content/sheets.json`. */
      cards: z
        .array(z.strictObject({ sheet: text, title: text, line: text }))
        .min(1),
      download: text,
      meta: text,
      always: text,
      /** The permanent address, as it appears inside `always`. */
      address: text,
    }),
    changed: z.strictObject({
      ...sectionHead,
      lead: text,
      cards: z
        .array(
          z.strictObject({
            figure: text,
            line: text,
            source: text,
            href: https,
          }),
        )
        .length(3),
      body: text,
    }),
    preview: z.strictObject({
      ...sectionHead,
      lead: text,
      /** The accessible name of the embedded prototype. */
      frameTitle: text,
      open: text,
      captions: z.array(text).length(4),
    }),
    money: z.strictObject({
      ...sectionHead,
      lead: text,
      show: text,
      rows: z
        .array(z.strictObject({ title: text, line: text, arithmetic: text }))
        .min(1),
      after: text,
    }),
    proof: z.strictObject({
      ...sectionHead,
      cards: z.array(sourced).length(3),
      after: text,
    }),
    audit: z.strictObject({
      ...sectionHead,
      steps: z.array(z.strictObject({ label: text, text })).min(1),
      boxes: z.array(z.strictObject({ title: text, text })).length(3),
      stepZero: z.strictObject({ title: text, text }),
      price: z.strictObject({
        amount: z.string().regex(/^\$\d{1,3}(,\d{3})*$/),
        term: text,
        lines: z.array(text).min(1),
      }),
    }),
    questions: z.strictObject({
      ...sectionHead,
      items: z.array(z.strictObject({ q: text, a: text })).min(1),
    }),
    reply: z.strictObject({
      ...sectionHead,
      heading: text,
      line: text,
      closing: text,
    }),
    sources: text,
    /** The provider's own permanent sheets address, `/<slug>/sheets`. */
    sheetsPage: z.strictObject({ heading: text, line: text }),
  })
  .superRefine((page, ctx) => {
    if (!page.sheets.always.includes(page.sheets.address)) {
      ctx.addIssue({
        code: "custom",
        path: ["sheets", "address"],
        message: "must appear in the line that prints it",
      });
    }
    if (page.sheets.address !== `nahltech.com/${page.slug}/sheets`) {
      ctx.addIssue({
        code: "custom",
        path: ["sheets", "address"],
        message: "must be this page's own sheets address",
      });
    }
  });

export type AuditPageConfig = z.infer<typeof auditPageSchema>;

/** The eight numbered sections, in page order. Their ids are the anchors. */
export const auditSectionKeys = [
  "sheets",
  "changed",
  "preview",
  "money",
  "proof",
  "audit",
  "questions",
  "reply",
] as const;
export type AuditSectionKey = (typeof auditSectionKeys)[number];
