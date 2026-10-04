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
  roundForDisplay,
  roundTo,
  toCents,
  valueAt,
} from "./model";
import {
  ALLOWED_PATIENT_PHRASE,
  patientTermsOutsideAllowlist,
} from "./kill-scan";
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

describe("small-dollar rounding and cent-first volume scaling", () => {
  const small = { under: 5_000, step: 1_000 };

  it("rounds an exact figure under the threshold to the finer step, half up", () => {
    expect(roundForDisplay(2_911, 5_000, small)).toBe(3_000);
    expect(roundForDisplay(750, 5_000, small)).toBe(1_000);
    expect(roundForDisplay(2_500, 5_000, small)).toBe(3_000);
    expect(roundForDisplay(4_999, 5_000, small)).toBe(5_000);
    expect(roundForDisplay(5_000, 5_000, small)).toBe(5_000);
    expect(roundForDisplay(32_341.64, 5_000, small)).toBe(30_000);
  });

  it("leaves every page without the rule exactly as it rounded before", () => {
    for (const v of [750, 2_911, 3_742, 4_112, 22_500, 32_341.64])
      expect(roundForDisplay(v, 5_000)).toBe(roundTo(v, 5_000));
  });

  it("scales the cent-rounded range when a page asks for it", () => {
    const exact = { low: 2_910.9970029, high: 32_341.6428357 };
    expect(toCents(exact)).toEqual({ low: 2_911, high: 32_341.64 });
    const scaled = scaleToVolume(toCents(exact), 600, 100);
    expect(formatUsdExact(scaled.low)).toBe("$17,466");
    expect(formatUsdExact(scaled.high)).toBe("$194,049.84");
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
    expect(mursix.proposal.deliverables!.map((d) => d.title)[2]).toBe(
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

  it("requires a lead line when a proposal carries no deliverables", () => {
    const raw = JSON.parse(JSON.stringify(dc)) as typeof dc;
    delete raw.proposal.lead;
    expect(dashboardSchema.safeParse(raw).success).toBe(false);
    raw.proposal.lead = "x";
    raw.proposal.deliverablesHeading = "What we measure";
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
    // The proposal strip, word for word from the redone letter's offer. It
    // replaces the four measurements the first letter proposed.
    expect(dc.proposal.lead).toBe(
      "The proposal: the count, the gate at case receipt, and the thirty-day result; fixed fee between $1,200 and $1,800; nothing in your records is changed; no patient information leaves the building.",
    );
    expect(dc.proposal.deliverables).toBeUndefined();
    expect(JSON.stringify(dc)).not.toMatch(/four (numbers|measurements)/i);
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
    // "patient": exactly once, and only inside the proposal strip's privacy
    // clause, which the relay supplies word for word. Nowhere else.
    expect(text.match(/patient/gi)).toHaveLength(1);
    expect(dc.proposal.lead).toContain("no patient information");
    const elsewhere = JSON.stringify({
      ...dc,
      proposal: { ...dc.proposal, lead: undefined },
    });
    expect(/patient/i.test(elsewhere), "any patient term elsewhere").toBe(
      false,
    );
  });
});

describe("Hunter Dental Laboratory model", () => {
  const hu = allDashboards().find((d) => d.slug === "hunter")!;
  const tree = compileFormula(totalFormula(hu.model.terms));
  const full = restBands(hu.model.sliders);
  const term = (id: string, bands = full) =>
    rangeOverBands(
      compileFormula(hu.model.terms.find((t) => t.id === id)!.formula),
      hu.model,
      bands,
    );
  const preset = (label: string) =>
    hu.model.presets!.items.find((p) => p.label === label)!.bands;

  it("computes the locked endpoints to the cent at the letter's assumptions", () => {
    expect(term("remakes").low.toFixed(2)).toBe("2080.00");
    expect(term("remakes").high.toFixed(2)).toBe("28500.00");
    expect(term("saves").low.toFixed(2)).toBe("1500.00");
    expect(term("saves").high.toFixed(2)).toBe("24000.00");
    expect(formatUsdExact(term("metal").low)).toBe("$162");
    expect(formatUsdExact(term("metal").high)).toBe("$1,944");
    const total = rangeOverBands(tree, hu.model, full);
    expect(total.low.toFixed(2)).toBe("3742.00");
    expect(total.high.toFixed(2)).toBe("54444.00");
    // Half up from the exacts, once: the low end displays above its exact.
    expect(roundTo(total.low, 5_000)).toBe(5_000);
    expect(roundTo(total.high, 5_000)).toBe(55_000);
  });

  it("keeps the corner range exact although the remake term couples its inputs", () => {
    // s multiplies both remake rates, so the term is not monotone in s
    // across the whole track; it is linear in each input taken alone, so
    // its extremes still sit at corners. Sample the full track to prove it.
    const remakes = compileFormula(hu.model.terms[0]!.formula);
    const corners = rangeOverBands(
      remakes,
      hu.model,
      extentBands(hu.model.sliders),
    );
    let seed = 67;
    const rand = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    for (let i = 0; i < 2_000; i += 1) {
      const point = Object.fromEntries(
        hu.model.sliders.map((s) => [s.id, s.min + rand() * (s.max - s.min)]),
      );
      const v = valueAt(remakes, hu.model, point);
      expect(v).toBeGreaterThanOrEqual(corners.low - 1e-6);
      expect(v).toBeLessThanOrEqual(corners.high + 1e-6);
    }
  });

  it("lands each preset on its locked figures", () => {
    expect(preset("Remakes only")).toEqual({
      f: { low: 0, high: 0 },
      m: { low: 0, high: 0 },
    });
    const remakesOnly = rangeOverBands(tree, hu.model, {
      ...full,
      ...preset("Remakes only"),
    });
    expect(remakesOnly.low.toFixed(2)).toBe("2080.00");
    expect(remakesOnly.high.toFixed(2)).toBe("28500.00");
    // The implant part of the remake term alone: other remakes, saves and
    // metal closed on zero.
    const implantsOnly = rangeOverBands(tree, hu.model, {
      ...full,
      ...preset("Implants only"),
    });
    expect(implantsOnly.low.toFixed(2)).toBe("1000.00");
    expect(implantsOnly.high.toFixed(2)).toBe("18000.00");
    const m = hu.model.sliders.find((s) => s.id === "m")!;
    expect(m.presets).toEqual([{ label: "No metal", low: 0, high: 0 }]);
    const noMetal = rangeOverBands(tree, hu.model, {
      ...full,
      m: { low: 0, high: 0 },
    });
    expect(noMetal.high.toFixed(2)).toBe("52500.00");
  });

  it("scales the EXACT range and rounds once, at the relay's locked volumes", () => {
    const exact = rangeOverBands(tree, hu.model, full);
    const locked: [number, string, string, number, number][] = [
      [4_000, "$14,968", "$217,776", 15_000, 220_000],
      [6_000, "$22,452", "$326,664", 20_000, 325_000],
      [8_000, "$29,936", "$435,552", 30_000, 435_000],
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
      { ...full, ...preset("Remakes only") },
      { ...full, ...preset("Implants only") },
      { ...full, m: { low: 0, high: 0 } },
    ];
    let seed = 71;
    const rand = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    const volumes = [1, 500, 1_000, 4_000, 6_000, 8_000, 77_777];
    for (let i = 0; i < 200; i += 1)
      volumes.push(1 + Math.floor(rand() * 99_999));
    for (const bands of bandSets) {
      const exact = rangeOverBands(tree, hu.model, bands);
      for (const n of volumes) {
        const shown = displayedAtVolume(exact, n, 1_000, hu.model.roundTo);
        expect(shown.low).toBe(
          roundTo((exact.low * n) / 1_000, hu.model.roundTo),
        );
        expect(shown.high).toBe(
          roundTo((exact.high * n) / 1_000, hu.model.roundTo),
        );
      }
    }
  });

  it("keeps the promise log consistent: lab days, and three of five on time", () => {
    const ledger = hu.proposal.ledger!;
    let onTime = 0;
    for (const row of ledger.rows) {
      const [, promised, delivered, wait, lab] = row.cells.map(Number) as [
        number,
        number,
        number,
        number,
        number,
      ];
      // Lab days: lateness left once the dentist's waiting is set aside.
      expect(lab).toBe(delivered - promised - wait);
      if (lab <= 0) onTime += 1;
    }
    expect(ledger.rows).toHaveLength(5);
    expect(onTime).toBe(3);
    expect(ledger.total).toEqual({
      label: "On time, dentist waiting set aside",
      value: "3 of 5",
    });
  });

  it("keeps the saves log consistent: five saves summing to $262.00", () => {
    const saves = hu.proposal.extraLedgers![0]!;
    const cents = (t: string) =>
      Math.round(Number(t.replace(/[$,]/g, "")) * 100);
    expect(saves.rows.map((r) => r.cells)).toEqual([
      ["Overnight box", "$38.00"],
      ["Second driver run", "$45.00"],
      ["Rush fee absorbed", "$60.00"],
      ["Goodwill credit", "$84.00"],
      ["Reroute", "$35.00"],
    ]);
    const sum = saves.rows.reduce((acc, row) => acc + cents(row.cells[1]!), 0);
    expect(sum).toBe(cents(saves.total!.value!));
    expect(sum).toBe(26_200);
  });

  it("quotes the letter and relay word for word where the page overlaps them", () => {
    expect(hu.token).toBe("hunter-dental-81beea1793");
    expect(hu.hero.heading).toBe(
      "Hunter Dental Laboratory, a cost model sent for correction",
    );
    expect(hu.model.letterRange).toEqual({ low: 5_000, high: 55_000 });
    // The exact figures lead, because the rounding overstates the low end.
    expect(hu.hero.subline.startsWith("(exact: $3,742 and $54,444)")).toBe(
      true,
    );
    expect(hu.model.disclosure).toBe(
      "This model carries no federal index: none maps onto a ceramics laboratory.",
    );
    expect(hu.model.constants).toEqual([
      {
        id: "d",
        value: 0.081,
        text: "Metal drift uses the public gold price, $4,177 on October 1, 2026 against $3,864 a year earlier (+8.1 percent) [[BENCHMARK]], applied only to units that still carry metal. Zirconia has no public curve and is charged nothing.",
        note: "Palladium $1,190, down 4.7 percent in a year.",
      },
    ]);
    expect(hu.proposal.lead).toBe(
      "The proposal: the promise ledger, a status loop that costs technicians nothing, and your on-time rate by product in thirty days; fixed fee between $1,200 and $1,800; nothing in your records is changed; no patient information in any note.",
    );
    expect(hu.respect?.paragraphs[1]).toContain(
      "more than 130,000 smiles restored, twenty-six master certifications",
    );
    expect(hu.model.sliders.find((s) => s.id === "f")!.basis).toContain(
      "Lateness caused by a remake is left out",
    );
    expect(hu.proposal.fee).toBe("A fixed fee between $1,200 and $1,800.");
    // Required strings the relay lists, case as written.
    for (const required of [
      "130,000",
      "no federal index",
      "8.1 percent",
      "zirconia",
      "implant",
      "status loop",
    ])
      expect(JSON.stringify(hu), required).toContain(required);
    expect(hu.sources.at(-1)).toBe(
      "This page contains no client data; all figures are public or assumed; nothing here is protected health information.",
    );
  });

  it("holds its heading's height through the font swap", () => {
    // Fraunces sets the heading in four lines up to 371px, three up to 440px
    // and two up to 1023px; the fallback face changes at 336, 388 and 728,
    // so without the reservation the page moved when the font arrived.
    expect(hu.hero.headingLines).toEqual([
      { upTo: 371, lines: 4 },
      { upTo: 440, lines: 3 },
      { upTo: 1023, lines: 2 },
    ]);
  });

  it("carries none of the kill-list terms, with patient exactly once in the strip", () => {
    const text = JSON.stringify(hu);
    for (const term of [
      "–",
      "—",
      "artificial intelligence",
      "machine learning",
      "Automate",
      "3Shape",
      "exocad",
      "Dandy",
      "Glidewell",
      "nephew",
      "uncle",
      "forum",
      "COVID",
      "401K",
      "retire",
      "succession",
      "Brett",
      "Hansen",
    ]) {
      expect(text.toLowerCase().includes(term.toLowerCase()), term).toBe(false);
    }
    expect(/\bAI\b/.test(text), "AI as a word").toBe(false);
    // Staff counts are never printed; the 14 in the promise log is a day.
    expect(/\b1[46] (people|staff|employees)\b/i.test(text)).toBe(false);
    expect(text.match(/patient/gi)).toHaveLength(1);
    expect(hu.proposal.lead).toContain("no patient information in any note");
    const elsewhere = JSON.stringify({
      ...hu,
      proposal: { ...hu.proposal, lead: undefined },
    });
    expect(/patient/i.test(elsewhere), "any patient term elsewhere").toBe(
      false,
    );
  });

  it("rejects a third extra log", () => {
    const raw = JSON.parse(JSON.stringify(hu)) as typeof hu;
    const extra = raw.proposal.extraLedgers![0]!;
    raw.proposal.extraLedgers = [extra, extra, extra];
    expect(dashboardSchema.safeParse(raw).success).toBe(false);
  });
});

describe("CC Dental Studio model", () => {
  const cc = allDashboards().find((d) => d.slug === "ccdental")!;
  const tree = compileFormula(totalFormula(cc.model.terms));
  const full = restBands(cc.model.sliders);
  const term = (id: string, bands = full) =>
    rangeOverBands(
      compileFormula(cc.model.terms.find((t) => t.id === id)!.formula),
      cc.model,
      bands,
    );
  const preset = (label: string) =>
    cc.model.presets!.items.find((p) => p.label === label)!.bands;

  it("computes the locked endpoints to the cent at the letter's assumptions", () => {
    expect(term("returned").low.toFixed(2)).toBe("1200.00");
    expect(term("returned").high.toFixed(2)).toBe("14000.00");
    expect(term("inside").low.toFixed(2)).toBe("2000.00");
    expect(term("inside").high.toFixed(2)).toBe("18000.00");
    expect(formatUsdExact(term("metal").low)).toBe("$162");
    expect(formatUsdExact(term("metal").high)).toBe("$1,944");
    const total = rangeOverBands(tree, cc.model, full);
    expect(total.low.toFixed(2)).toBe("3362.00");
    expect(total.high.toFixed(2)).toBe("33944.00");
    expect(roundTo(total.low, 5_000)).toBe(5_000);
    expect(roundTo(total.high, 5_000)).toBe(35_000);
  });

  it("lands each preset on its locked figures", () => {
    expect(preset("Returned remakes only")).toEqual({
      a: { low: 0, high: 0 },
      m: { low: 0, high: 0 },
    });
    const returned = rangeOverBands(tree, cc.model, {
      ...full,
      ...preset("Returned remakes only"),
    });
    expect(returned.low.toFixed(2)).toBe("1200.00");
    expect(returned.high.toFixed(2)).toBe("14000.00");
    expect(preset("Inside redos only")).toEqual({
      r: { low: 0, high: 0 },
      m: { low: 0, high: 0 },
    });
    const inside = rangeOverBands(tree, cc.model, {
      ...full,
      ...preset("Inside redos only"),
    });
    expect(inside.low.toFixed(2)).toBe("2000.00");
    expect(inside.high.toFixed(2)).toBe("18000.00");
    const m = cc.model.sliders.find((s) => s.id === "m")!;
    expect(m.presets).toEqual([{ label: "No metal", low: 0, high: 0 }]);
    const noMetal = rangeOverBands(tree, cc.model, {
      ...full,
      m: { low: 0, high: 0 },
    });
    expect(noMetal.low.toFixed(2)).toBe("3200.00");
    expect(noMetal.high.toFixed(2)).toBe("32000.00");
  });

  it("scales the EXACT range and rounds once, at the relay's locked volumes", () => {
    const exact = rangeOverBands(tree, cc.model, full);
    const locked: [number, string, string, number, number][] = [
      [3_000, "$10,086", "$101,832", 10_000, 100_000],
      [5_000, "$16,810", "$169,720", 15_000, 170_000],
      [8_000, "$26,896", "$271,552", 25_000, 270_000],
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
      { ...full, ...preset("Returned remakes only") },
      { ...full, ...preset("Inside redos only") },
      { ...full, m: { low: 0, high: 0 } },
    ];
    let seed = 73;
    const rand = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    const volumes = [1, 500, 1_000, 3_000, 5_000, 8_000, 77_777];
    for (let i = 0; i < 200; i += 1)
      volumes.push(1 + Math.floor(rand() * 99_999));
    for (const bands of bandSets) {
      const exact = rangeOverBands(tree, cc.model, bands);
      for (const n of volumes) {
        const shown = displayedAtVolume(exact, n, 1_000, cc.model.roundTo);
        expect(shown.low).toBe(
          roundTo((exact.low * n) / 1_000, cc.model.roundTo),
        );
        expect(shown.high).toBe(
          roundTo((exact.high * n) / 1_000, cc.model.roundTo),
        );
      }
    }
  });

  it("keeps the inside redo log consistent: five redos summing to $380.00", () => {
    const ledger = cc.proposal.ledger!;
    const cents = (t: string) =>
      Math.round(Number(t.replace(/[$,]/g, "")) * 100);
    expect(ledger.rows.map((r) => r.cells)).toEqual([
      ["Contact too tight (doctor profile)", "$60.00"],
      ["Shade a half step off (profile)", "$85.00"],
      ["Margin reset at design (build standard)", "$95.00"],
      ["Occlusion adjusted after model check", "$70.00"],
      ["Stain and glaze repeat", "$70.00"],
    ]);
    const sum = ledger.rows.reduce((acc, row) => acc + cents(row.cells[1]!), 0);
    expect(sum).toBe(cents(ledger.total!.value!));
    expect(sum).toBe(38_000);
    // The note's "three of five": the rows the file would have caught.
    expect(
      ledger.rows.filter((r) =>
        /\((doctor profile|profile|build standard)\)/.test(r.cells[0]!),
      ),
    ).toHaveLength(3);
  });

  it("quotes the letter and relay word for word where the page overlaps them", () => {
    expect(cc.token).toBe("cc-dental-a1b5fc0a24");
    expect(cc.hero.heading).toBe(
      "CC Dental Studio, a cost model sent for correction",
    );
    expect(cc.model.letterRange).toEqual({ low: 5_000, high: 35_000 });
    // The exact figures lead, because the rounding overstates the low end.
    expect(cc.hero.subline.startsWith("(exact: $3,362 and $33,944)")).toBe(
      true,
    );
    expect(cc.model.disclosure).toBe(
      "This model carries no federal index: none maps onto a ceramics laboratory.",
    );
    expect(cc.model.constants).toEqual([
      {
        id: "d",
        value: 0.081,
        text: "Metal drift uses the public gold price, $4,177 on October 1, 2026 against $3,864 a year earlier (+8.1 percent) [[BENCHMARK]], applied only to units that still carry metal. Zirconia has no public curve and is charged nothing.",
      },
    ]);
    expect(cc.proposal.lead).toBe(
      "The proposal: the count, the consistency file (a build standard per product and a preference profile per doctor, in your technicians' words), and the thirty-day result; fixed fee between $1,200 and $1,800; read-only; no patient information leaves the building.",
    );
    expect(cc.proposal.deliverables).toBeUndefined();
    expect(cc.respect?.paragraphs[0]).toContain(
      "with one stated intent, consistent quality",
    );
    expect(cc.proposal.fee).toBe("A fixed fee between $1,200 and $1,800.");
    for (const required of [
      "consistent quality",
      "no federal index",
      "8.1 percent",
      "zirconia",
      "preference profile",
    ])
      expect(JSON.stringify(cc), required).toContain(required);
    expect(cc.sources.at(-1)).toBe(
      "This page contains no client data; nothing here is protected health information.",
    );
  });

  it("holds its heading's height through the font swap", () => {
    // Fraunces sets the heading in three lines up to 380px and two up to
    // 698px; the fallback face changes at 337 and 627, so without the
    // reservation the page moved when the font arrived.
    expect(cc.hero.headingLines).toEqual([
      { upTo: 380, lines: 3 },
      { upTo: 698, lines: 2 },
    ]);
  });

  it("carries none of the kill-list terms, with patient exactly once in the strip", () => {
    const text = JSON.stringify(cc);
    for (const term of [
      "–",
      "—",
      "artificial intelligence",
      "machine learning",
      "Glidewell",
      "Dandy",
      "3Shape",
      "exocad",
      "retire",
      "succession",
      "NDX",
    ]) {
      expect(text.toLowerCase().includes(term.toLowerCase()), term).toBe(false);
    }
    expect(/\bAI\b/.test(text), "AI as a word").toBe(false);
    // "age" and "old" are scanned as words: "page", "average" and "hold"
    // are different words. "leave" is kept out too, per the playbook.
    expect(/\bage\b/i.test(text), "age as a word").toBe(false);
    expect(/\bold\b/i.test(text), "old as a word").toBe(false);
    expect(/\bleave\b/i.test(text), "leave as a word").toBe(false);
    // The president is Ms. Curtis in copy, never her first name alone.
    expect(/\bChris\b/.test(text), "Chris").toBe(false);
    expect(text.match(/patient/gi)).toHaveLength(1);
    expect(cc.proposal.lead).toContain("no patient information");
    const elsewhere = JSON.stringify({
      ...cc,
      proposal: { ...cc.proposal, lead: undefined },
    });
    expect(/patient/i.test(elsewhere), "any patient term elsewhere").toBe(
      false,
    );
  });
});

describe("Stoller Dental Laboratory model", () => {
  const st = allDashboards().find((d) => d.slug === "stoller")!;
  const tree = compileFormula(totalFormula(st.model.terms));
  const full = restBands(st.model.sliders);
  const term = (id: string, bands = full) =>
    rangeOverBands(
      compileFormula(st.model.terms.find((t) => t.id === id)!.formula),
      st.model,
      bands,
    );
  const cents = (t: string) => Math.round(Number(t.replace(/[$,]/g, "")) * 100);
  // Gold per gram, in cents, from the badge's own prices per troy ounce.
  const TROY_OUNCE_GRAMS = 31.1034768;
  const nowPerGram = Math.round((4_177 / TROY_OUNCE_GRAMS) * 100);
  const thenPerGram = Math.round((3_864 / TROY_OUNCE_GRAMS) * 100);
  // Milligrams times cents per gram, to the cent, half up.
  const atPrice = (mg: number, perGram: number) =>
    Math.round((mg * perGram) / 1_000);

  it("computes the locked endpoints to the cent at the letter's assumptions", () => {
    expect(term("metal").low.toFixed(2)).toBe("7290.00");
    expect(term("metal").high.toFixed(2)).toBe("70875.00");
    expect(term("remakes").low.toFixed(2)).toBe("12000.00");
    expect(term("remakes").high.toFixed(2)).toBe("140000.00");
    expect(term("reclaim").low.toFixed(2)).toBe("450.00");
    expect(term("reclaim").high.toFixed(2)).toBe("17500.00");
    const total = rangeOverBands(tree, st.model, full);
    expect(total.low.toFixed(2)).toBe("19740.00");
    expect(total.high.toFixed(2)).toBe("228375.00");
    expect(roundTo(total.low, 5_000)).toBe(20_000);
    expect(roundTo(total.high, 5_000)).toBe(230_000);
  });

  it("lands each preset on its locked figures", () => {
    const metalOnlyBands = st.model.presets!.items.find(
      (p) => p.label === "Metal only",
    )!.bands;
    expect(metalOnlyBands).toEqual({
      r: { low: 0, high: 0 },
      s: { low: 0, high: 0 },
    });
    const metalOnly = rangeOverBands(tree, st.model, {
      ...full,
      ...metalOnlyBands,
    });
    expect(metalOnly.low.toFixed(2)).toBe("7290.00");
    expect(metalOnly.high.toFixed(2)).toBe("70875.00");
    const m = st.model.sliders.find((s) => s.id === "m")!;
    expect(m.presets).toEqual([{ label: "No metal", low: 0, high: 0 }]);
    const noMetal = rangeOverBands(tree, st.model, {
      ...full,
      m: { low: 0, high: 0 },
    });
    expect(noMetal.low.toFixed(2)).toBe("12000.00");
    expect(noMetal.high.toFixed(2)).toBe("140000.00");
  });

  it("scales the EXACT range and rounds once, at the relay's locked volumes", () => {
    const exact = rangeOverBands(tree, st.model, full);
    const locked: [number, string, string, number, number][] = [
      [10_000, "$19,740", "$228,375", 20_000, 230_000],
      [15_000, "$29,610", "$342,562.50", 30_000, 345_000],
      [20_000, "$39,480", "$456,750", 40_000, 455_000],
    ];
    for (const [n, low, high, shownLow, shownHigh] of locked) {
      const scaled = scaleToVolume(exact, n, 10_000);
      expect(formatUsdExact(scaled.low)).toBe(low);
      expect(formatUsdExact(scaled.high)).toBe(high);
      expect(displayedAtVolume(exact, n, 10_000, 5_000)).toEqual({
        low: shownLow,
        high: shownHigh,
      });
    }
  });

  it("displays round-to-step of the exact scaled value, for any volume, in every state", () => {
    const bandSets = [
      full,
      { ...full, r: { low: 0, high: 0 }, s: { low: 0, high: 0 } },
      { ...full, m: { low: 0, high: 0 } },
    ];
    let seed = 79;
    const rand = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    const volumes = [1, 1_000, 10_000, 15_000, 20_000, 77_777];
    for (let i = 0; i < 200; i += 1)
      volumes.push(1 + Math.floor(rand() * 199_999));
    for (const bands of bandSets) {
      const exact = rangeOverBands(tree, st.model, bands);
      for (const n of volumes) {
        const shown = displayedAtVolume(exact, n, 10_000, st.model.roundTo);
        expect(shown.low).toBe(
          roundTo((exact.low * n) / 10_000, st.model.roundTo),
        );
        expect(shown.high).toBe(
          roundTo((exact.high * n) / 10_000, st.model.roundTo),
        );
      }
    }
  });

  it("computes the metal line from each unit's alloy at the badge's gold prices", () => {
    expect(nowPerGram).toBe(13_429);
    expect(thenPerGram).toBe(12_423);
    const ledger = st.proposal.ledger!;
    const totals = [0, 0, 0];
    for (const row of ledger.rows) {
      const [unit, today, allows, absorbed] = row.cells as [
        string,
        string,
        string,
        string,
      ];
      // Only gold is priced; base alloy and titanium carry no public curve.
      const gold = /([\d.]+) g at (\d+) percent gold/.exec(unit);
      const mg = gold
        ? Math.round((Number(gold[1]) * 1_000 * Number(gold[2])) / 100)
        : 0;
      expect(cents(today)).toBe(atPrice(mg, nowPerGram));
      expect(cents(allows)).toBe(atPrice(mg, thenPerGram));
      expect(cents(absorbed)).toBe(cents(today) - cents(allows));
      totals[0] += cents(today);
      totals[1] += cents(allows);
      totals[2] += cents(absorbed);
    }
    expect(ledger.rows).toHaveLength(5);
    expect(ledger.total!.cells!.map(cents)).toEqual(totals);
    expect(totals).toEqual([45_659, 42_239, 3_420]);
    expect(ledger.note).toContain("$134.29 a gram");
    expect(ledger.note).toContain("$124.23 a gram");
  });

  it("computes the settlement check: 31.0 g gross, the gap after stated fees", () => {
    const check = st.proposal.extraLedgers![0]!;
    const fineMg = Math.round(31_000 * 0.4);
    const fees = 4_500 + 2_500;
    const atPublic = atPrice(fineMg, nowPerGram);
    const paid = atPrice(fineMg, 13_000) - fees;
    const [gross, less, supports, paidRow] = check.rows.map((r) =>
      cents(r.cells[1]!),
    ) as [number, number, number, number];
    expect(check.rows[0]!.cells[0]).toContain("31.0 g gross");
    expect(gross).toBe(atPublic);
    expect(less).toBe(-fees);
    expect(supports).toBe(atPublic - fees);
    expect(paidRow).toBe(paid);
    expect(cents(check.total!.value!)).toBe(supports - paidRow);
    expect(check.total!.value).toBe("$53.20");
  });

  it("quotes the letter and relay word for word where the page overlaps them", () => {
    expect(st.token).toBe("stoller-dental-0012d95297");
    expect(st.hero.heading).toBe(
      "Stoller Dental Laboratory, a cost model sent for correction",
    );
    expect(st.model.letterRange).toEqual({ low: 20_000, high: 230_000 });
    expect(st.hero.subline).toContain("(exact: $19,740 and $228,375)");
    expect(st.model.disclosure).toBe(
      "This model carries no federal index: none maps onto a dental laboratory.",
    );
    expect(st.model.constants[0]!.text).toBe(
      "Metal uses the public gold price, $4,177 on October 1, 2026 against $3,864 a year earlier (+8.1 percent) [[BENCHMARK]]; gold's record in January 2026 is shown, not charged. Palladium $1,190, down 4.7 percent in a year. Zirconia has no public curve and is charged nothing.",
    );
    expect(st.model.constants[0]!.value).toBe(0.081);
    expect(st.model.constants[0]!.note).toBe(
      "Gold's January 2026 record: $5,608 an ounce.",
    );
    expect(st.proposal.lead).toBe(
      "The proposal: the count (four quarters of metal against the public prices and your settlements), the metal line in your own fee schedule, and the first month billed at the line, counted; fixed fee between $1,200 and $1,800; read-only; no patient information leaves the building.",
    );
    expect(st.proposal.deliverables).toBeUndefined();
    expect(st.proposal.fee).toBe("A fixed fee between $1,200 and $1,800.");
    for (const required of [
      "metal line",
      "no federal index",
      "8.1 percent",
      "4.7 percent",
      "settlement",
      "zirconia",
    ])
      expect(JSON.stringify(st), required).toContain(required);
    expect(st.sources.at(-1)).toBe(
      "This page contains no client data; nothing here is protected health information.",
    );
  });

  it("holds its heading's height through the font swap", () => {
    // Fraunces sets the heading in four lines up to 371px, three up to 440px
    // and two up to 1023px; the fallback face changes at 336, 388 and 720,
    // so without the reservation the page moved when the font arrived.
    expect(st.hero.headingLines).toEqual([
      { upTo: 371, lines: 4 },
      { upTo: 440, lines: 3 },
      { upTo: 1023, lines: 2 },
    ]);
  });

  it("carries none of the kill-list terms, with patient exactly once in the strip", () => {
    const text = JSON.stringify(st);
    for (const term of [
      "–",
      "—",
      "artificial intelligence",
      "machine learning",
      "Glidewell",
      "Dandy",
      "3Shape",
      "exocad",
      "brother",
      "Larry",
      "DDX",
      "retire",
      "succession",
      "father",
      "handed",
    ]) {
      expect(text.toLowerCase().includes(term.toLowerCase()), term).toBe(false);
    }
    expect(/\bAI\b/.test(text), "AI as a word").toBe(false);
    expect(/\bsons?\b/i.test(text), "son or sons as a word").toBe(false);
    expect(text.match(/patient/gi)).toHaveLength(1);
    expect(st.proposal.lead).toContain("no patient information");
    const elsewhere = JSON.stringify({
      ...st,
      proposal: { ...st.proposal, lead: undefined },
    });
    expect(/patient/i.test(elsewhere), "any patient term elsewhere").toBe(
      false,
    );
  });
});

describe("Flaherty Dental Laboratory model", () => {
  const fl = allDashboards().find((d) => d.slug === "flaherty")!;
  const tree = compileFormula(totalFormula(fl.model.terms));
  const full = restBands(fl.model.sliders);
  const term = (id: string, bands = full) =>
    rangeOverBands(
      compileFormula(fl.model.terms.find((t) => t.id === id)!.formula),
      fl.model,
      bands,
    );
  const preset = (label: string) =>
    fl.model.presets!.items.find((p) => p.label === label)!.bands;
  const cents = (t: string) => Math.round(Number(t.replace(/[$,]/g, "")) * 100);

  it("computes the locked endpoints to the cent at the letter's assumptions", () => {
    expect(term("remakes").low.toFixed(2)).toBe("1200.00");
    expect(term("remakes").high.toFixed(2)).toBe("14000.00");
    expect(term("planning").low.toFixed(2)).toBe("2750.00");
    expect(term("planning").high.toFixed(2)).toBe("51000.00");
    expect(formatUsdExact(term("metal").low)).toBe("$162");
    expect(formatUsdExact(term("metal").high)).toBe("$1,944");
    const total = rangeOverBands(tree, fl.model, full);
    expect(total.low.toFixed(2)).toBe("4112.00");
    expect(total.high.toFixed(2)).toBe("66944.00");
    expect(roundTo(total.low, 5_000)).toBe(5_000);
    expect(roundTo(total.high, 5_000)).toBe(65_000);
  });

  it("lands each preset on its locked figures", () => {
    expect(preset("Remakes only")).toEqual({
      n: { low: 0, high: 0 },
      m: { low: 0, high: 0 },
    });
    const remakes = rangeOverBands(tree, fl.model, {
      ...full,
      ...preset("Remakes only"),
    });
    expect(remakes.low.toFixed(2)).toBe("1200.00");
    expect(remakes.high.toFixed(2)).toBe("14000.00");
    expect(preset("New lines only")).toEqual({
      r: { low: 0, high: 0 },
      m: { low: 0, high: 0 },
    });
    const newLines = rangeOverBands(tree, fl.model, {
      ...full,
      ...preset("New lines only"),
    });
    expect(newLines.low.toFixed(2)).toBe("2750.00");
    expect(newLines.high.toFixed(2)).toBe("51000.00");
    const m = fl.model.sliders.find((s) => s.id === "m")!;
    expect(m.presets).toEqual([{ label: "No metal", low: 0, high: 0 }]);
    const noMetal = rangeOverBands(tree, fl.model, {
      ...full,
      m: { low: 0, high: 0 },
    });
    expect(noMetal.low.toFixed(2)).toBe("3950.00");
    expect(noMetal.high.toFixed(2)).toBe("65000.00");
  });

  it("scales the EXACT range and rounds once, at the relay's locked volumes", () => {
    const exact = rangeOverBands(tree, fl.model, full);
    const locked: [number, string, string, number, number][] = [
      [1_500, "$6,168", "$100,416", 5_000, 100_000],
      [2_500, "$10,280", "$167,360", 10_000, 165_000],
      [4_000, "$16,448", "$267,776", 15_000, 270_000],
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
      { ...full, ...preset("Remakes only") },
      { ...full, ...preset("New lines only") },
      { ...full, m: { low: 0, high: 0 } },
    ];
    let seed = 83;
    const rand = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    const volumes = [1, 500, 1_000, 1_500, 2_500, 4_000, 77_777];
    for (let i = 0; i < 200; i += 1)
      volumes.push(1 + Math.floor(rand() * 99_999));
    for (const bands of bandSets) {
      const exact = rangeOverBands(tree, fl.model, bands);
      for (const n of volumes) {
        const shown = displayedAtVolume(exact, n, 1_000, fl.model.roundTo);
        expect(shown.low).toBe(
          roundTo((exact.low * n) / 1_000, fl.model.roundTo),
        );
        expect(shown.high).toBe(
          roundTo((exact.high * n) / 1_000, fl.model.roundTo),
        );
      }
    }
  });

  it("computes the line count from each line's fee and materials, and flags the two lowest", () => {
    const ledger = fl.proposal.ledger!;
    // Contribution per hour in cents, half up, from integer cents.
    const perHour = (contribution: number, hours: number) =>
      Math.floor((contribution * 2 + hours) / (2 * hours));
    let units = 0;
    let hours = 0;
    let contribution = 0;
    const rates: [string, number][] = [];
    for (const row of ledger.rows) {
      const [line, u, h, c, ph] = row.cells as [
        string,
        string,
        string,
        string,
        string,
      ];
      const [fee, materials] = [...line.matchAll(/\$(\d+)/g)].map((m) =>
        Number(m[1]),
      ) as [number, number];
      expect(cents(c)).toBe(Number(u) * (fee - materials) * 100);
      expect(cents(ph)).toBe(perHour(cents(c), Number(h)));
      units += Number(u);
      hours += Number(h);
      contribution += cents(c);
      rates.push([line, cents(ph)]);
    }
    expect(ledger.rows).toHaveLength(6);
    expect(ledger.total!.cells).toEqual([
      units.toLocaleString("en-US"),
      hours.toLocaleString("en-US"),
      "$131,700.00",
      "$120.27",
    ]);
    expect(contribution).toBe(13_170_000);
    expect(cents(ledger.total!.cells![3]!)).toBe(perHour(contribution, hours));
    // The flags sit on exactly the two lowest lines per hour, and read as
    // the shape of an invented example, never as a finding about the
    // laboratory's new lines before anything has been counted.
    const lowest = [...rates].sort((a, b) => a[1] - b[1]).slice(0, 2);
    const flagged = ledger.rows.filter((r) => r.flag).map((r) => r.cells[0]);
    expect(flagged.sort()).toEqual(lowest.map(([line]) => line).sort());
    for (const row of ledger.rows.filter((r) => r.flag))
      expect(row.flag).toBe("One of the two lowest in this illustration.");
    expect(ledger.flagLabel).toBe("LOWEST TWO");
    expect(
      ledger.note.startsWith(
        "Illustrative only. The laboratory's own count may show the opposite.",
      ),
    ).toBe(true);
  });

  it("quotes the letter and relay word for word where the page overlaps them", () => {
    expect(fl.token).toBe("flaherty-dental-1c6b9809a4");
    expect(fl.hero.heading).toBe(
      "Flaherty Dental Laboratory, a cost model sent for correction",
    );
    expect(fl.model.letterRange).toEqual({ low: 5_000, high: 65_000 });
    expect(fl.hero.subline.startsWith("(exact: $4,112 and $66,944)")).toBe(
      true,
    );
    expect(fl.model.disclosure).toBe(
      "This model carries no federal index: none maps onto a dental laboratory.",
    );
    expect(fl.model.constants).toEqual([
      {
        id: "d",
        value: 0.081,
        text: "Metal drift uses the public gold price, $4,177 on October 1, 2026 against $3,864 a year earlier (+8.1 percent) [[BENCHMARK]], applied only to units that carry metal. Zirconia and resin have no public curve and are charged nothing.",
      },
    ]);
    expect(fl.proposal.lead).toBe(
      "The proposal: the line count (two quarters by product line, the three new lines kept apart), the decision page in your words, and the first month run on it, counted; fixed fee between $1,200 and $1,800; read-only; no patient information leaves the building.",
    );
    expect(fl.proposal.deliverables).toBeUndefined();
    expect(fl.proposal.fee).toBe("A fixed fee between $1,200 and $1,800.");
    for (const required of [
      "which line pays",
      "no federal index",
      "8.1 percent",
      "clear aligners",
      "decision page",
    ])
      expect(JSON.stringify(fl), required).toContain(required);
    expect(fl.sources.at(-1)).toBe(
      "This page contains no client data; nothing here is protected health information.",
    );
  });

  it("holds its heading's height through the font swap", () => {
    // Fraunces sets the heading in four lines up to 371px, three up to 440px
    // and two up to 1023px; the fallback face changes at 336, 396 and 744,
    // so without the reservation the page moved when the font arrived.
    expect(fl.hero.headingLines).toEqual([
      { upTo: 371, lines: 4 },
      { upTo: 440, lines: 3 },
      { upTo: 1023, lines: 2 },
    ]);
  });

  it("carries none of the kill-list terms, patient only in our privacy phrase", () => {
    const text = JSON.stringify(fl);
    for (const term of [
      "–",
      "—",
      "artificial intelligence",
      "machine learning",
      "Invisalign",
      "Glidewell",
      "Dandy",
      "3Shape",
      "Myerson",
      "Labzona",
      "Google Form",
      "father",
      "handed",
      "brother",
    ]) {
      expect(text.toLowerCase().includes(term.toLowerCase()), term).toBe(false);
    }
    expect(/\bAI\b/.test(text), "AI as a word").toBe(false);
    expect(/\bEMA\b/.test(text), "EMA as a word").toBe(false);
    expect(/\bsons?\b/i.test(text), "son or sons as a word").toBe(false);
    // No headcount or staff size, in figures or words.
    expect(
      /\b(\d+|one|two|three|four|five|six|seven|eight|nine|ten) (people|employees|staff|technicians)\b/i.test(
        text,
      ),
      "employee count",
    ).toBe(false);
    // "Alex" only inside the testimonial's own words.
    expect(text.match(/\bAlex\b/g)).toHaveLength(1);
    expect(fl.respect!.paragraphs[2]).toContain("you and Alex communicate");
    // "patient" only inside our own privacy phrase, per the standing rule.
    expect(patientTermsOutsideAllowlist(text)).toEqual([]);
    expect(fl.proposal.lead).toContain(ALLOWED_PATIENT_PHRASE);
  });
});

describe("Johns Dental Laboratories model", () => {
  const jo = allDashboards().find((d) => d.slug === "johns")!;
  const tree = compileFormula(totalFormula(jo.model.terms));
  const full = restBands(jo.model.sliders);
  const term = (id: string, bands = full) =>
    rangeOverBands(
      compileFormula(jo.model.terms.find((t) => t.id === id)!.formula),
      jo.model,
      bands,
    );
  const preset = (label: string) =>
    jo.model.presets!.items.find((p) => p.label === label)!.bands;
  const cents = (t: string) => Math.round(Number(t.replace(/[$,]/g, "")) * 100);

  it("computes the locked endpoints to the cent at the letter's assumptions", () => {
    expect(term("replacements").low.toFixed(2)).toBe("12000.00");
    expect(term("replacements").high.toFixed(2)).toBe("140000.00");
    expect(term("consultation").low.toFixed(2)).toBe("27500.00");
    expect(term("consultation").high.toFixed(2)).toBe("170000.00");
    expect(term("metal").low.toFixed(2)).toBe("3645.00");
    expect(term("metal").high.toFixed(2)).toBe("56700.00");
    const total = rangeOverBands(tree, jo.model, full);
    expect(total.low.toFixed(2)).toBe("43145.00");
    expect(total.high.toFixed(2)).toBe("366700.00");
    expect(roundTo(total.low, 5_000)).toBe(45_000);
    expect(roundTo(total.high, 5_000)).toBe(365_000);
  });

  it("lands each preset on its locked figures", () => {
    expect(preset("Consultation only")).toEqual({
      r: { low: 0, high: 0 },
      m: { low: 0, high: 0 },
    });
    const consultation = rangeOverBands(tree, jo.model, {
      ...full,
      ...preset("Consultation only"),
    });
    expect(consultation.low.toFixed(2)).toBe("27500.00");
    expect(consultation.high.toFixed(2)).toBe("170000.00");
    expect(preset("Replacements only")).toEqual({
      hrs: { low: 0, high: 0 },
      m: { low: 0, high: 0 },
    });
    const replacements = rangeOverBands(tree, jo.model, {
      ...full,
      ...preset("Replacements only"),
    });
    expect(replacements.low.toFixed(2)).toBe("12000.00");
    expect(replacements.high.toFixed(2)).toBe("140000.00");
    const m = jo.model.sliders.find((s) => s.id === "m")!;
    expect(m.presets).toEqual([{ label: "No metal", low: 0, high: 0 }]);
    const noMetal = rangeOverBands(tree, jo.model, {
      ...full,
      m: { low: 0, high: 0 },
    });
    expect(noMetal.low.toFixed(2)).toBe("39500.00");
    expect(noMetal.high.toFixed(2)).toBe("310000.00");
  });

  it("scales the EXACT range and rounds once, at the relay's locked volumes", () => {
    const exact = rangeOverBands(tree, jo.model, full);
    const locked: [number, string, string, number, number][] = [
      [20_000, "$86,290", "$733,400", 85_000, 735_000],
      [40_000, "$172,580", "$1,466,800", 175_000, 1_465_000],
      [60_000, "$258,870", "$2,200,200", 260_000, 2_200_000],
    ];
    for (const [n, low, high, shownLow, shownHigh] of locked) {
      const scaled = scaleToVolume(exact, n, 10_000);
      expect(formatUsdExact(scaled.low)).toBe(low);
      expect(formatUsdExact(scaled.high)).toBe(high);
      expect(displayedAtVolume(exact, n, 10_000, 5_000)).toEqual({
        low: shownLow,
        high: shownHigh,
      });
    }
  });

  it("displays round-to-step of the exact scaled value, for any volume, in every state", () => {
    const bandSets = [
      full,
      { ...full, ...preset("Consultation only") },
      { ...full, ...preset("Replacements only") },
      { ...full, m: { low: 0, high: 0 } },
    ];
    let seed = 89;
    const rand = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    const volumes = [1, 1_000, 10_000, 20_000, 40_000, 60_000, 77_777];
    for (let i = 0; i < 200; i += 1)
      volumes.push(1 + Math.floor(rand() * 499_999));
    for (const bands of bandSets) {
      const exact = rangeOverBands(tree, jo.model, bands);
      for (const n of volumes) {
        const shown = displayedAtVolume(exact, n, 10_000, jo.model.roundTo);
        expect(shown.low).toBe(
          roundTo((exact.low * n) / 10_000, jo.model.roundTo),
        );
        expect(shown.high).toBe(
          roundTo((exact.high * n) / 10_000, jo.model.roundTo),
        );
      }
    }
  });

  it("keeps the consultation log consistent: 47 minutes, $56.40 at $72 an hour", () => {
    const ledger = jo.proposal.ledger!;
    let minutes = 0;
    let cost = 0;
    for (const row of ledger.rows) {
      const [, min, atRate, book] = row.cells as [
        string,
        string,
        string,
        string,
      ];
      // $72 an hour is 120 cents a minute.
      expect(cents(atRate)).toBe(Number(min) * 120);
      expect(["yes", "no"]).toContain(book);
      minutes += Number(min);
      cost += cents(atRate);
    }
    expect(ledger.rows.map((r) => r.cells[0])).toEqual([
      "Expander choice",
      "Retainer material",
      "Sleep appliance titration",
      "Partial clasp design",
      "Replacement eligibility",
    ]);
    expect(minutes).toBe(47);
    expect(cost).toBe(5_640);
    expect(ledger.total!.cells).toEqual([String(minutes), "$56.40", ""]);
    // The note's rate and count are the log's own.
    expect(ledger.note).toContain("$72 an hour");
    const answered = ledger.rows.filter((r) => r.cells[3] === "yes").length;
    expect(answered).toBe(4);
    expect(ledger.note).toContain("Four of five calls");
  });

  it("quotes the letter and relay word for word where the page overlaps them", () => {
    expect(jo.token).toBe("johns-dental-13f267a69d");
    expect(jo.hero.heading).toBe(
      "Johns Dental Laboratories, a cost model sent for correction",
    );
    expect(jo.model.letterRange).toEqual({ low: 45_000, high: 365_000 });
    expect(jo.hero.subline).toContain("(exact: $43,145 and $366,700)");
    expect(jo.model.disclosure).toBe(
      "This model carries no federal index: none maps onto a dental laboratory.",
    );
    expect(jo.model.constants).toEqual([
      {
        id: "d",
        value: 0.081,
        text: "Metal uses the public gold price, $4,177 on October 1, 2026 against $3,864 a year earlier (+8.1 percent) [[BENCHMARK]], applied only to units that carry precious metal. Chrome cobalt, wire, and zirconia have no public curve and are charged nothing.",
      },
    ]);
    expect(jo.proposal.lead).toBe(
      "The proposal: the count (consultation minutes and replacements by appliance), the appliance book (one page per family, in your technicians' words), and the thirty-day result; fixed fee between $1,200 and $1,800; read-only; no patient information leaves the building.",
    );
    expect(jo.proposal.deliverables).toBeUndefined();
    expect(jo.proposal.fee).toBe("A fixed fee between $1,200 and $1,800.");
    for (const required of [
      "sixty",
      "consultation",
      "replacement program",
      "no federal index",
      "8.1 percent",
      "appliance book",
    ])
      expect(JSON.stringify(jo), required).toContain(required);
    expect(jo.sources.at(-1)).toBe(
      "This page contains no client data; nothing here is protected health information.",
    );
  });

  it("holds its heading's height through the font swap", () => {
    // Fraunces sets the heading in four lines up to 380px, three up to 440px
    // and two up to 1023px; the fallback face changes at 337, 388 and 730,
    // so without the reservation the page moved when the font arrived.
    expect(jo.hero.headingLines).toEqual([
      { upTo: 380, lines: 4 },
      { upTo: 440, lines: 3 },
      { upTo: 1023, lines: 2 },
    ]);
  });

  it("carries none of the kill-list terms, patient only in our privacy phrase", () => {
    const text = JSON.stringify(jo);
    for (const term of [
      "–",
      "—",
      "artificial intelligence",
      "machine learning",
      "Glidewell",
      "Dandy",
      "National Dentex",
      "NDX",
      "Modern Dental",
      "grandfather",
      "father",
      "handed",
    ]) {
      expect(text.toLowerCase().includes(term.toLowerCase()), term).toBe(false);
    }
    expect(/\bAI\b/.test(text), "AI as a word").toBe(false);
    expect(/\bsons?\b/i.test(text), "son or sons as a word").toBe(false);
    expect(
      /\b(\d+|one|two|three|four|five|six|seven|eight|nine|ten|twenty|thirty) (people|employees|staff|technicians)\b/i.test(
        text,
      ),
      "employee count",
    ).toBe(false);
    // "patient" only inside our own privacy phrase, per the standing rule.
    expect(patientTermsOutsideAllowlist(text)).toEqual([]);
    expect(jo.proposal.lead).toContain(ALLOWED_PATIENT_PHRASE);
  });
});

describe("Loren's Body Shop model", () => {
  const lo = allDashboards().find((d) => d.slug === "lorens")!;
  const tree = compileFormula(totalFormula(lo.model.terms));
  const full = restBands(lo.model.sliders);
  const small = lo.model.smallRound;
  const term = (id: string, bands = full) =>
    rangeOverBands(
      compileFormula(lo.model.terms.find((t) => t.id === id)!.formula),
      lo.model,
      bands,
    );
  const preset = (label: string) =>
    lo.model.presets!.items.find((p) => p.label === label)!.bands;
  const shown = (b: { low: number; high: number }) => ({
    low: roundForDisplay(b.low, 5_000, small),
    high: roundForDisplay(b.high, 5_000, small),
  });

  it("carries the federal monthly constant as the exact WPU1412 fraction", () => {
    const dm = lo.model.constants.find((c) => c.id === "dm")!;
    expect(dm.value).toBe((149.359 - 145.456) / 145.456 / 10);
    // Printed as 2.7 percent over ten months and 0.27 percent a month.
    expect((dm.value * 10 * 100).toFixed(1)).toBe("2.7");
    expect((dm.value * 100).toFixed(2)).toBe("0.27");
    // The formula line prints the exact fraction, so a reader who checks
    // the parts term by hand reaches the page's figure to the cent.
    expect(lo.model.formulaText).toContain("(149.359 ÷ 145.456 minus 1) ÷ 10");
    expect(((149.359 / 145.456 - 1) / 10).toFixed(12)).toBe(
      dm.value.toFixed(12),
    );
  });

  it("computes the locked endpoints to the cent at the letter's assumptions", () => {
    expect(term("unbilled").low.toFixed(2)).toBe("2000.00");
    expect(term("unbilled").high.toFixed(2)).toBe("22000.00");
    expect(term("short").low.toFixed(2)).toBe("750.00");
    expect(term("short").high.toFixed(2)).toBe("9000.00");
    expect(term("parts").low.toFixed(2)).toBe("161.00");
    expect(term("parts").high.toFixed(2)).toBe("1341.64");
    const total = rangeOverBands(tree, lo.model, full);
    expect(total.low.toFixed(2)).toBe("2911.00");
    expect(total.high.toFixed(2)).toBe("32341.64");
    expect(formatUsdExact(total.low)).toBe("$2,911");
    expect(Math.round(total.high)).toBe(32_342);
    // The small-dollar rule: the low under $5,000 rounds to $1,000.
    expect(shown(total)).toEqual({ low: 3_000, high: 30_000 });
  });

  it("lands each preset on its locked figures", () => {
    const unbilled = rangeOverBands(tree, lo.model, {
      ...full,
      ...preset("Unbilled lines only"),
    });
    expect(unbilled.low.toFixed(2)).toBe("2000.00");
    expect(unbilled.high.toFixed(2)).toBe("22000.00");
    expect(shown(unbilled)).toEqual({ low: 2_000, high: 20_000 });
    const short = rangeOverBands(tree, lo.model, {
      ...full,
      ...preset("Short pays only"),
    });
    expect(short.low.toFixed(2)).toBe("750.00");
    expect(short.high.toFixed(2)).toBe("9000.00");
    expect(shown(short)).toEqual({ low: 1_000, high: 10_000 });
    const lag = lo.model.sliders.find((s) => s.id === "lag")!;
    expect(lag.presets).toEqual([{ label: "No lag", low: 0, high: 0 }]);
    const noLag = rangeOverBands(tree, lo.model, {
      ...full,
      lag: { low: 0, high: 0 },
    });
    expect(noLag.low.toFixed(2)).toBe("2750.00");
    expect(noLag.high.toFixed(2)).toBe("31000.00");
  });

  it("scales the cent-rounded range at the relay's locked volumes, to the cent", () => {
    expect(lo.model.volumeFromCents).toBe(true);
    const exact = toCents(rangeOverBands(tree, lo.model, full));
    const locked: [number, string, string, number, number][] = [
      [600, "$17,466", "$194,049.84", 15_000, 195_000],
      [900, "$26,199", "$291,074.76", 25_000, 290_000],
      [1_200, "$34,932", "$388,099.68", 35_000, 390_000],
    ];
    for (const [n, low, high, shownLow, shownHigh] of locked) {
      const scaled = scaleToVolume(exact, n, 100);
      expect(formatUsdExact(scaled.low)).toBe(low);
      expect(formatUsdExact(scaled.high)).toBe(high);
      expect(displayedAtVolume(exact, n, 100, 5_000, small)).toEqual({
        low: shownLow,
        high: shownHigh,
      });
    }
  });

  it("displays the rounding rules applied to the scaled exact, for any volume, in every state", () => {
    const bandSets = [
      full,
      { ...full, ...preset("Unbilled lines only") },
      { ...full, ...preset("Short pays only") },
      { ...full, lag: { low: 0, high: 0 } },
    ];
    let seed = 97;
    const rand = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    const volumes = [1, 50, 100, 600, 900, 1_200, 7_777];
    for (let i = 0; i < 200; i += 1)
      volumes.push(1 + Math.floor(rand() * 49_999));
    for (const bands of bandSets) {
      const exact = toCents(rangeOverBands(tree, lo.model, bands));
      for (const n of volumes) {
        const got = displayedAtVolume(exact, n, 100, lo.model.roundTo, small);
        expect(got.low).toBe(
          roundForDisplay((exact.low * n) / 100, lo.model.roundTo, small),
        );
        expect(got.high).toBe(
          roundForDisplay((exact.high * n) / 100, lo.model.roundTo, small),
        );
      }
    }
  });

  it("keeps the unbilled-lines log consistent: hours at $72, $247.50 in all", () => {
    const ledger = lo.proposal.ledger!;
    const cents = (t: string) =>
      Math.round(Number(t.replace(/[$,]/g, "")) * 100);
    let hours = 0;
    let cost = 0;
    for (const row of ledger.rows) {
      const [, h, c] = row.cells as [string, string, string, string];
      // $72 an hour, to the cent, from the hours as printed.
      expect(cents(c)).toBe(Math.round(Number(h) * 7_200));
      hours += Number(h);
      cost += cents(c);
    }
    expect(hours).toBe(3.4375);
    expect(cost).toBe(24_750);
    expect(ledger.total!.cells).toEqual(["3.4375", "$247.50", ""]);
    expect(ledger.rows.map((r) => [r.cells[0], r.cells[3]])).toEqual([
      ["Final verification of measurements", "A little under half"],
      ["Feather, prime and block", "Not published"],
      ["Stall cure time", "About two thirds"],
      ["Test drive and post-repair scan", "Not published"],
      ["Pinch-weld coating removal", "One in five"],
    ]);
    expect(ledger.note).toContain("$72 door rate");
  });

  it("quotes the letter and relay word for word where the page overlaps them", () => {
    expect(lo.token).toBe("lorens-body-662f7fb5a7");
    expect(lo.hero.heading).toBe(
      "Loren's Body Shop, a cost model sent for correction",
    );
    expect(lo.model.letterRange).toEqual({ low: 3_000, high: 30_000 });
    expect(lo.hero.subline.startsWith("(exact: $2,911 and $32,342)")).toBe(
      true,
    );
    expect(lo.model.smallRound).toEqual({
      under: 5_000,
      step: 1_000,
      note: "Under $5,000, a figure rounds to the nearest $1,000.",
    });
    expect(lo.model.constants[0]!.text).toBe(
      "Federal series: BLS producer price index, motor vehicle parts (WPU1412), 145.456 in October 2025 to 149.359 in August 2026, its latest published month: up 2.7 percent over ten months, 0.27 percent per month [[BENCHMARK]]. The model applies it only across the weeks between estimate and parts order. Next release October 15, 2026; this page changes with it.",
    );
    expect(lo.model.disclosure).toBeUndefined();
    expect(lo.proposal.lead).toBe(
      "The proposal: the count (operations performed against billed, by insurer, with every short pay), the line (your not-included operations and the proof each needs, on every estimate), and the thirty-day result; fixed fee between $1,500 and $2,500; read-only; no customer or vehicle identity leaves the building.",
    );
    expect(lo.proposal.fee).toBe("A fixed fee between $1,500 and $2,500.");
    for (const required of [
      "WPU1412",
      "2.7 percent",
      "October 15",
      "473 shops",
      "not-included",
      "the line",
    ])
      expect(JSON.stringify(lo), required).toContain(required);
    expect(lo.sources.at(-1)).toBe(
      "This page contains no client data, and no customer or vehicle identity.",
    );
  });

  it("holds its heading's height through the font swap", () => {
    // Fraunces sets the heading in three lines up to 380px and two up to
    // 717px; the fallback face changes at 347 and 643, so without the
    // reservation the page moved when the font arrived.
    expect(lo.hero.headingLines).toEqual([
      { upTo: 380, lines: 3 },
      { upTo: 717, lines: 2 },
    ]);
  });

  it("carries none of the kill-list terms", () => {
    const text = JSON.stringify(lo);
    for (const term of [
      "–",
      "—",
      "artificial intelligence",
      "machine learning",
      "Caliber",
      "Gerber",
      "Crash Champions",
      "uncle",
      "father",
      "handed",
      "small town",
    ]) {
      expect(text.toLowerCase().includes(term.toLowerCase()), term).toBe(false);
    }
    expect(/\bAI\b/.test(text), "AI as a word").toBe(false);
    expect(/\bDRP\b/.test(text), "DRP as an acronym").toBe(false);
    expect(/\bsons?\b/i.test(text), "son or sons as a word").toBe(false);
    expect(/\bVIN\b|\bplates?\b/i.test(text), "vehicle identity").toBe(false);
    expect(
      /\b(\d+|one|two|three|four|five|six|seven|eight|nine|ten|twelve|twenty) (people|employees|staff|technicians)\b/i.test(
        text,
      ),
      "employee count",
    ).toBe(false);
    expect(patientTermsOutsideAllowlist(text)).toEqual([]);
  });
});

describe("M&M Body Shop model", () => {
  const mm = allDashboards().find((d) => d.slug === "mm")!;
  const tree = compileFormula(totalFormula(mm.model.terms));
  const full = restBands(mm.model.sliders);
  const small = mm.model.smallRound;
  const term = (id: string, bands = full) =>
    rangeOverBands(
      compileFormula(mm.model.terms.find((t) => t.id === id)!.formula),
      mm.model,
      bands,
    );
  const preset = (label: string) =>
    mm.model.presets!.items.find((p) => p.label === label)!.bands;
  const shown = (b: { low: number; high: number }) => ({
    low: roundForDisplay(b.low, 5_000, small),
    high: roundForDisplay(b.high, 5_000, small),
  });

  it("carries the same federal monthly constant as the exact WPU1412 fraction", () => {
    const dm = mm.model.constants.find((c) => c.id === "dm")!;
    expect(dm.value).toBe((149.359 - 145.456) / 145.456 / 10);
    expect(mm.model.formulaText).toContain("(149.359 ÷ 145.456 minus 1) ÷ 10");
  });

  it("computes the locked endpoints to the cent at the letter's assumptions", () => {
    expect(term("second").low.toFixed(2)).toBe("2400.00");
    expect(term("second").high.toFixed(2)).toBe("14000.00");
    expect(term("unpaid").low.toFixed(2)).toBe("800.00");
    expect(term("unpaid").high.toFixed(2)).toBe("22500.00");
    expect(term("parts").low.toFixed(2)).toBe("161.00");
    expect(term("parts").high.toFixed(2)).toBe("1341.64");
    const total = rangeOverBands(tree, mm.model, full);
    expect(total.low.toFixed(2)).toBe("3361.00");
    expect(total.high.toFixed(2)).toBe("37841.64");
    expect(formatUsdExact(total.low)).toBe("$3,361");
    expect(Math.round(total.high)).toBe(37_842);
    expect(shown(total)).toEqual({ low: 3_000, high: 40_000 });
  });

  it("lands each preset on its locked figures, half up at the $22,500 tie", () => {
    const second = rangeOverBands(tree, mm.model, {
      ...full,
      ...preset("Second estimates only"),
    });
    expect(second.low.toFixed(2)).toBe("2400.00");
    expect(second.high.toFixed(2)).toBe("14000.00");
    expect(shown(second)).toEqual({ low: 2_000, high: 15_000 });
    const unpaid = rangeOverBands(tree, mm.model, {
      ...full,
      ...preset("Unpaid required lines only"),
    });
    expect(unpaid.low.toFixed(2)).toBe("800.00");
    expect(unpaid.high.toFixed(2)).toBe("22500.00");
    // $22,500 sits exactly halfway between $20,000 and $25,000. Half up,
    // one mechanical rule everywhere: it displays $25,000.
    expect(shown(unpaid)).toEqual({ low: 1_000, high: 25_000 });
    const lag = mm.model.sliders.find((s) => s.id === "lag")!;
    expect(lag.presets).toEqual([{ label: "No lag", low: 0, high: 0 }]);
    const noLag = rangeOverBands(tree, mm.model, {
      ...full,
      lag: { low: 0, high: 0 },
    });
    expect(noLag.low.toFixed(2)).toBe("3200.00");
    expect(noLag.high.toFixed(2)).toBe("36500.00");
  });

  it("scales the cent-rounded range at the relay's locked volumes, to the cent", () => {
    expect(mm.model.volumeFromCents).toBe(true);
    const exact = toCents(rangeOverBands(tree, mm.model, full));
    const locked: [number, string, string, number, number][] = [
      [800, "$26,888", "$302,733.12", 25_000, 305_000],
      [1_200, "$40,332", "$454,099.68", 40_000, 455_000],
      [1_800, "$60,498", "$681,149.52", 60_000, 680_000],
    ];
    for (const [n, low, high, shownLow, shownHigh] of locked) {
      const scaled = scaleToVolume(exact, n, 100);
      expect(formatUsdExact(scaled.low)).toBe(low);
      expect(formatUsdExact(scaled.high)).toBe(high);
      expect(displayedAtVolume(exact, n, 100, 5_000, small)).toEqual({
        low: shownLow,
        high: shownHigh,
      });
    }
  });

  it("displays the rounding rules applied to the scaled exact, for any volume, in every state", () => {
    const bandSets = [
      full,
      { ...full, ...preset("Second estimates only") },
      { ...full, ...preset("Unpaid required lines only") },
      { ...full, lag: { low: 0, high: 0 } },
    ];
    let seed = 101;
    const rand = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    const volumes = [1, 50, 100, 800, 1_200, 1_800, 7_777];
    for (let i = 0; i < 200; i += 1)
      volumes.push(1 + Math.floor(rand() * 49_999));
    for (const bands of bandSets) {
      const exact = toCents(rangeOverBands(tree, mm.model, bands));
      for (const n of volumes) {
        const got = displayedAtVolume(exact, n, 100, mm.model.roundTo, small);
        expect(got.low).toBe(
          roundForDisplay((exact.low * n) / 100, mm.model.roundTo, small),
        );
        expect(got.high).toBe(
          roundForDisplay((exact.high * n) / 100, mm.model.roundTo, small),
        );
      }
    }
  });

  it("keeps the second-estimate log consistent: five lines, $412.00", () => {
    const ledger = mm.proposal.ledger!;
    const cents = (t: string) =>
      Math.round(Number(t.replace(/[$,]/g, "")) * 100);
    expect(ledger.rows.map((r) => r.cells)).toEqual([
      ["Pre-repair scan", "$85.00", "yes"],
      ["Post-repair scan", "$85.00", "yes"],
      ["One-time-use fastener kit", "$42.00", "yes"],
      ["ADAS camera calibration", "$150.00", "yes"],
      ["Seam sealer per procedure", "$50.00", "yes"],
    ]);
    const sum = ledger.rows.reduce((acc, row) => acc + cents(row.cells[1]!), 0);
    expect(sum).toBe(41_200);
    expect(ledger.total!.cells).toEqual(["$412.00", ""]);
  });

  it("quotes the letter and relay word for word where the page overlaps them", () => {
    expect(mm.token).toBe("mm-body-d5ff5864f7");
    expect(mm.hero.heading).toBe(
      "M&M Body Shop, a cost model sent for correction",
    );
    expect(mm.model.letterRange).toEqual({ low: 3_000, high: 40_000 });
    expect(mm.hero.subline.startsWith("(exact: $3,361 and $37,842)")).toBe(
      true,
    );
    expect(mm.model.constants[0]!.text).toBe(
      "Federal series: BLS producer price index, motor vehicle parts (WPU1412), 145.456 in October 2025 to 149.359 in August 2026, its latest published month: up 2.7 percent over ten months, 0.27 percent per month [[BENCHMARK]]. The model applies it only across the weeks between estimate and parts order. Next release October 15, 2026; this page changes with it.",
    );
    expect(mm.proposal.lead).toBe(
      "The proposal: the count (first estimate against final, supplements by cause, required operations performed against paid), the repair plan after teardown with the manufacturer's procedure attached to every required line, and the thirty-day result; fixed fee between $1,500 and $2,500; read-only; no customer or vehicle identity leaves the building.",
    );
    expect(mm.proposal.fee).toBe("A fixed fee between $1,500 and $2,500.");
    for (const required of [
      "WPU1412",
      "2.7 percent",
      "October 15",
      "473 shops",
      "teardown",
      "repair plan",
    ])
      expect(JSON.stringify(mm), required).toContain(required);
    expect(mm.sources.at(-1)).toBe(
      "This page contains no client data, and no customer or vehicle identity.",
    );
  });

  it("holds its heading's height through the font swap", () => {
    // Fraunces sets the heading in three lines up to 380px and two up to
    // 693px; the fallback face changes at 337 and 629, so without the
    // reservation the page moved when the font arrived.
    expect(mm.hero.headingLines).toEqual([
      { upTo: 380, lines: 3 },
      { upTo: 693, lines: 2 },
    ]);
  });

  it("carries none of the kill-list terms", () => {
    const text = JSON.stringify(mm);
    for (const term of [
      "–",
      "—",
      "artificial intelligence",
      "machine learning",
      "Caliber",
      "Missy",
      "Drew",
      "Andrew",
      "Cookson",
      "1984",
      "1989",
      "father",
      "handed",
    ]) {
      expect(text.toLowerCase().includes(term.toLowerCase()), term).toBe(false);
    }
    expect(/\bAI\b/.test(text), "AI as a word").toBe(false);
    expect(/\bDRP\b/.test(text), "DRP as an acronym").toBe(false);
    expect(/\bsons?\b/i.test(text), "son or sons as a word").toBe(false);
    expect(/\bVIN\b|\bplates?\b/i.test(text), "vehicle identity").toBe(false);
    expect(
      /\b(\d+|one|two|three|four|five|six|seven|eight|nine|ten|twelve|twenty) (people|employees|staff|technicians)\b/i.test(
        text,
      ),
      "employee count",
    ).toBe(false);
    expect(patientTermsOutsideAllowlist(text)).toEqual([]);
  });
});

describe("Generations Custom Auto & Collision model", () => {
  const ge = allDashboards().find((d) => d.slug === "generations")!;
  const tree = compileFormula(totalFormula(ge.model.terms));
  const full = restBands(ge.model.sliders);
  const small = ge.model.smallRound;
  const term = (id: string, bands = full) =>
    rangeOverBands(
      compileFormula(ge.model.terms.find((t) => t.id === id)!.formula),
      ge.model,
      bands,
    );
  const preset = (label: string) =>
    ge.model.presets!.items.find((p) => p.label === label)!.bands;
  const shown = (b: { low: number; high: number }) => ({
    low: roundForDisplay(b.low, 5_000, small),
    high: roundForDisplay(b.high, 5_000, small),
  });

  it("carries the federal monthly constant as the exact WPU1412 fraction", () => {
    const dm = ge.model.constants.find((c) => c.id === "dm")!;
    expect(dm.value).toBe((149.359 - 145.456) / 145.456 / 10);
    expect(ge.model.formulaText).toContain("(149.359 ÷ 145.456 minus 1) ÷ 10");
    // The collision share is held at the model's 70 percent.
    const k = ge.model.sliders.find((s) => s.id === "k")!;
    expect(k.rest).toEqual({ low: 70, high: 70 });
  });

  it("computes the locked endpoints to the cent at the letter's assumptions", () => {
    expect(term("custom").low.toFixed(2)).toBe("1375.00");
    expect(term("custom").high.toFixed(2)).toBe("51000.00");
    expect(term("collision").low.toFixed(2)).toBe("1400.00");
    expect(term("collision").high.toFixed(2)).toBe("15400.00");
    expect(term("parts").low.toFixed(2)).toBe("161.00");
    expect(term("parts").high.toFixed(2)).toBe("1341.64");
    const total = rangeOverBands(tree, ge.model, full);
    expect(total.low.toFixed(2)).toBe("2936.00");
    expect(total.high.toFixed(2)).toBe("67741.64");
    expect(formatUsdExact(total.low)).toBe("$2,936");
    expect(Math.round(total.high)).toBe(67_742);
    expect(shown(total)).toEqual({ low: 3_000, high: 70_000 });
  });

  it("lands each preset on its locked figures", () => {
    const custom = rangeOverBands(tree, ge.model, {
      ...full,
      ...preset("Custom only"),
    });
    expect(custom.low.toFixed(2)).toBe("1375.00");
    expect(custom.high.toFixed(2)).toBe("51000.00");
    expect(shown(custom)).toEqual({ low: 1_000, high: 50_000 });
    const collision = rangeOverBands(tree, ge.model, {
      ...full,
      ...preset("Collision lines only"),
    });
    expect(collision.low.toFixed(2)).toBe("1400.00");
    expect(collision.high.toFixed(2)).toBe("15400.00");
    expect(shown(collision)).toEqual({ low: 1_000, high: 15_000 });
    const lag = ge.model.sliders.find((s) => s.id === "lag")!;
    expect(lag.presets).toEqual([{ label: "No lag", low: 0, high: 0 }]);
    const noLag = rangeOverBands(tree, ge.model, {
      ...full,
      lag: { low: 0, high: 0 },
    });
    expect(noLag.low.toFixed(2)).toBe("2775.00");
    expect(noLag.high.toFixed(2)).toBe("66400.00");
  });

  it("scales the cent-rounded range at the relay's locked volumes, to the cent", () => {
    expect(ge.model.volumeFromCents).toBe(true);
    const exact = toCents(rangeOverBands(tree, ge.model, full));
    const locked: [number, string, string, number, number][] = [
      [500, "$14,680", "$338,708.20", 15_000, 340_000],
      [800, "$23,488", "$541,933.12", 25_000, 540_000],
      [1_200, "$35,232", "$812,899.68", 35_000, 815_000],
    ];
    for (const [n, low, high, shownLow, shownHigh] of locked) {
      const scaled = scaleToVolume(exact, n, 100);
      expect(formatUsdExact(scaled.low)).toBe(low);
      expect(formatUsdExact(scaled.high)).toBe(high);
      expect(displayedAtVolume(exact, n, 100, 5_000, small)).toEqual({
        low: shownLow,
        high: shownHigh,
      });
    }
  });

  it("displays the rounding rules applied to the scaled exact, for any volume, in every state", () => {
    const bandSets = [
      full,
      { ...full, ...preset("Custom only") },
      { ...full, ...preset("Collision lines only") },
      { ...full, lag: { low: 0, high: 0 } },
    ];
    let seed = 103;
    const rand = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    const volumes = [1, 50, 100, 500, 800, 1_200, 7_777];
    for (let i = 0; i < 200; i += 1)
      volumes.push(1 + Math.floor(rand() * 49_999));
    for (const bands of bandSets) {
      const exact = toCents(rangeOverBands(tree, ge.model, bands));
      for (const n of volumes) {
        const got = displayedAtVolume(exact, n, 100, ge.model.roundTo, small);
        expect(got.low).toBe(
          roundForDisplay((exact.low * n) / 100, ge.model.roundTo, small),
        );
        expect(got.high).toBe(
          roundForDisplay((exact.high * n) / 100, ge.model.roundTo, small),
        );
      }
    }
  });

  it("keeps the four-line log consistent: 365 unbilled hours, $26,280.00 at $72", () => {
    const ledger = ge.proposal.ledger!;
    const n = (t: string) => Number(t.replace(/[$,]/g, ""));
    const cents = (t: string) => Math.round(n(t) * 100);
    const sums = [0, 0, 0, 0];
    for (const row of ledger.rows) {
      const [, billed, worked, unbilled, atRate] = row.cells as [
        string,
        string,
        string,
        string,
        string,
      ];
      expect(n(unbilled)).toBe(n(worked) - n(billed));
      expect(cents(atRate)).toBe(n(unbilled) * 7_200);
      sums[0] += n(billed);
      sums[1] += n(worked);
      sums[2] += n(unbilled);
      sums[3] += cents(atRate);
    }
    // The relay's quarter: hours billed of worked per line, towing at flat
    // fees with no hours counted.
    expect(ledger.rows.map((r) => r.cells.slice(0, 3))).toEqual([
      ["Collision, 110 jobs", "1,420", "1,560"],
      ["Commercial, 14 jobs", "310", "345"],
      ["Custom, 9 jobs", "520", "710"],
      ["Towing, 160 calls at flat fees", "0", "0"],
    ]);
    expect(sums).toEqual([2_250, 2_615, 365, 2_628_000]);
    expect(ledger.total!.cells).toEqual([
      "2,250",
      "2,615",
      "365",
      "$26,280.00",
    ]);
  });

  it("quotes the letter and relay word for word where the page overlaps them", () => {
    expect(ge.token).toBe("generations-collision-ddfccff8ab");
    expect(ge.hero.heading).toBe(
      "Generations Custom Auto & Collision, a cost model sent for correction",
    );
    expect(ge.model.letterRange).toEqual({ low: 3_000, high: 70_000 });
    expect(ge.hero.subline.startsWith("(exact: $2,936 and $67,742)")).toBe(
      true,
    );
    expect(ge.model.constants[0]!.text).toBe(
      "Federal series: BLS producer price index, motor vehicle parts (WPU1412), 145.456 in October 2025 to 149.359 in August 2026, its latest published month: up 2.7 percent over ten months, 0.27 percent per month [[BENCHMARK]]. The model applies it only across the weeks between estimate and parts order. Next release October 15, 2026; this page changes with it.",
    );
    expect(ge.proposal.lead).toBe(
      "The proposal: the four-line count (collision, commercial, custom, towing: hours worked against billed, operations performed against billed, backlog in days), the decision page in your words, and the first month run on it, counted; fixed fee between $1,500 and $2,500; read-only; no customer or vehicle identity leaves the building.",
    );
    expect(ge.proposal.fee).toBe("A fixed fee between $1,500 and $2,500.");
    for (const required of [
      "WPU1412",
      "2.7 percent",
      "October 15",
      "473 shops",
      "four-line",
      "backlog",
    ])
      expect(JSON.stringify(ge), required).toContain(required);
    expect(ge.sources.at(-1)).toBe(
      "This page contains no client data, and no customer or vehicle identity.",
    );
  });

  it("holds its heading's height through the font swap", () => {
    // Fraunces sets the heading in five lines up to 317px, four up to 380px,
    // three up to 543px and two from there on; the fallback face changes at
    // 337, 494 and 1024, so without the reservation the page moved when the
    // font arrived.
    expect(ge.hero.headingLines).toEqual([
      { upTo: 317, lines: 5 },
      { upTo: 380, lines: 4 },
      { upTo: 543, lines: 3 },
      { upTo: 3840, lines: 2 },
    ]);
  });

  it("carries none of the kill-list terms", () => {
    const text = JSON.stringify(ge);
    for (const term of [
      "–",
      "—",
      "artificial intelligence",
      "machine learning",
      "Caliber",
      "Gerber",
      "Crash Champions",
      "ABRA",
      "CollisionRight",
      "Service King",
      "Classic Collision",
      "grandfather",
      "father",
      "handed",
      "1929",
    ]) {
      expect(text.toLowerCase().includes(term.toLowerCase()), term).toBe(false);
    }
    expect(/\bAI\b/.test(text), "AI as a word").toBe(false);
    expect(/\bDRP\b/.test(text), "DRP as an acronym").toBe(false);
    expect(/\bsons?\b/i.test(text), "son or sons as a word").toBe(false);
    expect(/\bVIN\b|\bplates?\b/i.test(text), "vehicle identity").toBe(false);
    expect(
      /\b(\d+|one|two|three|four|five|six|seven|eight|nine|ten|twelve|twenty) (people|employees|staff|technicians)\b/i.test(
        text,
      ),
      "employee count",
    ).toBe(false);
    expect(patientTermsOutsideAllowlist(text)).toEqual([]);
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
        low: roundForDisplay(span.low, d.model.roundTo, d.model.smallRound),
        high: roundForDisplay(span.high, d.model.roundTo, d.model.smallRound),
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

  it('uses "patient" only inside our own privacy phrase', () => {
    // The standing rule lives in kill-scan.ts: "no patient information" is
    // allowed; any other use of the word fails, on every page.
    for (const d of dashboards)
      expect({
        slug: d.slug,
        stray: patientTermsOutsideAllowlist(JSON.stringify(d)),
      }).toEqual({ slug: d.slug, stray: [] });
    expect(patientTermsOutsideAllowlist(JSON.stringify(sharedCopy()))).toEqual(
      [],
    );
  });

  it("allows the exact privacy phrase and nothing else", () => {
    expect(
      patientTermsOutsideAllowlist(
        "read-only; no patient information leaves the building.",
      ),
    ).toEqual([]);
    for (const stray of [
      "patient names",
      "Patient data",
      "our patients",
      "No patient information",
      "no patient information and patient charts",
    ])
      expect(patientTermsOutsideAllowlist(stray), stray).not.toEqual([]);
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
