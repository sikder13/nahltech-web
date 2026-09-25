import { evaluate, parse, type ExpressionNode } from "../expression";

import type { ModelConfig, SliderConfig } from "./schema";

/**
 * Prospect dashboards: the arithmetic that turns slider bands into the range
 * shown on the page. The config contract itself lives in `schema.ts`.
 *
 * This module is imported by the client calibration component, so it must
 * stay free of `fs` and of anything server-only. File loading lives in
 * `registry.ts`.
 *
 * WHY BANDS, NOT POINTS. The letter states each assumption as a range
 * ("material spend of $1.5 to $3.5 million"). Each slider is therefore a
 * band with two thumbs, and the page opens with every band at the letter's
 * full width. Correcting an assumption means narrowing its band; knowing a
 * figure exactly means closing both thumbs on it. The headline range is the
 * lowest and highest the model produces anywhere inside the chosen bands,
 * which for a model that rises or falls steadily in each input is found at
 * the corners of the box. `assertMonotone` in the tests holds every config
 * to that property, so the corner shortcut can never understate a range.
 */

export const evidenceLabels = ["OBSERVED", "BENCHMARK", "ASSUMED"] as const;
export type EvidenceLabel = (typeof evidenceLabels)[number];

export const sliderFormats = [
  "usdMillions",
  "usd",
  "percent",
  "multiple",
  "count",
  "minutes",
] as const;
export type SliderFormat = (typeof sliderFormats)[number];

/* ------------------------------------------------------------------------ */

export type Band = { low: number; high: number };

/** Slider value as the formula sees it: percentages become fractions. */
function toModelUnits(format: SliderFormat, value: number): number {
  return format === "percent" ? value / 100 : value;
}

export function compileFormula(formula: string): ExpressionNode {
  return parse(formula);
}

/** The model's total: the sum of its named terms. */
export function totalFormula(terms: readonly { formula: string }[]): string {
  return terms.map((t) => `(${t.formula})`).join(" + ");
}

/**
 * Lowest and highest model output across every corner of the chosen bands.
 * At most 2^4 = 16 evaluations, so it is cheap enough to run on every
 * slider movement.
 */
export function rangeOverBands(
  tree: ExpressionNode,
  model: Pick<ModelConfig, "sliders" | "constants">,
  bands: Record<string, Band>,
): Band {
  const constants = Object.fromEntries(
    model.constants.map((c) => [c.id, c.value]),
  );
  const n = model.sliders.length;
  let low = Infinity;
  let high = -Infinity;
  for (let mask = 0; mask < 1 << n; mask += 1) {
    const vars: Record<string, number> = { ...constants };
    model.sliders.forEach((slider, i) => {
      const band = bands[slider.id] ?? { low: slider.min, high: slider.max };
      const raw = mask & (1 << i) ? band.high : band.low;
      vars[slider.id] = toModelUnits(slider.format, raw);
    });
    const value = evaluate(tree, vars);
    low = Math.min(low, value);
    high = Math.max(high, value);
  }
  return { low, high };
}

/** The model at one exact point. Used by the monotonicity test. */
export function valueAt(
  tree: ExpressionNode,
  model: Pick<ModelConfig, "sliders" | "constants">,
  point: Record<string, number>,
): number {
  const vars: Record<string, number> = Object.fromEntries(
    model.constants.map((c) => [c.id, c.value]),
  );
  for (const slider of model.sliders) {
    vars[slider.id] = toModelUnits(
      slider.format,
      point[slider.id] ?? slider.min,
    );
  }
  return evaluate(tree, vars);
}

/**
 * The bands the page opens at: the ranges printed in the letter. Usually the
 * slider's full track, but a slider may run wider than the letter (down to
 * zero, say, so a term can be switched off) while still opening exactly on
 * the letter's assumptions.
 */
export function restBands(
  sliders: readonly SliderConfig[],
): Record<string, Band> {
  return Object.fromEntries(
    sliders.map((s) => [s.id, s.rest ?? { low: s.min, high: s.max }]),
  );
}

