import { describe, expect, it } from "vitest";

import { computeExample, openingBands, resultSentence } from "./model";
import { allLetterPages } from "./registry";

/**
 * The page for Quinton Residential Living, pinned word for word.
 *
 * Everything below is approved text: the letter's own blocks, the new
 * sections, every diagram label, every metric name, every line of the
 * illustration, and the worked example's inputs. Any change to the config
 * that is not also made here, on purpose, fails.
 */
const approved = {
  slug: "quinton",
  token: "quinton-residential-2419d6c0f8",
  company: {
    name: "Quinton Residential Living",
  },
  tabTitle: "Quinton Residential Living: the call-off line",
  title: "The hour after a call-off at Quinton",
  subtitle: "A thirty-day pilot on one region's night and weekend shifts.",
  handoff: {
    body: "A call-off at nine at night goes to a supervisor with a list. The substitute must clear the state's HCSP registry before working. Overtime goes to whoever answers. An open shift is unbilled hours and an incident report. Nobody counts the hour, the overtime, or the shifts left open.",
    diagram: {
      title: "Today",
      steps: [
        {
          label: "Call-off, 9 pm",
        },
        {
          label: "Supervisor opens the phone list",
        },
        {
          label: "Calls one by one",
        },
        {
          label: "List is stale; registry unchecked; overtime unplanned",
          fail: true,
        },
        {
          label: "Shift stays open, or overtime",
        },
      ],
    },
  },
  whyNow: {
    body: "Quinton covers more than two hundred people every night. Every open shift is a person without the staff the plan promises, which is an incident report and unbilled hours in the same breath. The state froze expansion on August 1, 2026, so this winter the only growth available is running the shifts you already have better. And the people who fill them turn over at 37.5 percent a year, so the list the supervisor calls from is never current. The hour after a call-off is where that all lands, and it lands on one person with a phone.",
  },
  rule: {
    body: "Indiana providers lost 37.5 percent of their direct support staff last year, and one in five had been there under six months (National Core Indicators, State of the Workforce 2024, Indiana data from 170 agencies). Every DSP serving under the CIH or FSW must hold HCSP certification, checked on the state's public registry. Since August 1, 2026 providers cannot add counties or services for six months (Indiana Medicaid bulletin BT2026124).",
    links: [
      {
        text: "National Core Indicators, State of the Workforce 2024",
        href: "https://idd.nationalcoreindicators.org/wp-content/uploads/2025/12/2024-NCI-IDD-SoTW_Final-Tagged.pdf",
      },
      {
        text: "the state's public registry",
        href: "https://www.in.gov/fssa/ddars/bds/hcsp-training-registry",
      },
      {
        text: "Indiana Medicaid bulletin BT2026124",
        href: "https://www.in.gov/medicaid/providers/files/bulletins/BT2026124.pdf",
      },
    ],
    figures: [
      {
        figure: "37.5 percent",
        line: "Indiana providers lost 37.5 percent of their direct support staff last year",
        source: "National Core Indicators, State of the Workforce 2024",
      },
      {
        figure: "one in five",
        line: "one in five had been there under six months",
        source: "National Core Indicators, State of the Workforce 2024",
      },
      {
        figure: "six months",
        line: "Since August 1, 2026 providers cannot add counties or services for six months",
        source: "Indiana Medicaid bulletin BT2026124",
      },
    ],
  },
  build: {
    body: "A call-off line. Staff text or call one number. It finds eligible people by certification, distance and hours worked, offers the shift by text and voice, confirms, writes it back to the schedule, and logs every step. It holds names, certifications and times, never a clinical record. It lives inside what you already run.",
    diagram: {
      title: "With the call-off line",
      steps: [
        {
          label: "Call-off, 9 pm",
        },
        {
          label: "One number, text or voice",
        },
        {
          label: "Eligible staff by certification, distance, hours worked",
        },
        {
          label: "Offer by text and voice",
        },
        {
          label: "Confirmed; schedule updated",
        },
        {
          label: "Every step logged",
        },
      ],
    },
    neverTouches:
      "Clinical records, care plans, incident reports. It holds names, certifications and shift times.",
  },
  whyItWorks: [
    {
      text: "Agencies this size already fill shifts this way. HomeWell of Colorado, about 120 caregivers, cut shift fill from hours to 15 to 30 minutes with a text and voice line (published case, 2025).",
      href: "https://www.phoebe.work/customers/homewell-colorado",
    },
    {
      text: "A Medicaid-funded agency cut after-hours scheduling labor by 82 percent with the same shape of software (published case, 2025).",
      href: "https://zingage.com/case-studies",
    },
    {
      text: "Those products sell to agencies on large scheduling platforms. Quinton runs AccelTrax and forms. We build the small version inside what you have, and if a product you already own does it, we say so.",
    },
  ],
  example: {
    title: "What a hundred call-offs cost today",
    inputs: [
      {
        id: "supMinutes",
        label: "Supervisor time per call-off",
        stated: "45 to 90 minutes.",
        tag: "ASSUMED",
        format: "minutes",
        min: 15,
        max: 180,
        step: 5,
        low: 45,
        high: 90,
        reason: "The phone list, one call at a time.",
      },
      {
        id: "supRate",
        label: "Supervisor cost per hour",
        stated: "$25 to $35.",
        tag: "ASSUMED",
        format: "usd",
        min: 15,
        max: 60,
        step: 1,
        low: 25,
        high: 35,
        reason: "Loaded, for a house supervisor or on-call manager.",
      },
      {
        id: "otShare",
        label: "Share of shifts filled on overtime",
        stated: "40 to 70 percent.",
        tag: "ASSUMED",
        format: "percent",
        min: 0,
        max: 100,
        step: 5,
        low: 40,
        high: 70,
        reason: "Whoever answers first is usually already on the schedule.",
      },
      {
        id: "otPremium",
        label: "Overtime premium per shift",
        stated: "$64.",
        tag: "OBSERVED",
        format: "usd",
        min: 0,
        max: 150,
        step: 1,
        low: 64,
        high: 64,
        reason:
          "Half of a $16 hourly rate over an eight-hour shift. $16 is the DSP wage in Quinton's own posting.",
      },
      {
        id: "openShifts",
        label: "Shifts left open",
        stated: "5 to 15 of every hundred.",
        tag: "ASSUMED",
        format: "count",
        min: 0,
        max: 40,
        step: 1,
        low: 5,
        high: 15,
        reason:
          "Counted, not priced; an open shift is unbilled hours and an incident report.",
      },
    ],
    constants: [],
    spans: [],
    formula: "100 * (supMinutes / 60) * supRate + 100 * otShare * otPremium",
    outputs: [
      {
        id: "open",
        formula: "openShifts",
      },
    ],
    result:
      "Per hundred call-offs, supervisor time and overtime premium together: {usd} (exact: {exact}), plus {open} shifts that stayed open.",
    context:
      "Indiana DSP turnover 37.5 percent; one in five DSPs under six months (National Core Indicators, 2024). A stale list is the normal condition, not a bad month.",
  },
  morning: {
    kind: "thread",
    bubbles: [
      {
        tone: "grey",
        meta: "9:04 PM",
        text: "Marcus, I can't make the 10 pm at Elm House. Sick.",
      },
      {
        tone: "dark",
        meta: "9:04 PM",
        text: "Got it, Marcus. You're off tonight. Offering the shift now.",
      },
      {
        tone: "grey",
        meta: "to Dana, 9:05 PM",
        text: "Dana, Elm House 10 pm to 6 am is open tonight. You're certified and under 32 hours this week. Reply YES to take it.",
      },
      {
        tone: "grey",
        meta: "9:07 PM",
        text: "YES",
      },
      {
        tone: "dark",
        meta: "9:07 PM",
        text: "Confirmed. Dana covers Elm House 10 pm. Schedule updated. Supervisor notified.",
      },
    ],
    caption: "Filled in 3 minutes. No overtime. Logged.",
  },
  thirtyDays: {
    body: "Week one is the count from your on-call log: time to fill, overtime, open shifts. Then the line runs for the rest of the month, and you read the same three numbers against the count. Fixed fee $1,950. Stop any time. If AccelTrax already does this well for you, we say so on the first call.",
    metrics: ["Time to fill a shift", "Overtime hours", "Shifts left open"],
    receive: [
      "The count: one sheet from your on-call log, week one.",
      "The call-off line: one phone number your staff text or call.",
      "Offers by text and voice to eligible staff, in your order of preference.",
      "Write-back to your schedule and a log of every offer and answer.",
      "The day-thirty readout: the same three numbers against the count.",
    ],
    fee: "$1,950",
  },
  sources:
    "Sources: qrlcares.com and intrinsicbehavioral.com, October 2026. CARF listings. National Core Indicators, State of the Workforce 2024. Indiana FSSA, HCSP training registry. Indiana Medicaid bulletin BT2026124.",
};

describe("the quinton letter page", () => {
  const page = allLetterPages().find((p) => p.slug === "quinton")!;

  it("matches the approved copy exactly", () => {
    expect(page).toEqual(approved);
  });

  it("computes the worked example to the proposal's exact figures", () => {
    const result = computeExample(page.example, openingBands(page.example));

    expect(result.exact).toEqual({ low: 4435, high: 9730 });
    expect(result.display).toEqual({ low: 4000, high: 10000 });
  });

  it("states the result line as written", () => {
    const result = computeExample(page.example, openingBands(page.example));

    expect(resultSentence(page.example.result, result)).toBe(
      "Per hundred call-offs, supervisor time and overtime premium together: $4,000 to $10,000 (exact: $4,435 and $9,730), plus 5 to 15 shifts that stayed open.",
    );
  });
});
