import { describe, expect, it } from "vitest";

import { computeExample, openingBands, resultSentence } from "./model";
import { allLetterPages } from "./registry";

/**
 * The page for Integrity Care, pinned word for word.
 *
 * Everything below is approved text: the letter's own blocks, the new
 * sections, every diagram label, every metric name, every line of the
 * illustration, and the worked example's inputs. Any change to the config
 * that is not also made here, on purpose, fails.
 */
const approved = {
  slug: "integritycare",
  token: "integrity-care-ed133386b7",
  company: {
    name: "Integrity Care",
  },
  tabTitle: "Integrity Care: the nightly EVV check",
  title: "The EVV denial list at Integrity Care, built the night before",
  subtitle: "A nightly check, proven in thirty days.",
  handoff: {
    body: "You learn which visits failed when the remittance arrives, after the claim went out, across three managed care portals and the state portal.",
    diagram: {
      title: "Today",
      steps: [
        {
          label: "Visit",
        },
        {
          label: "EVV record",
        },
        {
          label: "Claim to Anthem, Humana, UnitedHealthcare or IHCP",
        },
        {
          label: "Remittance arrives",
        },
        {
          label: "Denied lines, 0950 or 0952",
          fail: true,
        },
        {
          label: "Rework and resubmit",
        },
      ],
    },
  },
  whyNow: {
    body: "Integrity Care bills three managed care plans and the state from one office in Lafayette, with every visit passing through EVV. The denial list arrives after the claim, as a remittance, weeks later. The causes are known and published by the state's own contractor; they are the same handful every time. A small agency with that many payers and that few people cannot afford to find them by reading remittances. It has to find them the night before.",
  },
  rule: {
    body: "Since 2024 Indiana denies a claim with no matching EVV record outright, codes 0950 and 0952, no grace period on PathWays (Indiana FSSA, EVV frequently asked questions). The state's own training lists the causes: units above what the aggregator holds, exceptions nobody cleared, visits entered by hand, the wrong service code, a claim sent before the vendor uploaded (Gainwell, IHCP Works). In a comparable state program, seven in ten visits needed a manual fix before billing (North Carolina Medicaid, EVV provider forum, June 2024).",
    links: [
      {
        text: "Indiana FSSA, EVV frequently asked questions",
        href: "https://www.in.gov/medicaid/providers/files/Electronic_Visit_Verification_FAQs.pdf",
      },
      {
        text: "Gainwell, IHCP Works",
        href: "https://www.in.gov/medicaid/providers/files/IHCP-Works-2022-Gainwell-EVV-Pitfalls-and-Prevention.pdf",
      },
      {
        text: "North Carolina Medicaid, EVV provider forum, June 2024",
        href: "https://medicaid.ncdhhs.gov/evv-presentation-ltss-provider-forum-june-25-2024/download",
      },
    ],
    figures: [
      {
        figure: "0950 and 0952",
        line: "Since 2024 Indiana denies a claim with no matching EVV record outright, codes 0950 and 0952, no grace period on PathWays",
        source: "Indiana FSSA, EVV frequently asked questions",
      },
      {
        figure: "seven in ten",
        line: "In a comparable state program, seven in ten visits needed a manual fix before billing",
        source: "North Carolina Medicaid, EVV provider forum, June 2024",
      },
    ],
  },
  build: {
    body: "The nightly check. Your EVV export and your schedule against the draft claim line, every evening, with the lines that will fail listed by cause before anyone presses submit. Member identifiers stay in your systems under a signed business associate agreement.",
    diagram: {
      title: "With the nightly check",
      steps: [
        {
          label: "Visit",
        },
        {
          label: "EVV export and schedule, every evening",
        },
        {
          label: "Matched against the draft claim lines",
        },
        {
          label: "Lines that will fail, listed by cause",
        },
        {
          label: "Fixed before submit",
        },
        {
          label: "Claim paid first time",
        },
      ],
    },
    neverTouches:
      "Nothing leaves your systems. Member identifiers are handled under a signed business associate agreement.",
  },
  whyItWorks: [
    {
      text: "The state's own contractor publishes the causes of EVV denials: units above the aggregator, uncleared exceptions, manual entries, a wrong service code, a claim sent before the upload (Gainwell, IHCP Works). Every one of them is visible in your export the evening before the claim.",
      href: "https://www.in.gov/medicaid/providers/files/IHCP-Works-2022-Gainwell-EVV-Pitfalls-and-Prevention.pdf",
    },
    {
      text: "Home care platforms now ship this check as a feature; one vendor's agent resolves failed visits automatically (announced March 2026). An agency on Gmail and WordPress does not get that feature. We build it beside what you run.",
      href: "https://finder.techleap.nl/news/feed/alayacare-launches-ai-agents-to-cut-home-care-admin-work-by-80",
    },
    {
      text: "Nothing is sent anywhere. The check reads your export and your schedule and writes one list. Your biller submits as always, minus the lines that would have failed.",
    },
  ],
  example: {
    title: "What a thousand visits lose to EVV denials today",
    inputs: [
      {
        id: "denied",
        label: "Visits denied for an EVV mismatch",
        stated: "2 to 6 of every hundred.",
        tag: "ASSUMED",
        format: "count",
        min: 0,
        max: 20,
        step: 1,
        low: 2,
        high: 6,
        reason:
          "In North Carolina's program seven in ten visits needed a manual fix; the share that reaches a denial is yours to tell us.",
      },
      {
        id: "visitValue",
        label: "Value of a denied visit",
        stated: "$60 to $120.",
        tag: "ASSUMED",
        format: "usd",
        min: 30,
        max: 200,
        step: 5,
        low: 60,
        high: 120,
        reason:
          "Attendant care and structured family caregiving at Indiana rates; your remittance replaces this.",
      },
      {
        id: "reworkMinutes",
        label: "Office time to rework one denial",
        stated: "30 to 60 minutes at $20 to $25 an hour.",
        tag: "ASSUMED",
        format: "minutes",
        min: 0,
        max: 120,
        step: 5,
        low: 30,
        high: 60,
      },
    ],
    constants: [],
    spans: [
      {
        id: "officeRate",
        low: 20,
        high: 25,
      },
    ],
    formula:
      "10 * denied * visitValue + 10 * denied * (reworkMinutes / 60) * officeRate",
    outputs: [],
    result:
      "Per thousand visits, revenue at risk plus rework: {usd} (exact: {exact}), and 30 to 60 days of cash delay on every denied line.",
    context:
      "Anthem paid 78 percent of PathWays claims within three weeks in late 2024 (Indiana Capital Chronicle). A denied line at a small agency is cash flow, not paperwork.",
  },
  morning: {
    kind: "table",
    title: "Tonight's check: 212 visits, 7 need attention",
    columns: ["Visit", "Payer", "Cause", "Fix before submit"],
    rows: [
      [
        "Tue 2:00 PM",
        "Anthem",
        "units billed 4, aggregator 3",
        "correct units",
      ],
      ["Wed 9:00 AM", "Humana", "manual entry", "attach reason code"],
      [
        "Wed 1:30 PM",
        "IHCP",
        "visit crosses month boundary",
        "split the claim",
      ],
      [
        "Thu 8:00 AM",
        "UnitedHealthcare",
        "wrong service code",
        "correct to attendant care",
      ],
      ["Thu 4:00 PM", "Anthem", "exception not cleared", "clear in Sandata"],
      ["Fri 10:00 AM", "IHCP", "vendor upload pending", "hold one day"],
      ["Fri 3:00 PM", "Humana", "no EVV record", "confirm visit occurred"],
    ],
    footer: "205 lines clean. Submit.",
  },
  thirtyDays: {
    body: "Week one is the count from your last two remittances: denials by code, days to resubmit. Then the check runs for the rest of the month, and you read the same two numbers against the count. Fixed fee $1,450. Stop any time. If your EVV vendor or a billing service already catches these, we say so on the first call.",
    metrics: ["Denials by code", "Days to resubmit"],
    receive: [
      "The count: one sheet from your last two remittances, week one.",
      "The nightly check, running beside what you already use.",
      "The morning list: every line that would fail, and why.",
      "The day-thirty readout: the same two numbers against the count.",
      "If your EVV vendor or billing service already catches these, we say so and stop.",
    ],
    fee: "$1,450",
  },
  sources:
    "Sources: integritycarewl.com, October 2026. Better Business Bureau. Indiana Department of Health, personal services agency directory. Indiana FSSA, EVV frequently asked questions and Gainwell EVV training, 2024. North Carolina Medicaid, EVV provider forum, June 2024.",
};

describe("the integritycare letter page", () => {
  const page = allLetterPages().find((p) => p.slug === "integritycare")!;

  it("matches the approved copy exactly", () => {
    expect(page).toEqual(approved);
  });

  it("computes the worked example to the proposal's exact figures", () => {
    const result = computeExample(page.example, openingBands(page.example));

    expect(result.exact).toEqual({ low: 1400, high: 8700 });
    expect(result.display).toEqual({ low: 1000, high: 10000 });
  });

  it("states the result line as written", () => {
    const result = computeExample(page.example, openingBands(page.example));

    expect(resultSentence(page.example.result, result)).toBe(
      "Per thousand visits, revenue at risk plus rework: $1,000 to $10,000 (exact: $1,400 and $8,700), and 30 to 60 days of cash delay on every denied line.",
    );
  });
});
