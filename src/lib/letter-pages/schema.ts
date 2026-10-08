import { z } from "zod";

// Relative, not aliased: `next.config.ts` loads this through the registry in
// plain Node, where the `@/` alias does not resolve.
import { parse, variablesOf } from "../dashboards/expression";
import { evidenceLabels, sliderFormats } from "../dashboards/v2/model";

/**
 * Letter pages: a proposal an owner reads in two or three minutes and
 * answers in ten seconds.
 *
 * Ten numbered sections on the template 2 design system. Configs live in
 * `content/letter-pages/` and render at `/m3/<token>`. Server and build
 * only: the client components import `model.ts`, never this file, so zod
 * stays out of the browser bundle.
 */

const text = z.string().min(1);
const identifier = z.string().regex(/^[a-z][a-zA-Z0-9]*$/);

/**
 * A phrase inside a body that links to its source. The phrase must appear in
 * the body exactly once, so the link can never change the words: the body is
 * the approved copy, and a link only marks a span of it.
 */
const sourceLinkSchema = z.strictObject({
  text,
  href: z.url().startsWith("https://"),
});

/** A handoff drawn as boxes in order, with at most one marked as failing. */
const diagramSchema = z
  .strictObject({
    title: text,
    steps: z
      .array(z.strictObject({ label: text, fail: z.boolean().optional() }))
      .min(3)
      .max(6),
  })
  .refine((d) => d.steps.filter((s) => s.fail).length <= 1, {
    message: "a diagram marks at most one failure point",
  });

const ruleSchema = z
  .strictObject({
    body: text,
    links: z.array(sourceLinkSchema).min(1),
    /**
     * The public figures in the body, lifted out as cards. Every word on a
     * card is already in the body: the figure, the clause it sits in, and
     * the name of the linked source.
     */
    figures: z
      .array(z.strictObject({ figure: text, line: text, source: text }))
      .min(1),
  })
  .superRefine((rule, ctx) => {
    for (const [index, link] of rule.links.entries()) {
      const count = rule.body.split(link.text).length - 1;
      if (count !== 1) {
        ctx.addIssue({
          code: "custom",
          path: ["links", index, "text"],
          message: `must appear in the body exactly once, found ${count} times`,
        });
      }
    }
    for (const [index, card] of rule.figures.entries()) {
      if (!rule.body.includes(card.line)) {
        ctx.addIssue({
          code: "custom",
          path: ["figures", index, "line"],
          message: "must be a clause of the body, word for word",
        });
      }
      if (!card.line.includes(card.figure)) {
        ctx.addIssue({
          code: "custom",
          path: ["figures", index, "figure"],
          message: "must appear in its own line",
        });
      }
      if (!rule.links.some((link) => link.text === card.source)) {
        ctx.addIssue({
          code: "custom",
          path: ["figures", index, "source"],
          message: "must name one of the body's linked sources",
        });
      }
    }
  });

const inputSchema = z
  .strictObject({
    id: identifier,
    label: text,
    /** The band as the proposal states it, shown beside the evidence tag. */
    stated: text,
    tag: z.enum(evidenceLabels),
    reason: text.optional(),
    format: z.enum(sliderFormats),
    min: z.number(),
    max: z.number(),
    step: z.number().positive(),
    /** Where the band opens. Equal ends are a single stated figure. */
    low: z.number(),
    high: z.number(),
  })
  .refine((s) => s.max > s.min, "slider max must exceed min")
  .refine(
    (s) => s.min <= s.low && s.low <= s.high && s.high <= s.max,
    "the opening band must sit inside the track",
  );

const formula = text.refine((value) => {
  try {
    parse(value);
    return true;
  } catch {
    return false;
  }
}, "is not a valid formula");

const exampleSchema = z
  .strictObject({
    title: text,
    inputs: z.array(inputSchema).min(2).max(6),
    constants: z.array(z.strictObject({ id: identifier, value: z.number() })),
    /** A stated range that is part of an input's line but has no slider. */
    spans: z.array(
      z.strictObject({ id: identifier, low: z.number(), high: z.number() }),
    ),
    /** Dollars, per the unit the result line names. */
    formula,
    /** Counted figures the result line also states, such as open shifts. */
    outputs: z.array(z.strictObject({ id: identifier, formula })),
    /**
     * The result sentence. `{usd}` is the display range, `{exact}` the
     * unrounded pair, and `{<output id>}` a counted figure.
     */
    result: text,
    /** A public fact that frames the result. Carries the BENCHMARK tag. */
    context: text,
  })
  .superRefine((example, ctx) => {
    const known = new Set([
      ...example.inputs.map((i) => i.id),
      ...example.constants.map((c) => c.id),
      ...example.spans.map((s) => s.id),
    ]);
    const formulas = [
      ["formula", example.formula] as const,
      ...example.outputs.map(
        (o, i) => [`outputs.${i}.formula`, o.formula] as const,
      ),
    ];
    for (const [where, source] of formulas) {
      let tree;
      try {
        tree = parse(source);
      } catch {
        continue;
      }
      for (const name of variablesOf(tree)) {
        if (!known.has(name)) {
          ctx.addIssue({
            code: "custom",
            path: where.split("."),
            message: `uses "${name}", which is not an input, constant or span`,
          });
        }
      }
    }
    const allowed = new Set([
      "usd",
      "exact",
      ...example.outputs.map((o) => o.id),
    ]);
    const used = [...example.result.matchAll(/\{([a-zA-Z]+)\}/g)].map(
      (m) => m[1],
    );
    for (const token of used) {
      if (!allowed.has(token)) {
        ctx.addIssue({
          code: "custom",
          path: ["result"],
          message: `names {${token}}, which the model does not compute`,
        });
      }
    }
    for (const required of allowed) {
      if (!used.includes(required)) {
        ctx.addIssue({
          code: "custom",
          path: ["result"],
          message: `never states {${required}}`,
        });
      }
    }
  });

