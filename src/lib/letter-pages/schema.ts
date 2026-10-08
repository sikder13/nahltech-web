import { z } from "zod";

/**
 * Letter pages: the second half of a one-page mailed letter.
 *
 * Four headed blocks, a contact block and a sources line. No model, no
 * sliders, no charts; a reader should be through it in a minute. Configs
 * live in `content/letter-pages/` and render at `/m3/<token>`.
 */

const text = z.string().min(1);

/**
 * A phrase inside a block's body that links to its source. The phrase must
 * appear in the body exactly once, so the link can never change the words:
 * the body is the approved copy, and a link only marks a span of it.
 */
const sourceLinkSchema = z.strictObject({
  text,
  href: z.url().startsWith("https://"),
});

const blockSchema = z
  .strictObject({
    heading: text,
    body: text,
    links: z.array(sourceLinkSchema).default([]),
  })
  .superRefine((block, ctx) => {
    for (const [index, link] of block.links.entries()) {
      const count = block.body.split(link.text).length - 1;
      if (count !== 1) {
        ctx.addIssue({
          code: "custom",
          path: ["links", index, "text"],
          message: `must appear in the body exactly once, found ${count} times`,
        });
      }
    }
  });

export const letterPageSchema = z.strictObject({
  /** The short address the letter prints: nahltech.com/<slug>. */
  slug: z.string().regex(/^[a-z0-9]{2,40}$/),
  /** Fixed once printed in the ledger. Never regenerated. */
  token: z.string().regex(/^[a-z0-9-]{8,80}$/),
  company: z.strictObject({ name: text }),
  tabTitle: text,
  title: text,
  subtitle: text,
  blocks: z.array(blockSchema).length(4),
  sources: text,
});

export type LetterPageConfig = z.infer<typeof letterPageSchema>;
export type LetterBlock = LetterPageConfig["blocks"][number];

export const letterSharedSchema = z.strictObject({
  topLine: text,
  contact: z.strictObject({
    heading: text,
    line: text,
    book: text,
    call: z.strictObject({ label: text, href: z.string().startsWith("tel:") }),
    text: z.strictObject({
      label: text,
      number: z.string().regex(/^\+\d{11}$/),
      body: text,
    }),
    email: z.strictObject({ address: z.email(), subject: text }),
    form: z.strictObject({
      placeholder: text,
      send: text,
      success: text,
      failure: text,
    }),
  }),
  closing: text,
});

export type LetterSharedCopy = z.infer<typeof letterSharedSchema>;
