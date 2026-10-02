import { describe, expect, it } from "vitest";

import { allRoutePaths } from "@/lib/routes";

import { evaluate, parse } from "../expression";
import {
  compileFormula,
  displayedAtVolume,
  formatSliderValue,
  formatUsdExact,
  scaleToVolume,
  parseTypedValue,
  totalFormula,
  displayedRange,
  restBands,
  extentBands,
  rangeOverBands,
  roundTo,
  valueAt,
} from "./model";
import { isReaderAgent } from "./readers";
import { allDashboards, dashboardRedirects, sharedCopy } from "./registry";
import { dashboardSchema } from "./schema";

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

describe("Mursix model", () => {
  const mursix = allDashboards().find((d) => d.slug === "mursix")!;
  const tree = compileFormula(totalFormula(mursix.model.terms));
  const full = restBands(mursix.model.sliders);

  it("computes $106,000 and $1,370,000 to the dollar at the letter's ranges", () => {
    const range = rangeOverBands(tree, mursix.model, full);
    // 10,000,000 x 1% + 0 x 20% + 6,000 and 17,000,000 x 5% + 2,000,000 x 20% + 120,000
    expect(range.low).toBeCloseTo(106_000, 6);
    expect(range.high).toBeCloseTo(1_370_000, 6);
  });

  it("displays $105,000 to $1,370,000, the letter's figures, under the $5,000 rounding rule", () => {
    const range = rangeOverBands(tree, mursix.model, full);
    expect(roundTo(range.low, mursix.model.roundTo)).toBe(105_000);
    expect(roundTo(range.high, mursix.model.roundTo)).toBe(1_370_000);
    expect(mursix.model.roundTo).toBe(5_000);
    const atRest = displayedRange(
      false,
      range,
      mursix.model.letterRange,
      mursix.model.roundTo,
    );
    expect(atRest.range).toEqual({ low: 105_000, high: 1_370_000 });
  });

  it("gives each term its own exact range", () => {
    const byTerm = Object.fromEntries(
      mursix.model.terms.map((t) => [
        t.id,
        rangeOverBands(compileFormula(t.formula), mursix.model, full),
      ]),
    );
    expect(byTerm.steel!.low).toBeCloseTo(100_000, 6);
    expect(byTerm.steel!.high).toBeCloseTo(850_000, 6);
    expect(byTerm.metal!.low).toBeCloseTo(0, 6);
    expect(byTerm.metal!.high).toBeCloseTo(400_000, 6);
    expect(byTerm.reclaim).toEqual({ low: 6_000, high: 120_000 });
  });

  it("from rest, the consigned preset gives $106,000 to $970,000, shown as $105,000 to $970,000", () => {
    const range = rangeOverBands(tree, mursix.model, {
      ...full,
      inventory: { low: 0, high: 0 },
    });
    expect(range.low).toBeCloseTo(106_000, 6);
    expect(range.high).toBeCloseTo(970_000, 6);
    expect(roundTo(range.low, 5_000)).toBe(105_000);
    expect(roundTo(range.high, 5_000)).toBe(970_000);
  });

  it("opens the reclaim band at the letter's $6,000 to $120,000 but lets it reach zero", () => {
    const slider = mursix.model.sliders.find((s) => s.id === "leakage")!;
    expect(slider.min).toBe(0);
    expect(full.leakage).toEqual({ low: 6_000, high: 120_000 });
    const both = rangeOverBands(tree, mursix.model, {
      ...full,
      inventory: { low: 0, high: 0 },
      leakage: { low: 0, high: 0 },
    });
    expect(both).toEqual({ low: 100_000, high: 850_000 });
  });

  it("closes the precious-metal band on zero with the consigned preset", () => {
    const slider = mursix.model.sliders.find((s) => s.id === "inventory")!;
    expect(slider.presets).toEqual([
      { label: "Consigned or discontinued", low: 0, high: 0 },
    ]);
    const range = rangeOverBands(tree, mursix.model, {
      ...full,
      inventory: { low: 0, high: 0 },
    });
    expect(range.high).toBeCloseTo(970_000, 6);
  });

  it("quotes the letter word for word where the page overlaps it", () => {
    expect(mursix.proposal.fee).toBe("A fixed fee between $5,000 and $7,500.");
    expect(mursix.proposal.conversion).toBe(
      "If your records cannot support the work, we say so in the first week and deliver a data-readiness report at the same price.",
    );
    expect(mursix.respect?.paragraphs[0]?.replace(" [[OBSERVED]]", "")).toBe(
      "Your presses already report through SmartPAC, and your team built Murray Mentor to keep the floor's knowledge. This is the layer neither was built for: what the metal itself does to your margin, in dollars, by part.",
    );
    expect(mursix.proposal.deliverables.map((d) => d.title)[2]).toBe(
      "The measured number",
    );
  });

  it("marks every computed chart point and draws only two dated points", () => {
    // Labels sit inside the sentence; the words themselves must match the letter.
    expect(mursix.market!.notes[0]?.replace(/ \[\[[A-Z]+\]\]/g, "")).toContain(
      "Your largest market sold 5.8 percent fewer vehicles in August than a year earlier.",
    );
    for (const chart of mursix.market!.charts) {
      if (chart.kind !== "points") continue;
      for (const p of chart.points)
        if (p.computed) expect(p.note).toMatch(/implied/);
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

  it("reads a cents field the way prices are said", () => {
    // A phone opens a decimal keypad, so "18" is the likely entry; it must
    // land on $0.18, not clamp to the top of the slider.
    for (const typed of ["18", "18c", "18¢", "18 cents"])
      expect(parseTypedValue("usdCents", typed, 0.05, 0.5), typed).toBeCloseTo(
        0.18,
        10,
      );
    for (const typed of ["0.18", ".18", "$0.18", "$.18"])
      expect(parseTypedValue("usdCents", typed, 0.05, 0.5), typed).toBeCloseTo(
        0.18,
        10,
      );
    // Out of range still clamps: a dollar figure too high, cents too low.
    expect(parseTypedValue("usdCents", "$2", 0.05, 0.5)).toBe(0.5);
    expect(parseTypedValue("usdCents", "2", 0.05, 0.5)).toBe(0.05);
    expect(parseTypedValue("usdCents", "abc", 0.05, 0.5)).toBeNull();
    // A cents mark means nothing on a dollar slider.
    expect(parseTypedValue("usd", "18c", 6e3, 12e4)).toBeNull();
    const shown = formatSliderValue(
      "usdCents",
      parseTypedValue("usdCents", "18", 0.05, 0.5)!,
    );
    expect(shown).toBe("$0.18");
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

describe("FabACab model", () => {
  const fab = allDashboards().find((d) => d.slug === "fabacab")!;
  const tree = compileFormula(totalFormula(fab.model.terms));
  const full = restBands(fab.model.sliders);

  it("computes $18,452.96 and $104,548.87 to the cent at the letter's assumptions", () => {
    const range = rangeOverBands(tree, fab.model, full);
    // 100 x 1% x 8,147 + 100 x 8,147 x 30% x 0.253 x (2/12), and the same at the top.
    expect(range.low).toBeCloseTo(18_452.955, 3);
    expect(range.high).toBeCloseTo(104_548.867, 3);
    expect(formatUsdExact(range.low)).toBe("$18,452.96");
    expect(formatUsdExact(range.high)).toBe("$104,548.87");
  });

  it("displays $20,000 to $105,000, the letter's figures, under the $5,000 rule", () => {
    const range = rangeOverBands(tree, fab.model, full);
    const atRest = displayedRange(
      false,
      range,
      fab.model.letterRange,
      fab.model.roundTo,
    );
    expect(atRest.range).toEqual({ low: 20_000, high: 105_000 });
    expect(roundTo(range.low, 5_000)).toBe(20_000);
    expect(roundTo(range.high, 5_000)).toBe(105_000);
  });

  it("pairs the observed price span low with low and high with high", () => {
    const remakes = rangeOverBands(
      compileFormula("100 * r * p"),
      fab.model,
      full,
    );
    expect(remakes.low).toBeCloseTo(8_147, 6);
    expect(remakes.high).toBeCloseTo(50_896, 6);
    const drift = rangeOverBands(
      compileFormula("100 * p * m * alu * (w / 12)"),
      fab.model,
      full,
    );
    expect(formatUsdExact(drift.low)).toBe("$10,305.96");
    expect(formatUsdExact(drift.high)).toBe("$53,652.87");
  });

  it("collapses to one component under each preset, at the letter's displayed figures", () => {
    const wZero = rangeOverBands(tree, fab.model, {
      ...full,
      w: { low: 0, high: 0 },
    });
    expect(wZero.low).toBeCloseTo(8_147, 6);
    expect(wZero.high).toBeCloseTo(50_896, 6);
    expect(roundTo(wZero.low, 5_000)).toBe(10_000);
    expect(roundTo(wZero.high, 5_000)).toBe(50_000);
    const rZero = rangeOverBands(tree, fab.model, {
      ...full,
      r: { low: 0, high: 0 },
    });
    expect(formatUsdExact(rZero.low)).toBe("$10,305.96");
    expect(formatUsdExact(rZero.high)).toBe("$53,652.87");
    expect(roundTo(rZero.low, 5_000)).toBe(10_000);
    expect(roundTo(rZero.high, 5_000)).toBe(55_000);
  });

  it("scales the EXACT range and rounds once: 240 cabs shows $45,000 to $250,000", () => {
    const exact = rangeOverBands(tree, fab.model, full);
    const year = scaleToVolume(exact, 240, 100);
    expect(formatUsdExact(year.low)).toBe("$44,287.09");
    expect(formatUsdExact(year.high)).toBe("$250,917.28");
    const shown = displayedAtVolume(exact, 240, 100, fab.model.roundTo);
    expect(shown).toEqual({ low: 45_000, high: 250_000 });
    // The trap this pins: scaling the already-rounded per-hundred display
    // (20,000 x 2.4 = 48,000) rounds to 50,000. The high end coincidentally
    // survives double rounding, which is how this bug class hides.
    expect(roundTo(fab.model.letterRange.low * 2.4, fab.model.roundTo)).toBe(
      50_000,
    );
    expect(shown.low).not.toBe(50_000);
  });

  it("displays round-to-step of the exact scaled value, for any volume, in every state", () => {
    const bandSets = [
      full,
      { ...full, w: { low: 0, high: 0 } },
      { ...full, r: { low: 0, high: 0 } },
    ];
    let seed = 11;
    const rand = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    const volumes = [1, 7, 33, 100, 240, 999, 2_400];
    for (let i = 0; i < 200; i += 1)
      volumes.push(1 + Math.floor(rand() * 99_999));
    for (const bands of bandSets) {
      const exact = rangeOverBands(tree, fab.model, bands);
      for (const n of volumes) {
        const shown = displayedAtVolume(exact, n, 100, fab.model.roundTo);
        expect(shown.low).toBe(
          roundTo((exact.low * n) / 100, fab.model.roundTo),
        );
        expect(shown.high).toBe(
          roundTo((exact.high * n) / 100, fab.model.roundTo),
        );
      }
    }
  });

  it("quotes the letter word for word where the page overlaps it", () => {
    expect(fab.proposal.lead).toBe(
      "The proposal is deliberately small. In two to three weeks, for a fixed fee between $1,500 and $2,500 settled in one call, we would measure four numbers from your records: the remake rate and its cost by cause, what your quotes absorbed, where time goes inside your lead time (qCab publishes four weeks or less, SnapCab five to six express, your site eight to ten after approvals), and the modernization share of your order book. Read-only; nothing installed, nothing changed.",
    );
    const strip = (t?: string) => t?.replace(/ \[\[[A-Z]+\]\]/g, "");
    expect(strip(fab.respect?.paragraphs[0])).toBe(
      "Your About page credits the Cab Builder with changing the way elevator interiors are quoted. Your handrail carries a patent written so the installer never enters the hoistway. You post starting prices and cab weights on the open web; of seven competitors we read, none posts both.",
    );
    expect(fab.proposal.promise).toBe(
      "If your records show our letter overstated the money, the baseline says so in writing.",
    );
    const bars = fab.market!.charts.find((c) => c.kind === "bars");
    expect(bars && "callout" in bars ? bars.callout : "").toContain(
      "If the gap is custom scope, it is a pricing asset.",
    );
  });

  it("pins the copy that was approved after render review", () => {
    // Line 11 of the copy list: the rendered "from signature to purchase" was
    // retroactively approved over the drafted "from signed approvals to
    // purchase" (RELAY-FAB-5). This pin holds the approved rendered wording.
    const w = fab.model.sliders.find((s) => s.id === "w")!;
    expect(w.basis).toContain(
      "The window across which a fixed, all-inclusive quote absorbs material moves, from signature to purchase.",
    );
    // Eleven months is not a year: the chart is titled by its dates.
    expect(fab.market!.charts[0]?.title).toBe(
      "Aluminum mill shapes, September 2025 to August 2026",
    );
    // The division mark reads unmistakably at phone sizes.
    expect(fab.model.formulaText).toContain("(months / 12)");
    expect(fab.model.formulaText).not.toContain("\u00f7");
  });

  it("sets its short name on its own title line on phones", () => {
    // "Prepared for FabACab, Inc." fits one line in the fallback face at
    // 375 to 393px but wraps in Fraunces, so the font swap moved the page.
    expect(fab.company.titleBreak).toBe(true);
  });

  it("labels federal series BENCHMARK and the company's own pages OBSERVED", () => {
    expect(fab.model.constants[0]?.text).toContain("[[BENCHMARK]]");
    expect(fab.market!.intro).toContain("[[BENCHMARK]]");
    expect(fab.model.spans[0]?.text).toContain("[[OBSERVED]]");
  });

  it("keeps every ledger row's cost equal to price times share, to the cent", () => {
    for (const row of fab.proposal.ledger!.rows) {
      const price = Number(row.cells[2]!.replace(/[$,]/g, ""));
      const share =
        row.cells[3] === "Whole"
          ? 1
          : Number(row.cells[3]!.replace("%", "")) / 100;
      const cost = Number(row.cells[4]!.replace(/[$,]/g, ""));
      expect(cost).toBeCloseTo(price * share, 2);
    }
  });
});

describe("roundTo at exact halves", () => {
  it("rounds half up, one mechanical rule everywhere (the Trifecta tie ruling)", () => {
    // Synthetic exact ties at the function, so this bug class is caught here,
    // not on a page: 2,500/5,000 = 0.5 and 12,500/5,000 = 2.5.
    expect(roundTo(2_500, 5_000)).toBe(5_000);
    expect(roundTo(7_500, 5_000)).toBe(10_000);
    expect(roundTo(12_500, 5_000)).toBe(15_000);
    expect(roundTo(1_232_500, 5_000)).toBe(1_235_000);
  });
});

describe("Trifecta model", () => {
  const tri = allDashboards().find((d) => d.slug === "trifecta")!;
  const tree = compileFormula(totalFormula(tri.model.terms));
  const full = restBands(tri.model.sliders);

  it("computes the locked endpoints to the cent at the letter's assumptions", () => {
    const a = rangeOverBands(compileFormula("1000 * r * p"), tri.model, full);
    expect(a.low).toBeCloseTo(15_000, 6);
    expect(a.high).toBeCloseTo(120_000, 6);
    const b = rangeOverBands(
      compileFormula("1000 * p * m * d * (w / 12)"),
      tri.model,
      full,
    );
    expect(formatUsdExact(b.low)).toBe("$18,975");
    expect(formatUsdExact(b.high)).toBe("$126,500");
    const total = rangeOverBands(tree, tri.model, full);
    expect(formatUsdExact(total.low)).toBe("$33,975");
    expect(formatUsdExact(total.high)).toBe("$246,500");
    expect(roundTo(total.low, 5_000)).toBe(35_000);
    expect(roundTo(total.high, 5_000)).toBe(245_000);
  });

  it("collapses to one component under each preset", () => {
    const rZero = rangeOverBands(tree, tri.model, {
      ...full,
      r: { low: 0, high: 0 },
    });
    expect(rZero.low).toBeCloseTo(18_975, 6);
    expect(rZero.high).toBeCloseTo(126_500, 6);
    const wZero = rangeOverBands(tree, tri.model, {
      ...full,
      w: { low: 0, high: 0 },
    });
    expect(wZero.low).toBeCloseTo(15_000, 6);
    expect(wZero.high).toBeCloseTo(120_000, 6);
  });

  it("scales the EXACT range and rounds once, at the relay's locked volumes", () => {
    const exact = rangeOverBands(tree, tri.model, full);
    expect(displayedAtVolume(exact, 500, 1_000, 5_000)).toEqual({
      low: 15_000,
      high: 125_000,
    });
    expect(formatUsdExact(scaleToVolume(exact, 500, 1_000).low)).toBe(
      "$16,987.50",
    );
    expect(displayedAtVolume(exact, 2_000, 1_000, 5_000)).toEqual({
      low: 70_000,
      high: 495_000,
    });
    // N = 5,000 lands on an exact halfway tie at the high end: 1,232,500.
    // Half up, per RELAY-TRI-1a: $1,235,000, never $1,230,000.
    expect(formatUsdExact(scaleToVolume(exact, 5_000, 1_000).high)).toBe(
      "$1,232,500",
    );
    expect(displayedAtVolume(exact, 5_000, 1_000, 5_000)).toEqual({
      low: 170_000,
      high: 1_235_000,
    });
  });

  it("displays round-to-step of the exact scaled value, for any volume, in every state", () => {
    const bandSets = [
      full,
      { ...full, r: { low: 0, high: 0 } },
      { ...full, w: { low: 0, high: 0 } },
    ];
    let seed = 23;
    const rand = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    const volumes = [1, 250, 500, 1_000, 2_000, 5_000, 12_345];
    for (let i = 0; i < 200; i += 1)
      volumes.push(1 + Math.floor(rand() * 499_999));
    for (const bands of bandSets) {
      const exact = rangeOverBands(tree, tri.model, bands);
      for (const n of volumes) {
        const shown = displayedAtVolume(exact, n, 1_000, tri.model.roundTo);
        expect(shown.low).toBe(
          roundTo((exact.low * n) / 1_000, tri.model.roundTo),
        );
        expect(shown.high).toBe(
          roundTo((exact.high * n) / 1_000, tri.model.roundTo),
        );
      }
    }
  });

  it("keeps the rework log consistent: rows sum to the total row, to the cent", () => {
    const ledger = tri.proposal.ledger!;
    const cents = (t: string) =>
      Math.round(Number(t.replace(/[$,]/g, "")) * 100);
    const sum = ledger.rows.reduce((acc, row) => acc + cents(row.cells[3]!), 0);
    expect(sum).toBe(cents(ledger.total!.value!));
    expect(cents(ledger.total!.value!)).toBe(674_500);
  });

  it("quotes the letter and relay word for word where the page overlaps them", () => {
    expect(tri.hero.heading).toBe(
      "Trifecta Medical, a cost model sent for correction",
    );
    expect(tri.hero.subline).toBe(
      "Exact computed endpoints: $33,975.00 and $246,500.00, rounded to the nearest $5,000 for display.",
    );
    expect(tri.proposal.lead).toBe(
      "The proposal is deliberately small. In three to four weeks, for a fixed fee between $5,000 and $7,500, we would measure four numbers from your records: the rework rate and its cost by cause, what your fixed quotes absorbed, waiting time against your published working time at each approval, and the launch share of your order book. Read-only; we work from exports, and nothing touches your quality system.",
    );
    expect(tri.proposal.promise).toBe(
      "If your records show our printed range overstated your exposure, our findings letter says so in those words.",
    );
    expect(tri.model.callout).toBe(
      "You publish working days per tray layer. Nobody in this trade, you included, publishes the calendar days a layer waits at each customer approval. If the calendar beyond your published working days is customer approvals, that is your customers' time, and worth showing them.",
    );
    expect(tri.model.constants[0]?.text).toContain("This one is not a slider.");
    expect(tri.model.formulaText).toContain("(months / 12)");
  });

  it("holds its heading's height through the font swap on phones", () => {
    // Fraunces sets the heading in three lines up to 380px and two up to
    // 688px; the fallback face changes at 336 and 612, so without the
    // reservation the page moved when the font arrived.
    expect(tri.hero.headingLines).toEqual([
      { upTo: 380, lines: 3 },
      { upTo: 688, lines: 2 },
    ]);
  });

  it("carries none of the kill-list terms anywhere in its copy", () => {
    const text = JSON.stringify(tri);
    for (const term of [
      "\u2013",
      "\u2014",
      "artificial intelligence",
      "machine learning",
      "chatbot",
      "Arcamed",
      "father",
      "handed",
      "100+ years",
      "100 years",
      "nesting",
      "IoT",
      "$300,000",
      "Bestat",
      "Colorado",
      "James",
    ]) {
      expect(text.includes(term), term).toBe(false);
    }
    expect(/\bAI\b/.test(text), "AI as a word").toBe(false);
  });
});

describe("Copper Mountain model", () => {
  const cmt = allDashboards().find((d) => d.slug === "cmt")!;
  const tree = compileFormula(totalFormula(cmt.model.terms));
  const full = restBands(cmt.model.sliders);

  it("computes the locked endpoints to the cent at the letter's assumptions", () => {
    const a = rangeOverBands(compileFormula("100 * h * rate"), cmt.model, full);
    expect(a.low).toBeCloseTo(19_000, 6);
    expect(a.high).toBeCloseTo(78_000, 6);
    const b = rangeOverBands(
      compileFormula("100 * p * m * d * (w / 12)"),
      cmt.model,
      full,
    );
    expect(formatUsdExact(b.low)).toBe("$35,775");
    expect(formatUsdExact(b.high)).toBe("$190,800");
    const total = rangeOverBands(tree, cmt.model, full);
    expect(formatUsdExact(total.low)).toBe("$54,775");
    expect(formatUsdExact(total.high)).toBe("$268,800");
    expect(roundTo(total.low, 5_000)).toBe(55_000);
    expect(roundTo(total.high, 5_000)).toBe(270_000);
  });

  it("collapses to one component under each preset", () => {
    const hZero = rangeOverBands(tree, cmt.model, {
      ...full,
      h: { low: 0, high: 0 },
    });
    expect(hZero.low).toBeCloseTo(35_775, 6);
    expect(hZero.high).toBeCloseTo(190_800, 6);
    const wZero = rangeOverBands(tree, cmt.model, {
      ...full,
      w: { low: 0, high: 0 },
    });
    expect(wZero.low).toBeCloseTo(19_000, 6);
    expect(wZero.high).toBeCloseTo(78_000, 6);
  });

  it("scales the EXACT range and rounds once, at the relay's locked volumes", () => {
    const exact = rangeOverBands(tree, cmt.model, full);
    expect(formatUsdExact(scaleToVolume(exact, 50, 100).low)).toBe(
      "$27,387.50",
    );
    expect(formatUsdExact(scaleToVolume(exact, 50, 100).high)).toBe("$134,400");
    expect(displayedAtVolume(exact, 50, 100, 5_000)).toEqual({
      low: 25_000,
      high: 135_000,
    });
    expect(displayedAtVolume(exact, 250, 100, 5_000)).toEqual({
      low: 135_000,
      high: 670_000,
    });
    expect(displayedAtVolume(exact, 500, 100, 5_000)).toEqual({
      low: 275_000,
      high: 1_345_000,
    });
  });

  it("displays round-to-step of the exact scaled value, for any volume, in every state", () => {
    const bandSets = [
      full,
      { ...full, h: { low: 0, high: 0 } },
      { ...full, w: { low: 0, high: 0 } },
    ];
    let seed = 31;
    const rand = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    const volumes = [1, 50, 100, 250, 500, 4_321];
    for (let i = 0; i < 200; i += 1)
      volumes.push(1 + Math.floor(rand() * 99_999));
    for (const bands of bandSets) {
      const exact = rangeOverBands(tree, cmt.model, bands);
      for (const n of volumes) {
        const shown = displayedAtVolume(exact, n, 100, cmt.model.roundTo);
        expect(shown.low).toBe(
          roundTo((exact.low * n) / 100, cmt.model.roundTo),
        );
        expect(shown.high).toBe(
          roundTo((exact.high * n) / 100, cmt.model.roundTo),
        );
      }
    }
  });

  it("keeps the hours log consistent: hours times rate per row, both totals to the cent", () => {
    const ledger = cmt.proposal.ledger!;
    const cents = (t: string) =>
      Math.round(Number(t.replace(/[$,]/g, "")) * 100);
    let hours = 0;
    let cost = 0;
    for (const row of ledger.rows) {
      const [, h, rate, rowCost] = row.cells as [
        string,
        string,
        string,
        string,
      ];
      expect(cents(rowCost)).toBe(Math.round(Number(h) * cents(rate)));
      hours += Number(h) * 100;
      cost += cents(rowCost);
    }
    expect(hours).toBe(2_125);
    expect(cost).toBe(243_375);
    expect(ledger.total!.cells).toEqual(["21.25 h", "", "$2,433.75"]);
  });

  it("quotes the relay word for word where the page overlaps it", () => {
    expect(cmt.hero.heading).toBe(
      "Copper Mountain Technologies, a cost model sent for correction",
    );
    expect(cmt.hero.subline).toBe(
      "Exact computed endpoints: $54,775.00 and $268,800.00, rounded to the nearest $5,000 for display.",
    );
    expect(cmt.model.callout).toBe(
      "You publish your prices. Nobody in this trade publishes the engineering hours that ship free with every analyzer sold. If those hours are your differentiator, they deserve a price tag, or a proof that zero is the right one.",
    );
    expect(cmt.proposal.promise).toBe(
      "If your records show our printed range overstated your exposure, our findings letter says so in those words.",
    );
    expect(cmt.model.constants[0]?.text).toContain("This one is not a slider.");
    expect(cmt.model.formulaText).toContain("(months / 12)");
    expect(cmt.respect?.paragraphs[5]).toContain("NASA published the paper");
  });

  it("holds its heading's height through the font swap on phones", () => {
    // Fraunces sets the heading in four lines up to 380px and three up to
    // 465px; the fallback face changes at 336 and 416, so without the
    // reservation the page moved when the font arrived.
    expect(cmt.hero.headingLines).toEqual([
      { upTo: 380, lines: 4 },
      { upTo: 465, lines: 3 },
    ]);
  });

  it("carries none of the kill-list terms anywhere in its copy", () => {
    const text = JSON.stringify(cmt);
    for (const term of [
      "\u2013",
      "\u2014",
      "artificial intelligence",
      "machine learning",
      "chatbot",
      "Keysight",
      "Rohde",
      "Anritsu",
      "Planar",
      "Russia",
      "Cyprus",
      "Jared",
      "Ildar",
      "Hirasawa",
      "Mathrubootham",
      "$17,000",
      "founder",
      "firmware",
    ]) {
      expect(text.includes(term), term).toBe(false);
    }
    expect(/\bAI\b/.test(text), "AI as a word").toBe(false);
  });
});

describe("MSP model", () => {
  const msp = allDashboards().find((d) => d.slug === "msp")!;
  const tree = compileFormula(totalFormula(msp.model.terms));
  const full = restBands(msp.model.sliders);

  it("computes the locked endpoints to the cent at the letter's assumptions", () => {
    const a = rangeOverBands(compileFormula("100 * r * v"), msp.model, full);
    expect(a.low).toBeCloseTo(6_000, 6);
    expect(a.high).toBeCloseTo(45_000, 6);
    const b = rangeOverBands(
      compileFormula("100 * v * m * d * (w / 12)"),
      msp.model,
      full,
    );
    expect(formatUsdExact(b.low)).toBe("$3,162.50");
    expect(formatUsdExact(b.high)).toBe("$45,540");
    const total = rangeOverBands(tree, msp.model, full);
    expect(formatUsdExact(total.low)).toBe("$9,162.50");
    expect(formatUsdExact(total.high)).toBe("$90,540");
    expect(roundTo(total.low, 5_000)).toBe(10_000);
    expect(roundTo(total.high, 5_000)).toBe(90_000);
  });

  it("collapses to one component under each preset", () => {
    const rZero = rangeOverBands(tree, msp.model, {
      ...full,
      r: { low: 0, high: 0 },
    });
    expect(rZero.low).toBeCloseTo(3_162.5, 6);
    expect(rZero.high).toBeCloseTo(45_540, 6);
    const wZero = rangeOverBands(tree, msp.model, {
      ...full,
      w: { low: 0, high: 0 },
    });
    expect(wZero.low).toBeCloseTo(6_000, 6);
    expect(wZero.high).toBeCloseTo(45_000, 6);
  });

  it("scales the EXACT range and rounds once, at the relay's locked volumes", () => {
    const exact = rangeOverBands(tree, msp.model, full);
    expect(formatUsdExact(scaleToVolume(exact, 50, 100).low)).toBe("$4,581.25");
    expect(displayedAtVolume(exact, 50, 100, 5_000)).toEqual({
      low: 5_000,
      high: 45_000,
    });
    expect(displayedAtVolume(exact, 250, 100, 5_000)).toEqual({
      low: 25_000,
      high: 225_000,
    });
    expect(displayedAtVolume(exact, 500, 100, 5_000)).toEqual({
      low: 45_000,
      high: 455_000,
    });
  });

  it("displays round-to-step of the exact scaled value, for any volume, in every state", () => {
    const bandSets = [
      full,
      { ...full, r: { low: 0, high: 0 } },
      { ...full, w: { low: 0, high: 0 } },
    ];
    let seed = 37;
    const rand = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    const volumes = [1, 50, 100, 250, 500, 8_642];
    for (let i = 0; i < 200; i += 1)
      volumes.push(1 + Math.floor(rand() * 99_999));
    for (const bands of bandSets) {
      const exact = rangeOverBands(tree, msp.model, bands);
      for (const n of volumes) {
        const shown = displayedAtVolume(exact, n, 100, msp.model.roundTo);
        expect(shown.low).toBe(
          roundTo((exact.low * n) / 100, msp.model.roundTo),
        );
        expect(shown.high).toBe(
          roundTo((exact.high * n) / 100, msp.model.roundTo),
        );
      }
    }
  });

  it("keeps the rework log consistent: rows sum to the total row, to the cent", () => {
    const ledger = msp.proposal.ledger!;
    const cents = (t: string) =>
      Math.round(Number(t.replace(/[$,]/g, "")) * 100);
    const sum = ledger.rows.reduce((acc, row) => acc + cents(row.cells[2]!), 0);
    expect(sum).toBe(cents(ledger.total!.value!));
    expect(sum).toBe(369_950);
  });

  it("quotes the relay word for word where the page overlaps it", () => {
    expect(msp.hero.heading).toBe(
      "MSP Manufacturing, a cost model sent for correction",
    );
    expect(msp.hero.subline).toBe(
      "Exact computed endpoints: $9,162.50 and $90,540.00, rounded to the nearest $5,000 for display.",
    );
    expect(msp.model.callout).toContain(
      "Those numbers exist in your records, unread.",
    );
    expect(msp.respect?.paragraphs[1]).toContain(
      "NADCAP, AS9100, ISO 9001, ITAR, Boeing, FAA",
    );
    expect(msp.model.constants[0]?.text).toContain("This one is not a slider.");
    expect(msp.model.formulaText).toContain("(months / 12)");
    expect(msp.proposal.promise).toBe(
      "If your records show our printed range overstated your exposure, our findings letter says so in those words.",
    );
  });

  it("holds its heading's height through the font swap", () => {
    // Fraunces sets the heading in four lines up to 319px, three up to 400px,
    // two up to 739px, and two again from 993px to 1023px; the fallback face
    // changes at 364 and 660 and stays on one line from 993px, so without the
    // reservation the page moved when the font arrived.
    expect(msp.hero.headingLines).toEqual([
      { upTo: 319, lines: 4 },
      { upTo: 400, lines: 3 },
      { upTo: 739, lines: 2 },
      { upTo: 992, lines: 1 },
      { upTo: 1023, lines: 2 },
    ]);
  });

  it("carries none of the kill-list terms anywhere in its copy", () => {
    const text = JSON.stringify(msp);
    for (const term of [
      "\u2013",
      "\u2014",
      "artificial intelligence",
      "machine learning",
      "chatbot",
      "father",
      "handed",
      "Cummins",
      "15,000",
      "SWAT",
      "law enforcement",
      "Operation Phoenix",
      "James",
    ]) {
      expect(text.includes(term), term).toBe(false);
    }
    expect(/\bAI\b/.test(text), "AI as a word").toBe(false);
  });
});

describe("Catalyst model", () => {
  const cat = allDashboards().find((d) => d.slug === "catalyst")!;
  const tree = compileFormula(totalFormula(cat.model.terms));
  const full = restBands(cat.model.sliders);

  it("computes the locked endpoints to the cent at the letter's assumptions", () => {
    const a = rangeOverBands(compileFormula("10 * i * c"), cat.model, full);
    expect(a.low).toBeCloseTo(8_000, 6);
    expect(a.high).toBeCloseTo(48_000, 6);
    const b = rangeOverBands(
      compileFormula("10 * t * m * d * (w / 12)"),
      cat.model,
      full,
    );
    expect(formatUsdExact(b.low)).toBe("$3,137.50");
    expect(formatUsdExact(b.high)).toBe("$26,355");
    const total = rangeOverBands(tree, cat.model, full);
    expect(formatUsdExact(total.low)).toBe("$11,137.50");
    expect(formatUsdExact(total.high)).toBe("$74,355");
    // The display's low end understates the exact low; the subline discloses it.
    expect(roundTo(total.low, 5_000)).toBe(10_000);
    expect(roundTo(total.high, 5_000)).toBe(75_000);
  });

  it("collapses to one component under each preset", () => {
    const iZero = rangeOverBands(tree, cat.model, {
      ...full,
      i: { low: 0, high: 0 },
    });
    expect(iZero.low).toBeCloseTo(3_137.5, 6);
    expect(iZero.high).toBeCloseTo(26_355, 6);
    const wZero = rangeOverBands(tree, cat.model, {
      ...full,
      w: { low: 0, high: 0 },
    });
    expect(wZero.low).toBeCloseTo(8_000, 6);
    expect(wZero.high).toBeCloseTo(48_000, 6);
  });

  it("scales the EXACT range and rounds once, at the relay's locked volumes", () => {
    const exact = rangeOverBands(tree, cat.model, full);
    expect(formatUsdExact(scaleToVolume(exact, 5, 10).low)).toBe("$5,568.75");
    expect(formatUsdExact(scaleToVolume(exact, 5, 10).high)).toBe("$37,177.50");
    expect(displayedAtVolume(exact, 5, 10, 5_000)).toEqual({
      low: 5_000,
      high: 35_000,
    });
    expect(displayedAtVolume(exact, 20, 10, 5_000)).toEqual({
      low: 20_000,
      high: 150_000,
    });
    expect(displayedAtVolume(exact, 50, 10, 5_000)).toEqual({
      low: 55_000,
      high: 370_000,
    });
  });

  it("displays round-to-step of the exact scaled value, for any volume, in every state", () => {
    const bandSets = [
      full,
      { ...full, i: { low: 0, high: 0 } },
      { ...full, w: { low: 0, high: 0 } },
    ];
    let seed = 41;
    const rand = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    const volumes = [1, 5, 10, 20, 50, 777];
    for (let i = 0; i < 200; i += 1)
      volumes.push(1 + Math.floor(rand() * 9_999));
    for (const bands of bandSets) {
      const exact = rangeOverBands(tree, cat.model, bands);
      for (const n of volumes) {
        const shown = displayedAtVolume(exact, n, 10, cat.model.roundTo);
        expect(shown.low).toBe(
          roundTo((exact.low * n) / 10, cat.model.roundTo),
        );
        expect(shown.high).toBe(
          roundTo((exact.high * n) / 10, cat.model.roundTo),
        );
      }
    }
  });

  it("keeps the absorbed-iterations log consistent: rows sum to the total row, to the cent", () => {
    const ledger = cat.proposal.ledger!;
    const cents = (t: string) =>
      Math.round(Number(t.replace(/[$,]/g, "")) * 100);
    const sum = ledger.rows.reduce((acc, row) => acc + cents(row.cells[2]!), 0);
    expect(sum).toBe(cents(ledger.total!.value!));
    expect(sum).toBe(1_877_000);
  });

  it("quotes the relay word for word where the page overlaps it", () => {
    expect(cat.hero.heading).toBe("Catalyst, a cost model sent for correction");
    expect(cat.hero.subline).toBe(
      "Exact computed endpoints: $11,137.50 and $74,355.00, rounded to the nearest $5,000 for display.",
    );
    expect(cat.model.callout).toContain(
      "If the waiting belongs to clients, it is worth showing them.",
    );
    expect(cat.respect?.paragraphs[3]).toContain("$159,500 readiness grant");
    expect(cat.model.constants[0]?.text).toContain("This one is not a slider.");
    expect(cat.model.formulaText).toContain("(months / 12)");
    expect(cat.proposal.promise).toBe(
      "If your records show our printed range overstated your exposure, our findings letter says so in those words.",
    );
  });

  it("holds its heading's height through the font swap", () => {
    // Fraunces sets the heading in three lines up to 331px and two up to
    // 582px; the fallback face sets two lines up to 517px and one above, so
    // without the reservation the page moved when the font arrived.
    expect(cat.hero.headingLines).toEqual([
      { upTo: 331, lines: 3 },
      { upTo: 582, lines: 2 },
    ]);
  });

  it("carries none of the kill-list terms anywhere in its copy", () => {
    const text = JSON.stringify(cat);
    for (const term of [
      "\u2013",
      "\u2014",
      "artificial intelligence",
      "machine learning",
      "chatbot",
      "Insects",
      "Greenline",
      "FormLabs",
      "Navistar",
      "28,000",
      "father",
      "handed",
    ]) {
      expect(text.includes(term), term).toBe(false);
    }
    expect(/\bAI\b/.test(text), "AI as a word").toBe(false);
  });
});

describe("Circle Beverage model", () => {
  const cir = allDashboards().find((d) => d.slug === "circle")!;
  const tree = compileFormula(totalFormula(cir.model.terms));
  const full = restBands(cir.model.sliders);

  it("computes the locked endpoints to the cent at the letter's assumptions", () => {
    // A divides by a slider (cans per run): the corner evaluation is exact
    // because the formula is monotone in each variable separately.
    const a = rangeOverBands(
      compileFormula("(1000000 / r) * h * l"),
      cir.model,
      full,
    );
    expect(a.low).toBeCloseTo(2_500, 6);
    expect(a.high).toBeCloseTo(60_000, 6);
    const b = rangeOverBands(
      compileFormula("1000000 * c * d * (w / 12)"),
      cir.model,
      full,
    );
    expect(formatUsdExact(b.low)).toBe("$6,420");
    expect(formatUsdExact(b.high)).toBe("$26,750");
    const total = rangeOverBands(tree, cir.model, full);
    expect(total.low).toBeCloseTo(8_920, 6);
    expect(total.high).toBeCloseTo(86_750, 6);
    // The display low overstates the exact low by 12.1%; the subline
    // states both exact endpoints, as the letter does.
    expect(roundTo(total.low, 5_000)).toBe(10_000);
    expect(roundTo(total.high, 5_000)).toBe(85_000);
  });

  it("collapses to one component under each preset, half up at the exact tie", () => {
    // w=0 leaves changeovers only: the exact low, $2,500.00, sits exactly
    // halfway between $0 and $5,000. Half up, per RELAY-TRI-1a: it displays
    // $5,000, and the computed line shows the exact figure beside it.
    const wZero = rangeOverBands(tree, cir.model, {
      ...full,
      w: { low: 0, high: 0 },
    });
    expect(wZero.low).toBeCloseTo(2_500, 6);
    expect(wZero.high).toBeCloseTo(60_000, 6);
    expect(roundTo(wZero.low, 5_000)).toBe(5_000);
    expect(roundTo(wZero.high, 5_000)).toBe(60_000);
    const hZero = rangeOverBands(tree, cir.model, {
      ...full,
      h: { low: 0, high: 0 },
    });
    expect(hZero.low).toBeCloseTo(6_420, 6);
    expect(hZero.high).toBeCloseTo(26_750, 6);
    expect(roundTo(hZero.low, 5_000)).toBe(5_000);
    expect(roundTo(hZero.high, 5_000)).toBe(25_000);
  });

  it("scales the EXACT range and rounds once, at the relay's locked volumes", () => {
    const exact = rangeOverBands(tree, cir.model, full);
    expect(formatUsdExact(scaleToVolume(exact, 500_000, 1_000_000).low)).toBe(
      "$4,460",
    );
    expect(formatUsdExact(scaleToVolume(exact, 500_000, 1_000_000).high)).toBe(
      "$43,375",
    );
    expect(displayedAtVolume(exact, 500_000, 1_000_000, 5_000)).toEqual({
      low: 5_000,
      high: 45_000,
    });
    expect(displayedAtVolume(exact, 2_000_000, 1_000_000, 5_000)).toEqual({
      low: 20_000,
      high: 175_000,
    });
    expect(displayedAtVolume(exact, 5_000_000, 1_000_000, 5_000)).toEqual({
      low: 45_000,
      high: 435_000,
    });
  });

  it("displays round-to-step of the exact scaled value, for any volume, in every state", () => {
    const bandSets = [
      full,
      { ...full, h: { low: 0, high: 0 } },
      { ...full, w: { low: 0, high: 0 } },
    ];
    let seed = 47;
    const rand = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    const volumes = [
      1_000, 250_000, 500_000, 1_000_000, 2_000_000, 5_000_000, 12_345_678,
    ];
    for (let i = 0; i < 200; i += 1)
      volumes.push(1_000 + Math.floor(rand() * 49_999_000));
    for (const bands of bandSets) {
      const exact = rangeOverBands(tree, cir.model, bands);
      for (const n of volumes) {
        const shown = displayedAtVolume(exact, n, 1_000_000, cir.model.roundTo);
        expect(shown.low).toBe(
          roundTo((exact.low * n) / 1_000_000, cir.model.roundTo),
        );
        expect(shown.high).toBe(
          roundTo((exact.high * n) / 1_000_000, cir.model.roundTo),
        );
      }
    }
  });

  it("keeps the changeover log consistent: hours times rate per row, both totals to the cent", () => {
    const ledger = cir.proposal.ledger!;
    const cents = (t: string) =>
      Math.round(Number(t.replace(/[$,]/g, "")) * 100);
    let hours = 0;
    let cost = 0;
    for (const row of ledger.rows) {
      const [, h, rate, rowCost] = row.cells as [
        string,
        string,
        string,
        string,
      ];
      expect(cents(rowCost)).toBe(Math.round(Number(h) * cents(rate)));
      hours += Math.round(Number(h) * 100);
      cost += cents(rowCost);
    }
    expect(hours).toBe(2_150);
    expect(cost).toBe(446_500);
    expect(ledger.total!.cells).toEqual(["21.5 h", "", "$4,465.00"]);
    // The footnote's ratio is arithmetic, not color: worst / best = 4.5.
    expect(cents("$1,440.00") / cents("$320.00")).toBe(4.5);
  });

  it("quotes the relay word for word where the page overlaps it", () => {
    expect(cir.token).toBe("circle-beverage-3ccf29b014");
    expect(cir.hero.heading).toBe(
      "Circle Beverage, a cost model sent for correction",
    );
    expect(cir.hero.subline).toBe(
      "Exact computed endpoints: $8,920.00 and $86,750.00, rounded to the nearest $5,000 for display; the rounding widens the low end, so the exact figures govern.",
    );
    expect(cir.model.callout).toContain(
      "Those numbers exist in your records, unread.",
    );
    expect(cir.model.constants[0]?.text).toContain(
      "the latest month published",
    );
    expect(cir.model.constants[0]?.text).toContain("Next update October 15.");
    expect(cir.model.constants[0]?.note).toBe(
      "When the October update lands, this page's number changes with it, whichever direction it moves.",
    );
    expect(cir.respect?.paragraphs[1]).toContain(
      "under 2 million, 2 to 5 million, 5 to 15 million, and above 15 million",
    );
    expect(cir.respect?.paragraphs[4]).toContain("we only win if you win");
    expect(cir.model.formulaText).toContain("(months / 12)");
    expect(cir.proposal.promise).toBe(
      "If your records show our printed range overstated your exposure, our findings letter says so in those words.",
    );
  });

  it("holds its heading's height through the font swap", () => {
    // Fraunces sets the heading in three lines up to 380px and two up to
    // 679px; the fallback face changes at 336 and 604, so without the
    // reservation the page moved when the font arrived.
    expect(cir.hero.headingLines).toEqual([
      { upTo: 380, lines: 3 },
      { upTo: 679, lines: 2 },
    ]);
  });

  it("carries none of the kill-list terms anywhere in its copy", () => {
    const text = JSON.stringify(cir);
    for (const term of [
      "\u2013",
      "\u2014",
      "artificial intelligence",
      "machine learning",
      "chatbot",
      "kombucha",
      "Sonorans",
      "$20,000",
      "employee",
      "headcount",
    ]) {
      expect(text.includes(term), term).toBe(false);
    }
    expect(/\bAI\b/.test(text), "AI as a word").toBe(false);
    // "robot" in any form, per the relay: the page says "machines".
    expect(/robot/i.test(text), "robot in any form").toBe(false);
    // "alcohol" is scanned as a word. The relay's own final copy contains
    // "Non alcoholic" in changeover row 3, so a substring scan is
    // unsatisfiable against final copy; the ban reads on the word itself,
    // with "spirits" as the page's term. Interpretation disclosed in
    // RELAY-CIR-2 for the founder's ruling.
    expect(/\balcohol\b/i.test(text), "alcohol as a word").toBe(false);
  });
});

describe("Insects Limited model", () => {
  const ins = allDashboards().find((d) => d.slug === "insects")!;
  const tree = compileFormula(totalFormula(ins.model.terms));
  const full = restBands(ins.model.sliders);

  it("computes the locked endpoints to the cent at the letter's assumptions", () => {
    const a = rangeOverBands(compileFormula("h * rate"), ins.model, full);
    expect(a.low).toBeCloseTo(10_500, 6);
    expect(a.high).toBeCloseTo(48_000, 6);
    const b = rangeOverBands(compileFormula("1000000 * g"), ins.model, full);
    expect(b.low).toBeCloseTo(10_000, 6);
    expect(b.high).toBeCloseTo(40_000, 6);
    const total = rangeOverBands(tree, ins.model, full);
    expect(formatUsdExact(total.low)).toBe("$20,500");
    expect(formatUsdExact(total.high)).toBe("$88,000");
    expect(roundTo(total.low, 5_000)).toBe(20_000);
    expect(roundTo(total.high, 5_000)).toBe(90_000);
  });

  it("collapses to one component under each preset", () => {
    const hZero = rangeOverBands(tree, ins.model, {
      ...full,
      h: { low: 0, high: 0 },
    });
    expect(hZero.low).toBeCloseTo(10_000, 6);
    expect(hZero.high).toBeCloseTo(40_000, 6);
    const gZero = rangeOverBands(tree, ins.model, {
      ...full,
      g: { low: 0, high: 0 },
    });
    expect(gZero.low).toBeCloseTo(10_500, 6);
    expect(gZero.high).toBeCloseTo(48_000, 6);
  });

  it("pins the five-million-dollar tie: $102,500 rounds half up to $105,000", () => {
    // RELAY-IA-1's mandatory pinned tie: 102,500 / 5,000 = 20.5 exactly.
    // Half up, per RELAY-TRI-1a: the display is $105,000, never $100,000.
    const exact = rangeOverBands(tree, ins.model, full);
    const five = scaleToVolume(exact, 5_000_000, 1_000_000);
    expect(formatUsdExact(five.low)).toBe("$102,500");
    expect(roundTo(five.low, 5_000)).toBe(105_000);
    expect(displayedAtVolume(exact, 5_000_000, 1_000_000, 5_000)).toEqual({
      low: 105_000,
      high: 440_000,
    });
  });

  it("scales the EXACT range and rounds once, at the relay's locked volumes", () => {
    const exact = rangeOverBands(tree, ins.model, full);
    expect(formatUsdExact(scaleToVolume(exact, 250_000, 1_000_000).low)).toBe(
      "$5,125",
    );
    expect(displayedAtVolume(exact, 250_000, 1_000_000, 5_000)).toEqual({
      low: 5_000,
      high: 20_000,
    });
    expect(displayedAtVolume(exact, 2_000_000, 1_000_000, 5_000)).toEqual({
      low: 40_000,
      high: 175_000,
    });
  });

  it("displays round-to-step of the exact scaled value, for any volume, in every state", () => {
    const bandSets = [
      full,
      { ...full, h: { low: 0, high: 0 } },
      { ...full, g: { low: 0, high: 0 } },
    ];
    let seed = 53;
    const rand = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    const volumes = [
      1_000, 250_000, 1_000_000, 2_000_000, 5_000_000, 77_777_777,
    ];
    for (let i = 0; i < 200; i += 1)
      volumes.push(1_000 + Math.floor(rand() * 99_999_000));
    for (const bands of bandSets) {
      const exact = rangeOverBands(tree, ins.model, bands);
      for (const n of volumes) {
        const shown = displayedAtVolume(exact, n, 1_000_000, ins.model.roundTo);
        expect(shown.low).toBe(
          roundTo((exact.low * n) / 1_000_000, ins.model.roundTo),
        );
        expect(shown.high).toBe(
          roundTo((exact.high * n) / 1_000_000, ins.model.roundTo),
        );
      }
    }
  });

  it("keeps the expert-hours log consistent: hours times rate per row, both totals to the cent", () => {
    const ledger = ins.proposal.ledger!;
    const cents = (t: string) =>
      Math.round(Number(t.replace(/[$,]/g, "")) * 100);
    let hours = 0;
    let cost = 0;
    for (const row of ledger.rows) {
      const [, , h, rate, rowCost] = row.cells as [
        string,
        string,
        string,
        string,
        string,
      ];
      expect(cents(rowCost)).toBe(Math.round(Number(h) * cents(rate)));
      hours += Math.round(Number(h) * 100);
      cost += cents(rowCost);
    }
    expect(hours).toBe(500);
    expect(cost).toBe(49_625);
    expect(ledger.total!.cells).toEqual(["5.0 h", "", "$496.25"]);
  });

  it("quotes the relay word for word where the page overlaps it, disclosure included", () => {
    expect(ins.token).toBe("insects-limited-6c95a80d07");
    expect(ins.hero.heading).toBe(
      "Insects Limited, a cost model sent for correction",
    );
    expect(ins.model.constants).toHaveLength(0);
    expect(ins.model.disclosure).toBe(
      "This model contains no federal number. We checked the chemical price indexes and none maps truthfully onto pheromone synthesis; the industrial chemicals index has barely moved this year. Every figure on this page is our assumption, printed to be corrected.",
    );
    expect(ins.model.callout).toContain(
      "Those numbers exist in your records, unread.",
    );
    expect(ins.respect?.paragraphs[4]).toContain("95.8 percent accuracy");
    expect(ins.sources[2]).toBe(
      "No federal price series applies cleanly to these inputs, and none is used.",
    );
    expect(ins.proposal.promise).toBe(
      "If your records show our printed range overstated your exposure, our findings letter says so in those words.",
    );
  });

  it("holds its heading's height through the font swap", () => {
    // Fraunces sets the heading in three lines up to 380px and two up to
    // 676px; the fallback face changes at 336 and 599, so without the
    // reservation the page moved when the font arrived.
    expect(ins.hero.headingLines).toEqual([
      { upTo: 380, lines: 3 },
      { upTo: 676, lines: 2 },
    ]);
  });

  it("carries none of the kill-list terms, with toxic exactly once in the founding sentence", () => {
    const text = JSON.stringify(ins);
    for (const term of [
      "\u2013",
      "\u2014",
      "artificial intelligence",
      "machine learning",
      "chatbot",
      "SightTrap",
      "Skyhawk",
      "camera",
      "software",
      "Catalyst",
      "Fumigation",
      "failure",
      "father",
      "handed",
      "Univar",
      "Veseris",
      "1982",
    ]) {
      expect(text.includes(term), term).toBe(false);
    }
    expect(/\bAI\b/.test(text), "AI as a word").toBe(false);
    expect(/robot/i.test(text), "robot in any form").toBe(false);
    // "toxic": exactly once, and only inside the quoted founding sentence.
    expect(text.match(/toxic/g)).toHaveLength(1);
    const founding = ins.respect!.paragraphs[0]!;
    expect(founding).toContain("without the use of toxic chemicals");
    const elsewhere = JSON.stringify({ ...ins, respect: undefined });
    expect(elsewhere.includes("toxic")).toBe(false);
  });
});

describe("A&A Custom Automation model", () => {
  const aa = allDashboards().find((d) => d.slug === "aa")!;
  const tree = compileFormula(totalFormula(aa.model.terms));
  const full = restBands(aa.model.sliders);

  it("computes the locked endpoints to the cent at the letter's assumptions", () => {
    const a = rangeOverBands(compileFormula("10 * i * c"), aa.model, full);
    expect(a.low).toBeCloseTo(18_000, 6);
    expect(a.high).toBeCloseTo(90_000, 6);
    const b = rangeOverBands(
      compileFormula("10 * t * m * d * (w / 12)"),
      aa.model,
      full,
    );
    expect(formatUsdExact(b.low)).toBe("$14,641.67");
    expect(formatUsdExact(b.high)).toBe("$138,050");
    const total = rangeOverBands(tree, aa.model, full);
    expect(formatUsdExact(total.low)).toBe("$32,641.67");
    expect(formatUsdExact(total.high)).toBe("$228,050");
    expect(roundTo(total.low, 5_000)).toBe(35_000);
    expect(roundTo(total.high, 5_000)).toBe(230_000);
  });

  it("collapses to one component under each preset", () => {
    const iZero = rangeOverBands(tree, aa.model, {
      ...full,
      i: { low: 0, high: 0 },
    });
    expect(formatUsdExact(iZero.low)).toBe("$14,641.67");
    expect(iZero.high).toBeCloseTo(138_050, 6);
    const wZero = rangeOverBands(tree, aa.model, {
      ...full,
      w: { low: 0, high: 0 },
    });
    expect(wZero.low).toBeCloseTo(18_000, 6);
    expect(wZero.high).toBeCloseTo(90_000, 6);
  });

  it("scales the EXACT range and rounds once, at the relay's locked volumes", () => {
    const exact = rangeOverBands(tree, aa.model, full);
    expect(formatUsdExact(scaleToVolume(exact, 5, 10).low)).toBe("$16,320.83");
    expect(formatUsdExact(scaleToVolume(exact, 5, 10).high)).toBe("$114,025");
    expect(displayedAtVolume(exact, 5, 10, 5_000)).toEqual({
      low: 15_000,
      high: 115_000,
    });
    expect(formatUsdExact(scaleToVolume(exact, 20, 10).low)).toBe("$65,283.33");
    expect(displayedAtVolume(exact, 20, 10, 5_000)).toEqual({
      low: 65_000,
      high: 455_000,
    });
    expect(formatUsdExact(scaleToVolume(exact, 50, 10).low)).toBe(
      "$163,208.33",
    );
    expect(displayedAtVolume(exact, 50, 10, 5_000)).toEqual({
      low: 165_000,
      high: 1_140_000,
    });
  });

  it("displays round-to-step of the exact scaled value, for any volume, in every state", () => {
    const bandSets = [
      full,
      { ...full, i: { low: 0, high: 0 } },
      { ...full, w: { low: 0, high: 0 } },
    ];
    let seed = 59;
    const rand = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    const volumes = [1, 5, 10, 20, 50, 3_333];
    for (let i = 0; i < 200; i += 1)
      volumes.push(1 + Math.floor(rand() * 9_999));
    for (const bands of bandSets) {
      const exact = rangeOverBands(tree, aa.model, bands);
      for (const n of volumes) {
        const shown = displayedAtVolume(exact, n, 10, aa.model.roundTo);
        expect(shown.low).toBe(roundTo((exact.low * n) / 10, aa.model.roundTo));
        expect(shown.high).toBe(
          roundTo((exact.high * n) / 10, aa.model.roundTo),
        );
      }
    }
  });

  it("keeps the absorbed-loops log consistent: rows sum to the total row, to the cent", () => {
    const ledger = aa.proposal.ledger!;
    const cents = (t: string) =>
      Math.round(Number(t.replace(/[$,]/g, "")) * 100);
    const sum = ledger.rows.reduce((acc, row) => acc + cents(row.cells[2]!), 0);
    expect(sum).toBe(cents(ledger.total!.value!));
    expect(sum).toBe(3_207_500);
  });

  it("quotes the relay word for word where the page overlaps it", () => {
    expect(aa.token).toBe("aa-custom-automation-9480645522");
    expect(aa.hero.heading).toBe(
      "A&A Custom Automation, a cost model sent for correction",
    );
    expect(aa.hero.subline).toBe(
      "Exact computed endpoints: $32,641.67 and $228,050.00, rounded to the nearest $5,000 for display.",
    );
    expect(aa.model.callout).toContain(
      "Those numbers exist in your job records, unread.",
    );
    expect(aa.model.constants[0]?.text).toContain("This one is not a slider.");
    expect(aa.model.constants[0]?.note).toBe(
      "When the October 15 update lands, this page's number changes with it, whichever direction it moves.",
    );
    expect(aa.respect?.paragraphs[3]).toContain(
      "I wish we had 100 suppliers like A&A",
    );
    expect(aa.model.formulaText).toContain("(months / 12)");
    expect(aa.proposal.promise).toBe(
      "If your records show our printed range overstated your exposure, our findings letter says so in those words.",
    );
  });

  it("holds its heading's height through the font swap", () => {
    // Fraunces sets the heading in four lines up to 380px, three up to 440px
    // and two up to 1023px; the fallback face changes at 336, 387 and 723, so
    // without the reservation the page moved when the font arrived.
    expect(aa.hero.headingLines).toEqual([
      { upTo: 380, lines: 4 },
      { upTo: 440, lines: 3 },
      { upTo: 1023, lines: 2 },
    ]);
  });

  it("carries none of the kill-list terms, with the former name exactly once in the formerly bullet", () => {
    const text = JSON.stringify(aa);
    for (const term of [
      "\u2013",
      "\u2014",
      "artificial intelligence",
      "machine learning",
      "chatbot",
      "Plaskolite",
      "Amcor",
      "Cooper",
      "father",
      "handed",
    ]) {
      expect(text.includes(term), term).toBe(false);
    }
    expect(/\bAI\b/.test(text), "AI as a word").toBe(false);
    expect(/robot/i.test(text), "robot in any form").toBe(false);
    // "A&A Metal Products": exactly once, and only inside the formerly bullet.
    expect(text.match(/A&A Metal Products/g)).toHaveLength(1);
    expect(aa.respect!.paragraphs[0]!).toContain(
      "formerly as A&A Metal Products",
    );
    const elsewhere = JSON.stringify({ ...aa, respect: undefined });
    expect(elsewhere.includes("A&A Metal Products")).toBe(false);
  });
});

describe("Dental Ceramics LTD model", () => {
  const dc = allDashboards().find((d) => d.slug === "dentalceramics")!;
  const tree = compileFormula(totalFormula(dc.model.terms));
  const full = restBands(dc.model.sliders);
  const term = (id: string, bands = full) =>
    rangeOverBands(
      compileFormula(dc.model.terms.find((t) => t.id === id)!.formula),
      dc.model,
      bands,
    );

  it("computes the locked endpoints to the cent at the letter's assumptions", () => {
    expect(term("remakes").low).toBeCloseTo(1_200, 6);
    expect(term("remakes").high).toBeCloseTo(14_000, 6);
    expect(term("hours")).toEqual({ low: 5_500, high: 25_500 });
    expect(formatUsdExact(term("metal").low)).toBe("$162");
    expect(formatUsdExact(term("metal").high)).toBe("$1,944");
    const total = rangeOverBands(tree, dc.model, full);
    expect(total.low.toFixed(2)).toBe("6862.00");
    expect(total.high.toFixed(2)).toBe("41444.00");
    expect(roundTo(total.low, 5_000)).toBe(5_000);
    expect(roundTo(total.high, 5_000)).toBe(40_000);
  });

  it("lands each preset on its locked figures", () => {
    // Remakes only: the one preset that sets two sliders, h and m to zero.
    const remakesOnly = dc.model.presets!.items.find(
      (p) => p.label === "Remakes only",
    )!;
    expect(remakesOnly.bands).toEqual({
      h: { low: 0, high: 0 },
      m: { low: 0, high: 0 },
    });
    const only = rangeOverBands(tree, dc.model, {
      ...full,
      ...remakesOnly.bands,
    });
    expect(only.low).toBeCloseTo(1_200, 6);
    expect(only.high).toBeCloseTo(14_000, 6);
    // $1,200 sits below half a step, so the headline low reads $0 while the
    // exact line beside it reads $1,200.
    expect(
      displayedRange(true, only, dc.model.letterRange, 5_000).range,
    ).toEqual({ low: 0, high: 15_000 });
    // Digital intake closes the remake share on 1 percent.
    const r = dc.model.sliders.find((s) => s.id === "r")!;
    expect(r.presets).toEqual([{ label: "Digital intake", low: 1, high: 1 }]);
    const digital = { ...full, r: { low: 1, high: 1 } };
    expect(term("remakes", digital).low).toBeCloseTo(1_200, 6);
    expect(term("remakes", digital).high).toBeCloseTo(3_500, 6);
    // No metal closes the metal share on zero.
    const m = dc.model.sliders.find((s) => s.id === "m")!;
    expect(m.presets).toEqual([{ label: "No metal", low: 0, high: 0 }]);
    const noMetal = rangeOverBands(tree, dc.model, {
      ...full,
      m: { low: 0, high: 0 },
    });
    expect(noMetal.low).toBeCloseTo(6_700, 6);
    expect(noMetal.high).toBeCloseTo(39_500, 6);
  });

  it("rejects a preset that sets a band outside its slider", () => {
    const raw = JSON.parse(JSON.stringify(dc)) as typeof dc;
    raw.model.presets!.items[0]!.bands.m = { low: 0, high: 60 };
    expect(dashboardSchema.safeParse(raw).success).toBe(false);
    raw.model.presets!.items[0]!.bands = { nope: { low: 0, high: 0 } };
    expect(dashboardSchema.safeParse(raw).success).toBe(false);
  });

  it("scales the EXACT range and rounds once, at the relay's locked volumes", () => {
    const exact = rangeOverBands(tree, dc.model, full);
    const locked: [number, string, string, number, number][] = [
      [2_000, "$13,724", "$82,888", 15_000, 85_000],
      [3_500, "$24,017", "$145,054", 25_000, 145_000],
      [5_000, "$34,310", "$207,220", 35_000, 205_000],
    ];
    for (const [n, low, high, shownLow, shownHigh] of locked) {
      const scaled = scaleToVolume(exact, n, 1_000);
      expect(formatUsdExact(scaled.low)).toBe(low);
      expect(formatUsdExact(scaled.high)).toBe(high);
      expect(displayedAtVolume(exact, n, 1_000, 5_000)).toEqual({
        low: shownLow,
        high: shownHigh,
      });
    }
  });

  it("displays round-to-step of the exact scaled value, for any volume, in every state", () => {
    const bandSets = [
      full,
      { ...full, h: { low: 0, high: 0 }, m: { low: 0, high: 0 } },
      { ...full, r: { low: 1, high: 1 } },
      { ...full, m: { low: 0, high: 0 } },
    ];
    let seed = 61;
    const rand = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    const volumes = [1, 500, 1_000, 2_000, 3_500, 5_000, 77_777];
    for (let i = 0; i < 200; i += 1)
      volumes.push(1 + Math.floor(rand() * 99_999));
    for (const bands of bandSets) {
      const exact = rangeOverBands(tree, dc.model, bands);
      for (const n of volumes) {
        const shown = displayedAtVolume(exact, n, 1_000, dc.model.roundTo);
        expect(shown.low).toBe(
          roundTo((exact.low * n) / 1_000, dc.model.roundTo),
        );
        expect(shown.high).toBe(
          roundTo((exact.high * n) / 1_000, dc.model.roundTo),
        );
      }
    }
  });

  it("keeps the remake log consistent: five remakes summing to the total row, to the cent", () => {
    const ledger = dc.proposal.ledger!;
    const cents = (t: string) =>
      Math.round(Number(t.replace(/[$,]/g, "")) * 100);
    expect(ledger.rows).toHaveLength(5);
    const sum = ledger.rows.reduce((acc, row) => acc + cents(row.cells[3]!), 0);
    expect(sum).toBe(cents(ledger.total!.value!));
    expect(sum).toBe(125_000);
    expect(ledger.total!.label).toBe("Total, 5 remakes");
    expect(ledger.rows.map((r) => r.cells[2])).toEqual([
      "Doctor",
      "Doctor",
      "Doctor",
      "Laboratory",
      "Doctor",
    ]);
    expect(ledger.label).toBe("Illustrative, not Dental Ceramics LTD data");
  });

  it("quotes the letter word for word where the page overlaps it, badge included", () => {
    expect(dc.token).toBe("dental-ceramics-d24b353d0a");
    expect(dc.company.name).toBe("Dental Ceramics LTD");
    expect(dc.hero.heading).toBe(
      "Dental Ceramics LTD, a cost model sent for correction",
    );
    expect(dc.model.letterRange).toEqual({ low: 5_000, high: 40_000 });
    expect(dc.hero.subline).toContain("(exact: $6,862 and $41,444)");
    expect(dc.model.disclosure).toBe(
      "This model carries no federal index: none maps onto a ceramics laboratory.",
    );
    expect(dc.model.constants).toEqual([
      {
        id: "d",
        value: 0.081,
        text: "Metal drift uses the public gold price, $4,177 on October 1, 2026 against $3,864 a year earlier (+8.1 percent) [[BENCHMARK]], applied only to metal-bearing units. Zirconia has no public curve and is charged nothing.",
        note: "Palladium: $1,190, down 4.7 percent in a year.",
      },
    ]);
    // $4,177 against $3,864 is +8.10 percent, the published figure used.
    expect(((4_177 / 3_864 - 1) * 100).toFixed(1)).toBe("8.1");
    expect(dc.respect?.paragraphs[0]).toContain(
      "printed the reason in Latin: Non Multa Sed Multum, not many, but much",
    );
    expect(dc.model.callout).toContain(
      "Your remake policy already names seven circumstances where a remake is the doctor's doing rather than yours",
    );
    expect(dc.proposal.deliverables[0]?.title).toBe(
      "Remakes by cause, against your own seven circumstances",
    );
    expect(dc.proposal.fee).toBe("A fixed fee between $1,200 and $1,800.");
    expect(dc.sources.at(-1)).toBe(
      "This page contains no client data of any kind; all figures are public or assumed; nothing here is protected health information.",
    );
  });

  it("holds its heading's height through the font swap", () => {
    // Fraunces sets the heading in three lines up to 416px, two up to 755px,
    // one up to 969px and two again up to 1023px; the fallback face changes
    // at 380 and 676 and stays on one line from there, so without the
    // reservation the page moved when the font arrived.
    expect(dc.hero.headingLines).toEqual([
      { upTo: 416, lines: 3 },
      { upTo: 755, lines: 2 },
      { upTo: 969, lines: 1 },
      { upTo: 1023, lines: 2 },
    ]);
  });

  it("carries none of the kill-list terms anywhere in its copy", () => {
    const text = JSON.stringify(dc);
    for (const term of [
      "–",
      "—",
      "artificial intelligence",
      "machine learning",
      "Glidewell",
      "Dandy",
      "3Shape",
      "exocad",
      "succession",
      "Lavicka",
      "Hansen",
      "McCann",
      "father",
      "handed",
      "part-time",
      "Friday",
      "employee",
    ]) {
      expect(text.toLowerCase().includes(term.toLowerCase()), term).toBe(false);
    }
    expect(/\bAI\b/.test(text), "AI as a word").toBe(false);
    // The client is Dental Ceramics LTD; another company carries the Inc name.
    expect(/\bInc\b/.test(text), "Inc").toBe(false);
    expect(/patient/i.test(text), "any patient term").toBe(false);
  });
});

describe("every template 2 config", () => {
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
        const point = Object.fromEntries([
          ...d.model.sliders.map((s) => [
            s.id,
            s.min + rand() * (s.max - s.min),
          ]),
          ...d.model.spans.map((sp) => [
            sp.id,
            sp.low + rand() * (sp.high - sp.low),
          ]),
        ]);
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
