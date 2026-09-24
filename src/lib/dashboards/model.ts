import { evaluate, parse, type ExpressionNode } from "./expression";

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

export function fullBands(
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
      return `$${(value / 1_000_000).toFixed(1)}M`;
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