/** Every slider at the full width of its track. */
export function extentBands(
  sliders: readonly SliderConfig[],
): Record<string, Band> {
  return Object.fromEntries(
    sliders.map((s) => [s.id, { low: s.min, high: s.max }]),
  );
}

export function roundTo(value: number, step: number): number {
  return Math.round(value / step) * step;
}

export function formatUsd(value: number): string {
  return `$${Math.round(value).toLocaleString("en-US")}`;
}

/** Display form of a slider value, e.g. "$2.5M", "4.0%", "3.0x". */
export function formatSliderValue(format: SliderFormat, value: number): string {
  switch (format) {
    case "usdMillions":
      return value === 0 ? "$0" : `$${(value / 1_000_000).toFixed(1)}M`;
    case "usd":
      return formatUsd(value);
    case "percent":
      return `${value.toFixed(1)}%`;
    case "multiple":
      return `${value.toFixed(1)}x`;
    case "count":
      return Math.round(value).toLocaleString("en-US");
    case "minutes":
      return `${Math.round(value)} min`;
  }
}

/** Screen-reader form, spoken rather than abbreviated. */
export function spokenSliderValue(format: SliderFormat, value: number): string {
  switch (format) {
    case "usdMillions":
      return `${(value / 1_000_000).toFixed(1)} million dollars`;
    case "percent":
      return `${value.toFixed(1)} percent`;
    case "multiple":
      return `${value.toFixed(1)} times`;
    default:
      return formatSliderValue(format, value);
  }
}

/**
 * What the headline shows.
 *
 * At rest it is the range printed in the letter, exactly, so the page and
 * the letter in the reader's hand say the same thing. Once the visitor moves
 * a slider it is the model's live output for the bands they have set, rounded
 * the same way. The tests hold every config to the rule that the model's
 * full span at the letter's ranges rounds to the letter's range, so the two
 * can never disagree at rest and the sliders cannot reach a figure outside
 * what was mailed.
 */
export function displayedRange(
  touched: boolean,
  computed: Band,
  letter: Band,
  step: number,
): { range: Band; live: boolean } {
  if (!touched) return { range: letter, live: false };
  return {
    range: {
      low: roundTo(computed.low, step),
      high: roundTo(computed.high, step),
    },
    live: true,
  };
}

/** Whole dollars with separators, never rounded beyond the dollar. */
export function formatUsdExact(value: number): string {
  return `$${Math.round(value).toLocaleString("en-US")}`;
}

/**
 * Reads a figure typed by the visitor, in the units the slider displays.
 *
 * Tolerant of how people write money and rates: "$12.4M", "12.4", "12,400,000"
 * and "12400000" all mean twelve point four million on a millions slider;
 * "3%", "3" mean three percent; "2.5x" means two and a half times; "500k"
 * means five hundred thousand dollars on either kind of money slider. Returns
 * null for anything that is not a number, and clamps to the slider's range,
 * so a typed figure can never take the model outside the printed assumptions.
 */
export function parseTypedValue(
  format: SliderFormat,
  raw: string,
  min: number,
  max: number,
): number | null {
  const cleaned = raw
    .trim()
    .toLowerCase()
    .replace(/[$,\s%x]/g, "");
  const millions = cleaned.endsWith("m");
  const thousands = cleaned.endsWith("k");
  const digits = cleaned.replace(/[mk]$/, "");
  if (!/^\d*\.?\d+$/.test(digits)) return null;
  let value = Number(digits);
  if (format === "usdMillions") {
    // Small numbers are millions ("12.4"); large ones are dollars ("12400000").
    value = thousands
      ? value * 1000
      : millions || value < 1000
        ? value * 1_000_000
        : value;
  } else if (format === "usd") {
    value = millions ? value * 1_000_000 : thousands ? value * 1000 : value;
  }
  return Math.min(max, Math.max(min, value));
}