const threadSchema = z.strictObject({
  kind: z.literal("thread"),
  bubbles: z
    .array(z.strictObject({ tone: z.enum(["grey", "dark"]), meta: text, text }))
    .min(2),
  caption: text,
});

const boardSchema = z
  .strictObject({
    kind: z.literal("board"),
    columns: z.array(text).min(2).max(4),
    /** `column` is an index into `columns`. */
    cards: z.array(
      z.strictObject({ column: z.number().int().nonnegative(), text }),
    ),
    footer: text,
  })
  .refine((b) => b.cards.every((c) => c.column < b.columns.length), {
    message: "every card must sit in a named column",
  });

const checklistSchema = z.strictObject({
  kind: z.literal("checklist"),
  title: text,
  rows: z.array(z.strictObject({ text, hold: z.boolean().optional() })).min(2),
  footer: text,
});

const tableSchema = z
  .strictObject({
    kind: z.literal("table"),
    title: text,
    columns: z.array(text).min(2).max(4),
    rows: z.array(z.array(text)).min(1),
    footer: text,
  })
  .refine((t) => t.rows.every((row) => row.length === t.columns.length), {
    message: "every row must fill every column",
  });

const morningSchema = z.discriminatedUnion("kind", [
  threadSchema,
  boardSchema,
  checklistSchema,
  tableSchema,
]);

export const letterPageSchema = z.strictObject({
  /** The short address the letter prints: nahltech.com/<slug>. */
  slug: z.string().regex(/^[a-z0-9]{2,40}$/),
  /** Fixed once listed in the ledger. Never replaced. */
  token: z.string().regex(/^[a-z0-9-]{8,80}$/),
  company: z.strictObject({ name: text }),
  tabTitle: text,
  title: text,
  subtitle: text,
  handoff: z.strictObject({ body: text, diagram: diagramSchema }),
  whyNow: z.strictObject({ body: text }),
  rule: ruleSchema,
  build: z.strictObject({
    body: text,
    diagram: diagramSchema,
    neverTouches: text,
  }),
  /** A card each. One with a source link carries the BENCHMARK tag. */
  whyItWorks: z
    .array(
      z.strictObject({
        text,
        href: z.url().startsWith("https://").optional(),
      }),
    )
    .min(1),
  example: exampleSchema,
  morning: morningSchema,
  thirtyDays: z.strictObject({
    body: text,
    /** Named only. The provider's own figure is never filled in for them. */
    metrics: z.array(text).min(2).max(3),
    receive: z.array(text).min(1),
    fee: z.string().regex(/^\$\d{1,3}(,\d{3})*$/),
  }),
  sources: text,
});

export type LetterPageConfig = z.infer<typeof letterPageSchema>;
export type LetterDiagram = LetterPageConfig["handoff"]["diagram"];
export type LetterExample = LetterPageConfig["example"];
export type LetterMorning = LetterPageConfig["morning"];

const sectionSchema = z.strictObject({ name: text, eyebrow: text.optional() });

export const letterSectionKeys = [
  "handoff",
  "whyNow",
  "rule",
  "build",
  "whyItWorks",
  "example",
  "morning",
  "thirtyDays",
  "team",
  "contact",
] as const;
export type LetterSectionKey = (typeof letterSectionKeys)[number];

export const letterSharedSchema = z.strictObject({
  firm: text,
  /** `{provider}` is replaced with the page's company name. */
  topLine: text.refine((v) => v.includes("{provider}"), "needs {provider}"),
  chips: z.array(text).length(3),
  sections: z.strictObject(
    Object.fromEntries(
      letterSectionKeys.map((key) => [key, sectionSchema]),
    ) as Record<LetterSectionKey, typeof sectionSchema>,
  ),
  failLabel: text,
  neverTouchesTitle: text,
  example: z.strictObject({
    disclaimer: text,
    lowLabel: text,
    highLabel: text,
    typeLabel: text,
    typeHint: text,
  }),
  illustrationLabel: text,
  timeline: z
    .array(
      z.strictObject({
        when: text,
        what: text,
        /** How long the bar's segment runs. Zero is a single day. */
        days: z.number().int().nonnegative(),
      }),
    )
    .length(3),
  metric: z.strictObject({ placeholder: text, again: text }),
  receive: z.strictObject({ title: text, eyebrow: text }),
  fee: z.strictObject({
    title: text,
    eyebrow: text,
    terms: z.array(text).length(4),
  }),
  team: z.strictObject({
    people: z
      .array(
        z.strictObject({
          name: text,
          role: text,
          /** Shown in place of a photograph. */
          initials: z.string().regex(/^[A-Z]{2}$/),
          lines: z.array(text).min(1).max(3),
        }),
      )
      .length(2),
    line: text,
  }),
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
