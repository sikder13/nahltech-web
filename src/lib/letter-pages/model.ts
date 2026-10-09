import { evaluate, parse } from "@/lib/dashboards/expression";
import {
  formatUsd,
  roundForDisplay,
  type Band,
  type SliderFormat,
} from "@/lib/dashboards/v2/model";

/**
 * The worked example on a letter page.
 *
 * The same arithmetic the dashboards use: a formula kept as data and read
 * by the same parser, its range taken at the corners of the slider box, and
 * the display rounded by the shared rounding function. Free of zod, because the
 * client component imports this.
 */

/** Under $5,000 a figure shows to the nearest $1,000, otherwise $5,000. */
export const DISPLAY_STEP = 5000;
export const SMALL_ROUND = { under: 5000, step: 1000 } as const;

export type ExampleModel = {
  inputs: readonly {
    id: string;
    format: SliderFormat;
    min: number;
    max: number;
    low: number;
    high: number;
  }[];
  constants: readonly { id: string; value: number }[];
  spans: readonly { id: string; low: number; high: number }[];
  formula: string;
  outputs: readonly { id: string; formula: string }[];
  result: string;
};

/** The bands the example opens at: the ranges the proposal states. */
export function openingBands(model: ExampleModel): Record<string, Band> {
  return Object.fromEntries(
    model.inputs.map((input) => [
      input.id,
      { low: input.low, high: input.high },
    ]),
  );
}

/** Whole numbers, half up on the true decimal value. */
function whole(value: number): number {
  return Math.round(parseFloat(value.toFixed(4)));
}

/**
 * Lowest and highest value of a formula across every corner of the bands.
 * Exact for a formula linear in each input taken alone, which a sum of
 * products is; the tests hold every example to it. A percent slider reaches
 * the formula as a fraction, the same convention the dashboards use.
 */
function rangeOf(
  model: ExampleModel,
  formula: string,
  bands: Record<string, Band>,
): Band {
  const tree = parse(formula);
  const fixed = Object.fromEntries(model.constants.map((c) => [c.id, c.value]));
  const axes = [
    ...model.inputs.map((input) => {
      const band = bands[input.id] ?? { low: input.low, high: input.high };
      const scale = input.format === "percent" ? 100 : 1;
      return { id: input.id, low: band.low / scale, high: band.high / scale };
    }),
    ...model.spans,
  ];
  let low = Infinity;
  let high = -Infinity;
  for (let mask = 0; mask < 1 << axes.length; mask += 1) {
    const vars: Record<string, number> = { ...fixed };
    axes.forEach((axis, i) => {
      vars[axis.id] = mask & (1 << i) ? axis.high : axis.low;
    });
    const value = evaluate(tree, vars);
    low = Math.min(low, value);
    high = Math.max(high, value);
  }
  return { low, high };
}

export type ExampleResult = {
  /** Unrounded dollars, to the whole dollar. */
  exact: Band;
  /** The same pair under the display rounding rule. */
  display: Band;
  /** Counted figures, keyed by output id. */
  counts: Record<string, Band>;
};

export function computeExample(
  model: ExampleModel,
  bands: Record<string, Band>,
): ExampleResult {
  const dollars = rangeOf(model, model.formula, bands);
  const exact = { low: whole(dollars.low), high: whole(dollars.high) };
  return {
    exact,
    display: {
      low: roundForDisplay(dollars.low, DISPLAY_STEP, SMALL_ROUND),
      high: roundForDisplay(dollars.high, DISPLAY_STEP, SMALL_ROUND),
    },
    counts: Object.fromEntries(
      model.outputs.map((output) => {
        const range = rangeOf(model, output.formula, bands);
        return [output.id, { low: whole(range.low), high: whole(range.high) }];
      }),
    ),
  };
}

const plain = (value: number) => value.toLocaleString("en-US");

/** The result sentence, with the model's figures written into it. */
export function resultSentence(
  template: string,
  result: ExampleResult,
): string {
  const pair = (band: Band, format: (n: number) => string, joiner: string) =>
    band.low === band.high
      ? format(band.low)
      : `${format(band.low)} ${joiner} ${format(band.high)}`;

  return template.replace(/\{([a-zA-Z]+)\}/g, (_, token: string) => {
    if (token === "usd") return pair(result.display, formatUsd, "to");
    if (token === "exact") return pair(result.exact, formatUsd, "and");
    return pair(result.counts[token], plain, "to");
  });
}
