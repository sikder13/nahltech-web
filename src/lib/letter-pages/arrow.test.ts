import { describe, expect, it } from "vitest";

import { computeExample, openingBands, resultSentence } from "./model";
import { allLetterPages } from "./registry";

/**
 * The page for Arrow Services Indiana, pinned word for word.
 *
 * Everything below is approved text: the letter's own blocks, the new
 * sections, every diagram label, every metric name, every line of the
 * illustration, and the worked example's inputs. Any change to the config
 * that is not also made here, on purpose, fails.
 */
const approved = {
  slug: "arrow",
  token: "arrow-services-3054120467",
  company: {
    name: "Arrow Services Indiana",
  },
  tabTitle: "Arrow Services Indiana: the applicant funnel",
  title: "The first five minutes after a DSP applies to Arrow",
  subtitle: "A thirty-day pilot on the applicant funnel.",
  handoff: {
    body: "An applicant who hears nothing for a day takes the other job at the same fifteen dollars. Half of booked interviews do not show. Every hire must clear the state's HCSP registry before a first shift. The recruiter's week goes to texting and chasing.",
    diagram: {
      title: "Today",
      steps: [
        {
          label: "Applicant clicks apply",
        },
        {
          label: "Hours or days of silence",
          fail: true,
        },
        {
          label: "Recruiter texts and chases",
        },
        {
          label: "Interview booked; half do not show",
        },
        {
          label: "Registry check by hand",
        },
        {
          label: "First shift, weeks later",
        },
      ],
    },
  },
  whyNow: {
    body: "Arrow has seven roles open and is hiring a recruiter to fill them. Every day between an application and a reply, the applicant is taking the other job at the same fifteen dollars. Every hire needs an HCSP registry check before a first shift. With expansion frozen until spring, the speed from click to first shift is the one number that still moves revenue, and nobody at Arrow is measuring it yet because nobody has had the time.",
  },
  rule: {
    body: "Home care agencies hire about 13 percent of the people who apply (Activated Insights, Home Care Benchmarking 2024). Indiana providers lost 37.5 percent of their direct support staff last year (National Core Indicators, State of the Workforce 2024, Indiana data). Since August 1, 2026 providers cannot add counties or services for six months (Indiana Medicaid bulletin BT2026124).",
    links: [
      {
        text: "Activated Insights, Home Care Benchmarking 2024",
        href: "https://homehealthcarenews.com/2024/07/home-cares-industry-wide-turnover-rate-reaches-nearly-80",
      },
      {
        text: "National Core Indicators, State of the Workforce 2024",
        href: "https://idd.nationalcoreindicators.org/wp-content/uploads/2025/12/2024-NCI-IDD-SoTW_Final-Tagged.pdf",
      },
      {
        text: "Indiana Medicaid bulletin BT2026124",
        href: "https://www.in.gov/medicaid/providers/files/bulletins/BT2026124.pdf",
      },
    ],
    figures: [
      {
        figure: "13 percent",
        line: "Home care agencies hire about 13 percent of the people who apply",
        source: "Activated Insights, Home Care Benchmarking 2024",
      },
      {
        figure: "37.5 percent",
        line: "Indiana providers lost 37.5 percent of their direct support staff last year",
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
    body: "The funnel. An applicant arrives from Indeed or your site. Within five minutes a text screen starts. The qualified ones book an interview on your calendar. The registry is checked. Onboarding drives itself. Your team sees one board of who is where. Names and certifications only, nothing clinical.",
    diagram: {
      title: "With the funnel",
      steps: [
        {
          label: "Applicant clicks apply",
        },
        {
          label: "Text screen within five minutes",
        },
        {
          label: "Qualified ones book on your calendar",
        },
        {
          label: "HCSP registry checked",
        },
        {
          label: "Onboarding checklist runs itself",
        },
        {
          label: "One board: who is where",
        },
      ],
    },
    neverTouches:
      "Client records of any kind. It holds applicant names, certifications and dates.",
  },
  whyItWorks: [
    {
      text: "Managed hiring services for home care now text applicants within minutes and book interviews automatically; the agencies that use them report filling roles in days, not weeks (published descriptions, 2025 and 2026).",
      href: "https://www.ycombinator.com/companies/sagecare",
    },
    {
      text: "The applicant who gets a text in five minutes is still available. The one who gets a call on Thursday is not. That is the whole mechanism; the software only makes it happen every time.",
    },
    {
      text: "Every step is one you already do by hand. Nothing new is asked of the applicant or of Arrow's team except that it happens the same way, fast, every time.",
    },
  ],
  example: {
    title: "What a hundred applicants cost today, and what they yield",
    inputs: [
      {
        id: "recMinutes",
        label: "Recruiter time per applicant",
        stated: "30 to 60 minutes.",
        tag: "ASSUMED",
        format: "minutes",
        min: 0,
        max: 120,
        step: 5,
        low: 30,
        high: 60,
        reason: "Texting, chasing, scheduling, rescheduling.",
      },
      {
        id: "recRate",
        label: "Recruiter cost per hour",
        stated: "$17 to $19.",
        tag: "OBSERVED",
        format: "usd",
        min: 12,
        max: 30,
        step: 1,
        low: 17,
        high: 19,
        reason:
          "Arrow's own posting for the Recruiting and Training Specialist.",
      },
      {
        id: "booked",
        label: "Interviews booked per hundred applicants",
        stated: "30 to 40.",
        tag: "ASSUMED",
        format: "count",
        min: 0,
        max: 100,
        step: 1,
        low: 30,
        high: 40,
      },
      {
        id: "noShow",
        label: "Interviews that do not show",
        stated: "50 percent.",
        tag: "ASSUMED",
        format: "percent",
        min: 0,
        max: 100,
        step: 5,
        low: 50,
        high: 50,
        reason: "Half; most agencies report between a third and a half.",
      },
      {
        id: "pdHours",
        label: "Program director time lost per no-show",
        stated: "one hour at $26.",
        tag: "OBSERVED",
        format: "hours",
        min: 0,
        max: 3,
        step: 0.25,
        low: 1,
        high: 1,
        reason:
          "$53,000 to $55,000 a year in Arrow's own posting, over 2,080 hours.",
      },
      {
        id: "hires",
        label: "Hires per hundred applicants",
        stated: "13.",
        tag: "BENCHMARK",
        format: "count",
        min: 0,
        max: 40,
        step: 1,
        low: 13,
        high: 13,
        reason:
          "Activated Insights, 2024: home care agencies hire 12.8 percent of applicants.",
      },
    ],
    constants: [
      {
        id: "pdRate",
        value: 26.442307692307693,
      },
    ],
    spans: [],
    formula:
      "100 * (recMinutes / 60) * recRate + booked * noShow * pdHours * pdRate",
    outputs: [
      {
        id: "recHours",
        formula: "100 * (recMinutes / 60)",
      },
      {
        id: "empty",
        formula: "booked * noShow",
      },
      {
        id: "hires",
        formula: "hires",
      },
    ],
    result:
      "Per hundred applicants: {recHours} recruiter hours, {empty} empty interview slots, {usd} of staff time (exact: {exact}), and {hires} hires. The cost is not the dollars; it is the days between the click and the first shift, which nobody at Arrow counts yet.",
    context:
      "Since August 1, 2026 Arrow cannot add counties or services for six months (BT2026124). Hiring faster is the growth that is still allowed.",
  },
  morning: {
    kind: "board",
    columns: ["Applied", "Screened", "Interview booked", "Registry checked"],
    cards: [
      {
        column: 1,
        text: "Priya, applied 8:12 AM, screened 8:15",
      },
      {
        column: 2,
        text: "Devon, interview Thu 2 PM",
      },
      {
        column: 3,
        text: "Rosa, registry: certified",
      },
      {
        column: 2,
        text: "Tom, interview Fri 10 AM",
      },
      {
        column: 1,
        text: "Keisha, applied 9:40 AM, screened 9:44",
      },
    ],
    footer: "Average time to first contact this week: 4 minutes.",
  },
  thirtyDays: {
    body: "Week one is the count from your current flow: time to first contact, interview show rate, days from application to first shift. Then the funnel runs for the rest of the month, and you read the same three numbers against the count. Fixed fee $1,950. Stop any time. If your recruiter already has tools that do this, we say so on the first call.",
    metrics: [
      "Time to first contact",
      "Interview show rate",
      "Days from application to first shift",
    ],
    receive: [
      "The count: one sheet from your current applicant flow, week one.",
      "The five-minute text screen, in your words.",
      "Interview booking on your calendar, with reminders.",
      "The registry check and the onboarding checklist, on one board.",
      "The day-thirty readout: the same three numbers against the count.",
    ],
    fee: "$1,950",
  },
  sources:
    "Sources: arrow-in.com and Indeed postings, October 2026. Activated Insights, Home Care Benchmarking 2024, via Home Health Care News. National Core Indicators, State of the Workforce 2024. Indiana Medicaid bulletin BT2026124.",
};

describe("the arrow letter page", () => {
  const page = allLetterPages().find((p) => p.slug === "arrow")!;

  it("matches the approved copy exactly", () => {
    expect(page).toEqual(approved);
  });

  it("computes the worked example to the proposal's exact figures", () => {
    const result = computeExample(page.example, openingBands(page.example));

    expect(result.exact).toEqual({ low: 1247, high: 2429 });
    expect(result.display).toEqual({ low: 1000, high: 2000 });
  });

  it("states the result line as written", () => {
    const result = computeExample(page.example, openingBands(page.example));

    expect(resultSentence(page.example.result, result)).toBe(
      "Per hundred applicants: 50 to 100 recruiter hours, 15 to 20 empty interview slots, $1,000 to $2,000 of staff time (exact: $1,247 and $2,429), and 13 hires. The cost is not the dollars; it is the days between the click and the first shift, which nobody at Arrow counts yet.",
    );
  });
});
