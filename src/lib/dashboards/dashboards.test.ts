import { describe, expect, it } from "vitest";

import { allRoutePaths } from "@/lib/routes";

import { evaluate, parse } from "./expression";
import {
  compileFormula,
  displayedRange,
  fullBands,
  rangeOverBands,
  roundTo,
  valueAt,
} from "./model";
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

describe("EckCo model", () => {
  const eckco = allDashboards().find((d) => d.slug === "eckco")!;
  const tree = compileFormula(eckco.model.formula);

  it("reproduces the letter's low end at the letter's ranges", () => {
    const range = rangeOverBands(
      tree,
      eckco.model,
      fullBands(eckco.model.sliders),
    );
    expect(range.low).toBeCloseTo(25_500, 6);
    expect(roundTo(range.low, eckco.model.roundTo)).toBe(
      eckco.model.letterRange.low,
    );
  });

  it("computes $25,500 and $220,500 at the letter's ranges", () => {
    const range = rangeOverBands(
      tree,
      eckco.model,
      fullBands(eckco.model.sliders),
    );
    expect(range.low).toBeCloseTo(25_500, 6);
    expect(range.high).toBeCloseTo(220_500, 6);
  });

  it("shows the letter's range at rest, and live output after input", () => {
    const computed = rangeOverBands(
      tree,
      eckco.model,
      fullBands(eckco.model.sliders),
    );
    const atRest = displayedRange(
      false,
      computed,
      eckco.model.letterRange,
      eckco.model.roundTo,
    );
    expect(atRest.range).toEqual({ low: 25_000, high: 220_000 });
    expect(atRest.live).toBe(false);
    const live = displayedRange(
      true,
      computed,
      eckco.model.letterRange,
      eckco.model.roundTo,
    );
    expect(live.range).toEqual(atRest.range);
    expect(live.live).toBe(true);
  });

  it("quotes the letter word for word where the page overlaps it", () => {
    expect(eckco.findings.closing).toBe(
      "The full working is part of the diagnostic.",
    );
    expect(eckco.proposal.fee).toBe("A fixed fee between $1,500 and $2,500.");
    expect(eckco.proposal.conversion).toBe(
      "If your controllers export nothing usable, we say so in week one and deliver a data-readiness report at the same price.",
    );
    expect(sharedCopy().closing).toBe(
      "If the answer is no, that is a fair answer, and the model is yours to keep either way.",
    );
    expect(eckco.market.intro).toContain(
      "makes every scrapped part more expensive.",
    );
    expect(eckco.findings.items[1]?.body[0]).toContain(
      "\u201cheld by just a few people,\u201d",
    );
  });

  it("collapses to a single figure when every band is closed", () => {
    const point = {
      spend: { low: 2e6, high: 2e6 },
      scrap: { low: 3, high: 3 },
      mult: { low: 3, high: 3 },
    };
    const range = rangeOverBands(tree, eckco.model, point);
    expect(range.low).toBe(range.high);
    expect(range.low).toBeCloseTo(2e6 * 0.03 * 0.75 + 2e6 * 0.03 * 0.1 * 2, 6);
  });
});

describe("every dashboard config", () => {
  const dashboards = allDashboards();

  it("loads and validates, with the shared chrome", () => {
    expect(dashboards.length).toBeGreaterThan(0);
    expect(() => sharedCopy()).not.toThrow();
  });

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
      expect(r.destination).toMatch(/^\/m\/[a-z0-9-]+$/);
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
      const tree = compileFormula(d.model.formula);
      const corners = rangeOverBands(tree, d.model, fullBands(d.model.sliders));
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
      const tree = compileFormula(d.model.formula);
      const span = rangeOverBands(tree, d.model, fullBands(d.model.sliders));
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
      // `formula` is arithmetic the page evaluates, not copy it shows.
      const copy = { ...d, model: { ...d.model, formula: "" } };
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
