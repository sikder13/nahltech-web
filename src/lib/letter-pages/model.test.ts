import { describe, expect, it } from "vitest";

import { roundForDisplay } from "@/lib/dashboards/v2/model";

import {
  computeExample,
  DISPLAY_STEP,
  openingBands,
  resultSentence,
  SMALL_ROUND,
} from "./model";
import { allLetterPages } from "./registry";

describe("the worked example's rounding", () => {
  const shown = (value: number) =>
    roundForDisplay(value, DISPLAY_STEP, SMALL_ROUND);

  it("rounds a figure under $5,000 to the nearest $1,000", () => {
    expect(shown(4435)).toBe(4000);
    expect(shown(1247)).toBe(1000);
    expect(shown(4800)).toBe(5000);
  });

  it("rounds a figure of $5,000 or more to the nearest $5,000", () => {
    expect(shown(5000)).toBe(5000);
    expect(shown(8700)).toBe(10000);
    expect(shown(9730)).toBe(10000);
    expect(shown(48000)).toBe(50000);
  });

  it("rounds a tie half up, on either rule", () => {
    expect(shown(1500)).toBe(2000);
    expect(shown(2500)).toBe(3000);
    expect(shown(4500)).toBe(5000);
    expect(shown(7500)).toBe(10000);
    expect(shown(12500)).toBe(15000);
  });
});

describe.each(allLetterPages())("the $slug worked example", ({ example }) => {
  it("never leaves the corners of its bands", () => {
    // The range is read at the corners of the slider box, which is only
    // right if the formula moves one way in each input. Sample inside the
    // box and check nothing escapes.
    const corners = computeExample(example, openingBands(example));
    let seed = 11;
    const random = () => {
      seed = (seed * 16807) % 2147483647;
      return seed / 2147483647;
    };
    for (let i = 0; i < 200; i += 1) {
      const point = Object.fromEntries(
        example.inputs.map((input) => {
          const value = input.low + random() * (input.high - input.low);
          return [input.id, { low: value, high: value }];
        }),
      );
      const inside = computeExample(example, point);
      expect(inside.exact.low).toBeGreaterThanOrEqual(corners.exact.low);
      expect(inside.exact.high).toBeLessThanOrEqual(corners.exact.high);
    }
  });

  it("follows the reader's figures when a band is closed", () => {
    const bands = openingBands(example);
    const closed = Object.fromEntries(
      example.inputs.map((input) => [
        input.id,
        { low: bands[input.id].low, high: bands[input.id].low },
      ]),
    );
    const opened = computeExample(example, bands);
    const result = computeExample(example, closed);

    expect(result.exact.low).toBe(opened.exact.low);
    expect(result.exact.high).toBeLessThanOrEqual(opened.exact.high);
    // One figure, not a range from a number to itself, once spans allow it.
    if (example.spans.length === 0) {
      expect(result.exact.low).toBe(result.exact.high);
      expect(resultSentence("{exact}", result)).not.toContain(" and ");
    }
  });

  it("opens every slider on the band its own line states", () => {
    for (const input of example.inputs) {
      const figures = [...input.stated.matchAll(/\d[\d,]*/g)].map((m) =>
        Number(m[0].replace(/,/g, "")),
      );
      // "one hour at $26" spells its figure; nothing to read a band from.
      if (figures.length === 0 || /^one\b/.test(input.stated)) continue;
      expect(figures, input.label).toContain(input.low);
      if (input.high !== input.low) {
        expect(figures, input.label).toContain(input.high);
      }
    }
  });
});
