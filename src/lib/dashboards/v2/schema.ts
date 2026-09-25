import { z } from "zod";

import { parse, variablesOf, type ExpressionNode } from "../expression";
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
    /**
     * Where the band opens, when that is narrower than the track: the range
     * printed in the letter. Omit when the letter's range is the full track.
     */
    rest: z.object({ low: z.number(), high: z.number() }).optional(),
    /** A short instruction shown directly under the track, before the basis. */
    caption: z.string().optional(),
    /**
     * Named one-tap settings, such as closing a band on zero. The band a
     * preset sets must sit inside the slider's own range.
     */
    presets: z
      .array(z.object({ label: z.string(), low: z.number(), high: z.number() }))
      .max(2)
      .default([]),
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

/**
 * A few dated readings, drawn as separate points with no line between them.
 * Used when the source gives dated values rather than a monthly series, so
 * the chart never suggests data we do not have. A point derived from a
 * published change, rather than read from a source, must be marked
 * `computed` and says so on the chart.
 */
const pointsChartSchema = z.object({
  kind: z.literal("points"),
  title: z.string(),
  unit: z.string(),
  points: z
    .array(
      z.object({
        date: z.string(),
        value: z.number(),
        /** The value as printed beside the point, such as "about $800". */
        display: z.string(),
        computed: z.boolean().default(false),
        /** Printed under a computed point, such as "implied by the 41 percent change". */
        note: z.string().optional(),
      }),
    )
    .length(2),
  /** Text on the dimension bracket between the two points. */
  bracket: z.string(),
  callout: z.string(),
  source: z.string(),
});

export const dashboardSchema = z
  .object({
    /** Template 2. Configs live in content/dashboards-v2 and render at /m2/<token>. */
    template: z.literal(2),
    slug: z.string().regex(/^[a-z0-9-]{2,40}$/),
    token: z.string().regex(/^[a-z0-9-]{8,80}$/),
    company: z.object({
      name: z.string(),
      short: z.string(),
      town: z.string(),
      prepared: z.string(),
      /**
       * Starts the company name on its own line below the sm breakpoint. For a
       * name short enough that "Prepared for <name>" fits one line in the
       * fallback face but wraps in Fraunces on common phone widths: the title
       * is two lines in both faces, so the font swap cannot move the page.
       * Absent, the title renders as before.
       */
      titleBreak: z.boolean().optional(),
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
      /**
       * Observed fixed ranges the formulas may read, such as a posted price
       * span. Not sliders: the visitor cannot move them, and the corner
       * evaluation pairs low with low and high with high. Each carries the
       * sentence that states it, shown with the constants. Default: none, so
       * configs without spans (Mursix) are untouched.
       */
      spans: z
        .array(
          z.object({
            id: z.string(),
            low: z.number(),
            high: z.number(),
            text: z.string(),
          }),
        )
        .max(2)
        .default([]),
      /**
       * The unit written after the headline figure, such as "per hundred
       * cabs". Absent, the shared per-year suffix is used, so existing
       * configs are untouched.
       */
      unit: z.string().optional(),
      /**
       * An optional volume field: the reader types their own yearly volume and
       * every figure on the page scales to it. Absent, nothing renders.
       */
      volume: z
        .object({
          label: z.string(),
          caption: z.string(),
          /** Suffix once a volume is set. `{n}` becomes the typed number. */
          suffix: z.string(),
          per: z.number().positive(),
          max: z.number().positive(),
        })
        .optional(),
      /**
       * The model as a sum of named terms. The total is their sum; each term
       * is also shown on its own, live, in the formula box.
       */
      terms: z
        .array(
          z.object({ id: z.string(), label: z.string(), formula: z.string() }),
        )
        .min(1)
        .max(4),
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
        z.discriminatedUnion("kind", [
          lineChartSchema,
          barChartSchema,
          pointsChartSchema,
        ]),
      ),
      /** One-line public facts beside the charts, each carrying its label. */
      notes: z.array(z.string()).default([]),
    }),
    /** The letter's own words acknowledging what the company already runs. */
    respect: z
      .object({ heading: z.string(), paragraphs: z.array(z.string()).min(1) })
      .optional(),
    findings: z
      .object({
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
      })
      .optional(),
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
      /** An optional standing promise printed under the conversion clause. */
      promise: z.string().optional(),
      ledger: z
        .object({
          /**
           * Tighter column gutters below the sm breakpoint, for ledgers whose
           * word columns run wide. Absent, the original gutters render, so
           * existing configs are untouched.
           */
          dense: z.boolean().optional(),
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
    for (const term of config.model.terms) {
      let tree: ExpressionNode;
      try {
        tree = parse(term.formula);
      } catch (error) {
        ctx.addIssue({
          code: "custom",
          message: `term ${term.id}: ${(error as Error).message}`,
        });
        continue;
      }
      const spanIds = config.model.spans.map((sp) => sp.id);
      for (const name of variablesOf(tree)) {
        if (!ids.includes(name) && !spanIds.includes(name)) {
          ctx.addIssue({
            code: "custom",
            message: `term ${term.id} reads unknown input "${name}"`,
          });
        }
      }
    }
    for (const span of config.model.spans) {
      if (span.low > span.high) {
        ctx.addIssue({
          code: "custom",
          message: `span ${span.id} has low above high`,
        });
      }
    }
    for (const slider of config.model.sliders) {
      if (
        slider.rest &&
        (slider.rest.low < slider.min || slider.rest.high > slider.max)
      ) {
        ctx.addIssue({
          code: "custom",
          message: `rest band on ${slider.id} falls outside the slider`,
        });
      }
      for (const preset of slider.presets) {
        if (
          preset.low < slider.min ||
          preset.high > slider.max ||
          preset.low > preset.high
        ) {
          ctx.addIssue({
            code: "custom",
            message: `preset "${preset.label}" on ${slider.id} falls outside the slider`,
          });
        }
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
  /** How-to-read line on rounding. `{step}` becomes the rounding step, e.g. $5,000. */
  roundingNote: z.string(),
  computedLabel: z.string(),
  termsHeading: z.string(),
  /** Accessible name of the button that opens exact entry. `{label}` is the slider. */
  typeLabel: z.string(),
  typeHint: z.string(),
});
export type SharedCopy = z.infer<typeof sharedSchema>;
