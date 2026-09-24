import { z } from "zod";

import { parse, variablesOf, type ExpressionNode } from "./expression";
import { sliderFormats } from "./model";

/**
 * Zod schemas for prospect dashboard configs. Server and build only: the
 * client calibration component imports `model.ts`, never this file, so zod
 * stays out of the browser bundle.
 */

const identifier = z.string().regex(/^[a-z][a-zA-Z0-9]*$/);

const sliderSchema = z
  .object({
    id: identifier,
    label: z.string().min(1),
    format: z.enum(sliderFormats),
    min: z.number(),
    max: z.number(),
    step: z.number().positive(),
    /** Why the band is where it is. May carry inline [[LABEL]] markers. */
    basis: z.string().min(1),
  })
  .refine((s) => s.max > s.min, "slider max must exceed min");

const constantSchema = z.object({
  id: identifier,
  value: z.number(),
  /** Plain statement of the fixed assumption, shown under the formula. */
  text: z.string().min(1),
});

const lineChartSchema = z.object({
  kind: z.literal("line"),
  title: z.string(),
  unit: z.string(),
  points: z.array(z.object({ label: z.string(), value: z.number() })).min(2),
  /** Indexes into `points` whose values are printed on the chart. */
  annotate: z.array(z.number().int().nonnegative()).default([]),
  callout: z.string(),
  source: z.string(),
});

const barChartSchema = z.object({
  kind: z.literal("bars"),
  title: z.string(),
  unit: z.string(),
  bars: z
    .array(z.object({ label: z.string(), value: z.number() }))
    .min(2)
    .max(6),
  callout: z.string(),
  source: z.string(),
});

export const dashboardSchema = z
  .object({
    slug: z.string().regex(/^[a-z0-9-]{2,40}$/),
    token: z.string().regex(/^[a-z0-9-]{8,80}$/),
    company: z.object({
      name: z.string(),
      short: z.string(),
      town: z.string(),
      prepared: z.string(),
    }),
    hero: z.object({
      /** Above the number at rest, when it is the letter's figure. */
      caption: z.string(),
      /** Above the number once the visitor has moved a slider. */
      liveCaption: z.string(),
      subline: z.string(),
    }),
    model: z.object({
      heading: z.string(),
      intro: z.string(),
      sliders: z.array(sliderSchema).min(1).max(4),
      constants: z.array(constantSchema).default([]),
      formula: z.string(),
      formulaText: z.string(),
      plainText: z.string(),
      roundTo: z.number().positive(),
      /** The range printed in the letter. Shown, exactly, until a slider moves. */
      letterRange: z.object({ low: z.number(), high: z.number() }),
    }),
    market: z.object({
      heading: z.string(),
      intro: z.string(),
      charts: z.array(
        z.discriminatedUnion("kind", [lineChartSchema, barChartSchema]),
      ),
    }),
    findings: z.object({
      heading: z.string(),
      items: z
        .array(
          z.object({
            title: z.string(),
            body: z.array(z.string()).min(1),
          }),
        )
        .max(3),
      closing: z.string(),
    }),
    proposal: z.object({
      heading: z.string(),
      /** The letter's proposal paragraph, verbatim. */
      lead: z.string(),
      deliverablesHeading: z.string(),
      deliverables: z
        .array(z.object({ title: z.string(), line: z.string() }))
        .min(1)
        .max(4),
      weeksHeading: z.string(),
      weeks: z
        .array(z.object({ when: z.string(), what: z.string() }))
        .min(1)
        .max(5),
      feeHeading: z.string(),
      fee: z.string(),
      feeCovers: z.string(),
      conversion: z.string(),
      ledger: z
        .object({
          title: z.string(),
          label: z.string(),
          columns: z.array(z.string()).min(2).max(6),
          rows: z
            .array(
              z.object({
                cells: z.array(z.string()),
                /** Why the row is flagged, printed in the row, never colour alone. */
                flag: z.string().optional(),
              }),
            )
            .min(1)
            .max(8),
          note: z.string(),
        })
        .optional(),
    }),
    sources: z.array(z.string()).min(1),
  })
  .superRefine((config, ctx) => {
    const ids = [
      ...config.model.sliders.map((s) => s.id),
      ...config.model.constants.map((c) => c.id),
    ];
    if (new Set(ids).size !== ids.length) {
      ctx.addIssue({
        code: "custom",
        message: "slider and constant ids must be unique",
      });
    }
    let tree: ExpressionNode;
    try {
      tree = parse(config.model.formula);
    } catch (error) {
      ctx.addIssue({
        code: "custom",
        message: `formula: ${(error as Error).message}`,
      });
      return;
    }
    for (const name of variablesOf(tree)) {
      if (!ids.includes(name)) {
        ctx.addIssue({
          code: "custom",
          message: `formula reads unknown input "${name}"`,
        });
      }
    }
  });

export type DashboardConfig = z.infer<typeof dashboardSchema>;
export type ModelConfig = DashboardConfig["model"];
export type SliderConfig = ModelConfig["sliders"][number];

/** Chrome shared by every dashboard: legend, contact, privacy line. */
export const sharedSchema = z.object({
  firm: z.string(),
  labelsLink: z.string(),
  legend: z.object({
    OBSERVED: z.string(),
    BENCHMARK: z.string(),
    ASSUMED: z.string(),
  }),
  legendHeading: z.string(),
  sourcesHeading: z.string(),
  book: z.object({
    heading: z.string(),
    body: z.string(),
    button: z.string(),
    phoneLabel: z.string(),
    phoneHref: z.string(),
    email: z.string().email(),
  }),
  method: z.object({
    anchor: z.string(),
    trail: z.string(),
    href: z.string().startsWith("/"),
  }),
  privacy: z.string(),
  /** The letter's closing posture, carried verbatim in the footer. */
  closing: z.string(),
  flagLabel: z.string(),
  resetLabel: z.string(),
  narrowedNote: z.string(),
  nowLabel: z.string(),
  lowLabel: z.string(),
  highLabel: z.string(),
  perYear: z.string(),
});
export type SharedCopy = z.infer<typeof sharedSchema>;
