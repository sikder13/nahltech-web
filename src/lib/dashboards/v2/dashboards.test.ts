import { describe, expect, it } from "vitest";

import { allRoutePaths } from "@/lib/routes";

import { evaluate, parse } from "../expression";
import {
  compileFormula,
  parseTypedValue,
  totalFormula,
  restBands,
  extentBands,
  rangeOverBands,
  roundTo,
  valueAt,
} from "./model";
import { isReaderAgent } from "./readers";
import { allDashboards, dashboardRedirects, sharedCopy } from "./registry";

describe("expression evaluator", () => {
  it("respects precedence, parentheses and unary minus", () => {
    expect(evaluate(parse("2 + 3 * 4"), {})).toBe(14);
    expect(evaluate(parse("(2 + 3) * 4"), {})).toBe(20);
    expect(evaluate(parse("-a + 10 / b"), { a: 1, b: 4 })).toBe(1.5);
  });

  it("rejects anything that is not arithmetic", () => {
    for (const bad of ["a; b", "fetch(1)", "a ** 2", "2 +", "(a"]) {
      expect(() => parse(bad)).toThrow();
    }
  });
});

describe("exact figures typed by the visitor", () => {
  it("reads money and rates the way people write them, clamped to the slider", () => {
    expect(parseTypedValue("usdMillions", "12.4", 10e6, 17e6)).toBe(12_400_000);
    expect(parseTypedValue("usdMillions", "$12.4M", 10e6, 17e6)).toBe(
      12_400_000,
    );
    expect(parseTypedValue("usdMillions", "12,400,000", 10e6, 17e6)).toBe(
      12_400_000,
    );
    expect(parseTypedValue("usdMillions", "25", 10e6, 17e6)).toBe(17_000_000);
    // A thousands suffix means thousands on a millions slider too, not millions.
    expect(parseTypedValue("usdMillions", "500k", 0, 2e6)).toBe(500_000);
    expect(parseTypedValue("usd", "$45,000", 6e3, 12e4)).toBe(45_000);
    expect(parseTypedValue("usd", "45k", 6e3, 12e4)).toBe(45_000);
    expect(parseTypedValue("percent", "3.5%", 1, 5)).toBe(3.5);
    expect(parseTypedValue("multiple", "2.5x", 2, 4)).toBe(2.5);
    expect(parseTypedValue("percent", "abc", 1, 5)).toBeNull();
  });
});

describe("short addresses and the visit count", () => {
  it("counts people, not crawlers or automated browsers", () => {
    expect(
      isReaderAgent(
        "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148 Safari/604.1",
      ),
    ).toBe(true);
    expect(
      isReaderAgent(
        "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)",
      ),
    ).toBe(false);
    expect(
      isReaderAgent(
        "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 HeadlessChrome/131.0 Safari/537.36",
      ),
    ).toBe(false);
    expect(
      isReaderAgent(
        "Mozilla/5.0 (Linux; Android 11; moto g power) Chrome-Lighthouse",
      ),
    ).toBe(false);
    expect(isReaderAgent(null)).toBe(false);
  });
});

describe("every template 2 config", () => {
  const dashboards = allDashboards();

  it("has unique slugs and tokens", () => {
    const slugs = dashboards.map((d) => d.slug);
    const tokens = dashboards.map((d) => d.token);
    expect(new Set(slugs).size).toBe(slugs.length);
    expect(new Set(tokens).size).toBe(tokens.length);
  });

  it("never shadows a real site route with its short address", () => {
    const taken = new Set(allRoutePaths.map((p) => p.split("/")[1]));
    for (const d of dashboards) expect(taken.has(d.slug)).toBe(false);
  });

  it("redirects each short address to its tokenized page, temporarily", () => {
    for (const r of dashboardRedirects()) {
      expect(r.destination).toMatch(/^\/m2\/[a-z0-9-]+$/);
      expect(r.permanent).toBe(false);
    }
  });

  /**
   * The headline range is read off the corners of the slider box. That is
   * only correct if the model moves one way in each input, so every config
   * is held to it: sample the interior and check nothing escapes the
   * corners. A model that fails this needs a different range method, not a
   * looser test.
   */
  it("is monotone in each input, so corner ranges never understate", () => {
    for (const d of dashboards) {
      const tree = compileFormula(totalFormula(d.model.terms));
      const corners = rangeOverBands(
        tree,
        d.model,
        extentBands(d.model.sliders),
      );
      let seed = 7;
      const rand = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
      for (let i = 0; i < 500; i += 1) {
        const point = Object.fromEntries(
          d.model.sliders.map((s) => [s.id, s.min + rand() * (s.max - s.min)]),
        );
        const v = valueAt(tree, d.model, point);
        expect(v).toBeGreaterThanOrEqual(corners.low - 1e-6);
        expect(v).toBeLessThanOrEqual(corners.high + 1e-6);
      }
    }
  });

  /**
   * The letter and the page must agree. The page opens on the letter's
   * printed range, and the sliders stop at the letter's printed assumptions,
   * so if the model's full span rounds to anything else, a reader who drags
   * every handle to an end sees a figure the letter never mentioned. That
   * happened once, with a printed $150,000 against a true $220,500. This
   * test is why it cannot happen for company two through thirteen.
   */
  it("rounds to exactly the letter's printed range at the letter's assumptions", () => {
    for (const d of dashboards) {
      const tree = compileFormula(totalFormula(d.model.terms));
      const span = rangeOverBands(tree, d.model, restBands(d.model.sliders));
      expect({
        slug: d.slug,
        low: roundTo(span.low, d.model.roundTo),
        high: roundTo(span.high, d.model.roundTo),
      }).toEqual({ slug: d.slug, ...d.model.letterRange });
    }
  });

  it("gives every ledger row one cell per column", () => {
    for (const d of dashboards) {
      const ledger = d.proposal.ledger;
      if (!ledger) continue;
      for (const row of ledger.rows)
        expect(row.cells.length).toBe(ledger.columns.length);
    }
  });

  it("uses no dashes as punctuation in any copy", () => {
    // Hyphens inside compound words (read-only, week-one) are fine. Em and en
    // dashes, and a hyphen standing alone between words, are not.
    const dash = /[\u2013\u2014]| - /;
    for (const d of dashboards) {
      // Term formulas are arithmetic the page evaluates, not copy it shows.
      const copy = {
        ...d,
        model: {
          ...d.model,
          terms: d.model.terms.map((t) => ({ ...t, formula: "" })),
        },
      };
      expect(JSON.stringify(copy)).not.toMatch(dash);
    }
    expect(JSON.stringify(sharedCopy())).not.toMatch(dash);
  });

  it("carries no banned copy", () => {
    const banned =
      /\b(empower|leverage|unlock|transform|harness|cutting-edge|innovative|world-class|AI-powered)\b/i;
    for (const d of dashboards) expect(JSON.stringify(d)).not.toMatch(banned);
    expect(JSON.stringify(sharedCopy())).not.toMatch(banned);
  });
});
