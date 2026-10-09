import { describe, expect, it } from "vitest";

import { allAuditPages } from "./registry";

/**
 * The audit page for Quinton Residential Living, pinned word for word.
 *
 * Everything below is approved text. The steps of the audit and the three
 * boxes beside them quote the printed audit sheet word for word, and are
 * pinned a second time against the sheet's own paragraphs further down.
 * Any change to the config that is not also made here, on purpose, fails.
 */
const approved = {
  kind: "audit",
  slug: "quinton",
  token: "quinton-residential-2419d6c0f8",
  company: {
    name: "Quinton Residential Living",
  },
  tabTitle:
    "Quinton Residential Living: your two sheets, the night board, and the audit",
  eyebrow:
    "Nahl Technologies Inc. · Indianapolis · Prepared for Quinton Residential Living · October 9, 2026",
  firm: "Nahl Technologies",
  hero: {
    title:
      "Two hundred people every night, and the winter the state changed the rules",
    lead: "A calendar and a checklist for the on-call desk, a preview of what your on-call manager could see at ten at night, and a fifteen day audit that uses your own numbers.",
    sheetsButton: "Get the two sheets",
    quiet:
      "Three minutes to read. No forms, no cookies, no sales calls. A no is a fair answer.",
  },
  book: "Book fifteen minutes",
  safety:
    "No forms before the call. No one will call you because you visited this page.",
  bar: {
    book: "Book",
    text: "Text",
    sheets: "Sheets",
  },
  sheets: {
    title: "Your two sheets, yours to keep",
    eyebrow: "The gifts",
    lead: "Both are built from the state's own documents, dated October 2026. They are yours whether or not we ever speak, and they stay here.",
    cards: [
      {
        sheet: "indiana-residential-provider-calendar",
        title:
          "Indiana residential provider calendar, October 2026 to March 2027",
        line: "Every dated obligation and change for a CIH and FS residential provider, with its source, on one page.",
      },
      {
        sheet: "substitute-dsp-shift-checklist",
        title: "Before a substitute DSP takes a residential shift",
        line: "Ten checks a house supervisor makes after a call-off, each with the rule behind it, on one page.",
      },
    ],
    download: "Download PDF",
    meta: "1 page · PDF · updated October 2026",
    always:
      "Always here: nahltech.com/quinton/sheets. When the state changes a date or a rule, the sheet is updated and the date on it changes. Bookmark that address or keep the printed copy; both carry it.",
    address: "nahltech.com/quinton/sheets",
  },
  changed: {
    title: "What changed this year",
    eyebrow: "Why now",
    lead: "Four things happened in 2026 that make this winter the one to run the homes you already have as tightly as they can be run.",
    cards: [
      {
        figure: "Six month freeze",
        line: "Since August 1 no residential provider in Indiana can add a county, a service or an owner for at least six months.",
        source: "IHCP bulletin BT2026124",
        href: "https://www.in.gov/medicaid/providers/files/bulletins/BT2026124.pdf",
      },
      {
        figure: "Every DSP on the registry",
        line: "Every DSP on every shift must be on the HCSP registry, and the first certificates begin expiring before January with no state calendar to say when.",
        source: "FSSA HCSP registry FAQs",
      },
      {
        figure: "November 1",
        line: "From November 1 the five case management organizations lose two percent of their fee when incident follow ups and plans run late, which makes every late provider note a case manager's money problem.",
        source: "IHCP bulletin BT2026154",
        href: "https://www.in.gov/medicaid/providers/files/bulletins/BT2026154.pdf",
      },
      {
        figure: "October 28",
        line: "A new claim edit starts denying RHS and PAC lines billed with HQ at place of service 12.",
        source: "IHCP bulletin BT2026155",
        href: "https://www.in.gov/medicaid/providers/files/bulletins/BT2026155.pdf",
      },
    ],
    body: "In October 2025 the federal inspector general reported 246 instances of noncompliance at thirty Indiana residential settings run by twenty providers. The homes you already run are the whole business this winter, and the night is where they are won or lost.",
    bodyLink: {
      text: "In October 2025 the federal inspector general reported 246 instances of noncompliance at thirty Indiana residential settings run by twenty providers.",
      href: "https://oig.hhs.gov/reports/all/2025/indiana-did-not-fully-comply-with-federal-waiver-and-state-health-safety-and-administrative-requirements-at-30-residential-settings",
    },
  },
  preview: {
    title: "What your on-call manager could see at ten at night",
    eyebrow: "The preview",
    lead: "This is what Quinton would have after the audit, if the recommended pieces are built: one screen for the on-call manager that shows every home, every call-off and what happened to it, the call-off line taking the call and making the offers by text and voice, overtime projected before the schedule posts, every DSP's registry and medication certification with its expiry, every reportable incident with the time left to file, and every shift note checked against the state's elements before it is submitted. Names, homes and numbers below are invented. In the real version they are yours, and residents are never named.",
    frameTitle: "Quinton night board (prototype)",
    open: "Open the full preview",
    shot: {
      width: 390,
      height: 3728,
    },
    captions: [
      "Tonight: 58 homes, two shifts still open",
      "The call-off line: Elm House filled in four minutes",
      "Overtime projected before payroll day",
      "Certifications expiring by January, counted",
    ],
  },
  money: {
    title: "Where the money usually is",
    eyebrow: "What the audit would size",
    lead: "Five places software usually pays in a residential provider of your size. The figures are examples with our assumptions, tagged; the audit replaces every one of them with your own count.",
    show: "Show the arithmetic",
    rows: [
      {
        title: "The call-off line",
        line: "One number staff text or call. Eligible people by certification, distance and hours; offers by text and voice; the schedule updated; everything logged.",
        arithmetic:
          "Per hundred call-offs today: 45 to 90 minutes of supervisor time (ASSUMED) at $25 to $35 an hour (ASSUMED), 40 to 70 percent of fills on overtime (ASSUMED) at $64 premium a shift (OBSERVED, half of your posted $16 over eight hours): $4,000 to $10,000 (exact: $4,435 and $9,730), plus 5 to 15 shifts left open. An Illinois provider with six homes cut time to fill open shifts 96 percent and monthly overtime 22.8 percent with text offers (BENCHMARK, vendor case study).",
      },
      {
        title: "Overtime before it happens",
        line: "Projected weekly hours per DSP before the schedule posts, with the fills that would cross 40 hours flagged.",
        arithmetic:
          "Indiana DSP turnover 37.5 percent, with 38.6 percent of DSPs in their job a year or less, which is why the week's hours concentrate on the few who stay (BENCHMARK, NCI 2024).",
      },
      {
        title: "The registry and training monitor",
        line: "Every DSP's HCSP, Core A/B, background check and training dates with expiry alerts; no offer to a lapsed certificate.",
        arithmetic:
          "First HCSP certificates expire one year after completion; recertification due at 9 to 12 months (BENCHMARK, state FAQ).",
      },
      {
        title: "The note check",
        line: "Every shift note checked against the RHS elements and the 24 hour window before submission.",
        arithmetic:
          "The inspector general's Indiana findings: 46 administrative instances and 200 in health, safety and residential records (BENCHMARK, OIG A-05-24-00013).",
      },
      {
        title: "The incident clock",
        line: "Every reportable event with the time left to file and the follow up schedule, trends by home.",
        arithmetic:
          "24 hours to file and follow up every 7 days (BENCHMARK, 460 IAC 6-9-5); reportable regardless of whether staff were present (BENCHMARK, BDS incident training FAQ).",
      },
    ],
    after:
      "The audit says which of these are yours, in what order, and what each would cost. It also says which ones not to build. One more it will weigh: remote overnight supports, which Indiana funds and the moratorium does not cover.",
  },
  proof: {
    title: "What providers like yours are doing",
    eyebrow: "Proof",
    cards: [
      {
        line: "Indiana DSP turnover 37.5 percent; 38.6 percent of Indiana DSPs in their job a year or less",
        source: "NCI 2024",
        href: "https://idd.nationalcoreindicators.org/wp-content/uploads/2025/12/2024-NCI-IDD-SoTW_Final-Tagged.pdf",
      },
      {
        line: "Open shift offers by text: 96 percent faster fills, 22.8 percent less overtime at a six home provider",
        source: "OnShift Marklund case study",
        href: "https://www3.onshift.com/hubfs/content-library/case-studies/CS010_Marklund_OnShift.pdf",
      },
      {
        line: "Indiana remote supports in 2024: 543,824 hours, 98.6 percent retention, 95.4 percent task completion",
        source: "NASDDDS November 2025",
        href: "https://www.nasddds.org/wp-content/uploads/2025/11/The-Future-is-Now-Leveraging-Enabling-Technology-to-Transform-IDD-Supports.pdf",
      },
    ],
    after:
      "What we build runs beside AccelTrax and the forms you already use. If a tool you already own does the job, the audit says so.",
  },
  audit: {
    title: "The audit, step by step",
    eyebrow: "The roadmap and the price",
    steps: [
      {
        label: "Day 0",
        text: "a 45 minute kickoff, in person at Washington Pointe if you prefer, the inputs agreed.",
      },
      {
        label: "Days 1 to 3",
        text: "schedule, timekeeping, roster and claims exports loaded into a private, access logged database built for this audit alone; residents appear only as counts. Shift notes and incident reports are never exported: we read them on your screens, on site, or your staff redact names before we see them.",
      },
      {
        label: "Days 2 to 6",
        text: "a random sample of shifts across homes, nights and weekends, each checked for staff present as scheduled, certified and trained on the date, a complete note within 24 hours, EVV where required, and units billed against hours worked and the authorization, with a cited rule for every pass or failure.",
      },
      {
        label: "Days 3 to 7",
        text: "call-offs, fill times, overtime and open shifts from your logs, and a map of the call-off process as it runs today.",
      },
      {
        label: "Days 4 to 6",
        text: "every active DSP against the HCSP registry, with an expiry calendar for six months.",
      },
      {
        label: "Day 7",
        text: "a 30 minute call with your staffing manager to correct what we misread.",
      },
      {
        label: "Days 8 to 11",
        text: "incidents against the 24 hour rule and the state categories, read on site, and the interviews.",
      },
      {
        label: "Days 10 to 12 and Days 12 to 15",
        text: "Days 10 to 12: the opportunities sized from your numbers. Days 12 to 15: the written report.",
      },
      {
        label: "Day 15",
        text: "a ninety minute walkthrough with both founders, in person.",
      },
    ],
    boxes: [
      {
        title: "What we need from you",
        text: "Schedule and timekeeping exports from AccelTrax for 90 days; the on-call log in whatever form your office keeps it, nothing from anyone's personal phone; an hours summary; a DSP roster with hire, HCSP, Core A/B, background check and training dates; the incident log for twelve months, categories and dates only; claims and remittances for 90 days; the Notices of Action by home. One hour of your staffing manager, thirty minutes each from two house supervisors and a QIDP, with you in the room if you wish, and 45 minutes of yours at the start and 90 at the end. Pulling the exports is about a day of office time. No pay data beyond the posted rate, no resident names.",
      },
      {
        title: "What you receive",
        text: "A written findings report of fifteen to twenty pages: the sampled shift results by the inspector general's categories; call-offs, fill times, overtime and open shifts by home; the registry and training expiry calendar; incident timeliness and trends; the call-off process map; your supervisors' manual hours; three to five opportunities with the money, the cost and the payback for each, the recommended order, what we would not build, and your readiness for a state review. Every rule cited.",
      },
      {
        title: "What the audit is likely to find",
        text: "A tight operation with a small leak, in which case the audit is half price. A staffing leak: long fills, most fills on overtime, open shifts, supervisors on the phone nightly. A compliance leak: certifications or trainings lapsing, notes late or missing an element, incidents filed late. A billing leak: units or modifiers off the authorization, the October 28 edit, hourly and daily confusion. Usually staffing and one other.",
      },
    ],
    stepZero: {
      title: "Step zero, free",
      text: "Send your DSP roster with HCSP certification dates under a signed business associate agreement. Within two business days you get an expiry calendar for every DSP for six months. No charge, no obligation.",
    },
    price: {
      amount: "$3,000",
      term: "Fifteen business days, two offices",
      lines: [
        "Invoiced at kickoff.",
        "Credited in full toward any project we do together within 90 days of the report.",
        "At kickoff we agree one count from your own logs, for example fills on overtime per month or open shifts per month, and the number it must beat; if the audit finds it does not, the audit is half price.",
        "Your data is deleted thirty days after the report unless you continue.",
        "After the audit you receive a written quote for anything worth building, priced from the findings, and you decide. Or nothing, and the report, the calendar and the checklist are yours.",
      ],
    },
  },
  questions: {
    title: "What you will ask me",
    eyebrow: "Honest answers",
    items: [
      {
        q: "Who are you?",
        a: "Two people in Indianapolis. Udaay Sikder builds the software; master's in cloud computing, years in regulated health software. Mohieminul Khan checks the count and maps the process; PhD in engineering, Six Sigma trained, and the voice and text stack behind the call-off line is his. We have no residential clients yet. This audit is how we earn the first one, which is why it is priced as a fair trade and not a favor.",
      },
      {
        q: "AccelTrax already does this.",
        a: "If it does, the report says so and recommends using it. Its published materials describe time reporting, scheduling and billing; they do not describe shift offers, overtime projection or registry expiry. We charge for the finding, not for replacing what works.",
      },
      {
        q: "My staff will not answer a robot at nine at night, and I do not want one taking sick calls.",
        a: "The line takes the message and tells the supervisor at once; the supervisor still speaks to the person who called off. What the line does on its own is the part nobody wants at nine at night: it finds who is eligible and under hours, sends the offer by text and voice, and logs the answers. Whether your staff answer is measured in your homes during the build, before it goes to every region.",
      },
      {
        q: "What does this cost my people in time?",
        a: "One hour of your staffing manager, thirty minutes each from two house supervisors and a QIDP, with you in the room if you wish; about a day of office time pulling exports across the fifteen days; 45 minutes of yours at the start and 90 at the end. Nothing from anyone's personal phone.",
      },
      {
        q: "How do you read notes and incident reports without naming residents?",
        a: "On your screens, on site, or after your staff redact names. Notes and incident reports are never exported. The database holds schedules, timekeeping, the roster and claims, with residents as counts.",
      },
      {
        q: "Who decides whether the half price clause applies?",
        a: "A count we agree at kickoff from your own logs, for example fills on overtime per month or open shifts per month, and the number it must beat. If the audit finds it does not, you pay $1,500.",
      },
      {
        q: "What is the free first step?",
        a: "Send your DSP roster with HCSP certification dates under a signed business associate agreement. Within two business days you get an expiry calendar for every DSP for six months. No charge, no obligation, and you will know whether we read your business correctly before you spend anything.",
      },
      {
        q: "What about the people we support?",
        a: "Residents are never named in our systems; homes are coded and people are counted. A business associate agreement is signed before any file arrives. Nothing is pasted into any public AI tool. Data is deleted thirty days after the report unless you continue. The one thing this page records is that it was opened, so we know the letter arrived; no name, no cookie.",
      },
      {
        q: "What if it finds nothing?",
        a: "Then it is half price, and you have a report a reviewer would accept that says your nights are tight. This winter that is worth having.",
      },
      {
        q: "What happens after the audit?",
        a: "You get a written quote for anything worth building, priced from what the audit found, with the $3,000 credited in full if we start within 90 days. You can take it, take part of it, or take the report to someone else. Nothing is priced before the audit, because nothing should be.",
      },
      {
        q: "Why should I trust the numbers?",
        a: "Every figure on this page is tagged. Public figures carry their source. Our assumptions are labeled as ours. The audit replaces every assumption with your own count, and the report cites the rule behind every finding.",
      },
    ],
  },
  reply: {
    title: "Tell me where this is wrong",
    eyebrow: "Reply",
    heading: "Tell me where this is wrong.",
    line: "Whichever route is easiest. I keep seven to eight in the morning open for these calls.",
    closing: "No one will call you because you visited this page.",
  },
  sources:
    "Sources: IHCP bulletins BT2026124, BT2026154, BT2026155, BT202613, BT202378. Indiana Administrative Code 460 IAC 6-9-5, 6-10-5, 6-14-4. HHS Office of Inspector General A-05-24-00013. FSSA HCSP registry FAQs. National Core Indicators 2024. OnShift Marklund case study. NASDDDS November 2025. qrlcares.com, CARF, Better Business Bureau, Indeed, October 2026.",
  sheetsPage: {
    heading: "Reference sheets for Quinton Residential Living's on-call desk",
    line: "These stay here. When a rule changes, the sheet changes and the date changes; older versions stay linked below.",
  },
};

describe("the quinton audit page", () => {
  const page = allAuditPages().find((p) => p.slug === "quinton")!;

  it("matches the approved copy exactly", () => {
    expect(page).toEqual(approved);
  });

  it("states one price and nothing that was ruled out", () => {
    const words = JSON.stringify(page);
    // No build price, no monthly price, no guarantee wording.
    for (const banned of [
      "$4,150",
      "$9,500",
      "$450",
      "guarantee",
      "monthly support",
      "a month",
    ]) {
      expect(words, banned).not.toContain(banned);
    }
    expect(page.audit.price.amount).toBe("$3,000");
  });

  it("carries no placeholder text", () => {
    expect(JSON.stringify(page)).not.toContain("PLACEHOLDER");
  });

  describe("the audit, as the printed audit sheet states it", () => {
    // The sheet's "How it runs" paragraph, whole. The page splits it into
    // stops at each "Day" or "Days" sentence and must lose no word of it.
    const howItRuns =
      "Day 0: a 45 minute kickoff, in person at Washington Pointe if you prefer, the inputs agreed. Days 1 to 3: schedule, timekeeping, roster and claims exports loaded into a private, access logged database built for this audit alone; residents appear only as counts. Shift notes and incident reports are never exported: we read them on your screens, on site, or your staff redact names before we see them. Days 2 to 6: a random sample of shifts across homes, nights and weekends, each checked for staff present as scheduled, certified and trained on the date, a complete note within 24 hours, EVV where required, and units billed against hours worked and the authorization, with a cited rule for every pass or failure. Days 3 to 7: call-offs, fill times, overtime and open shifts from your logs, and a map of the call-off process as it runs today. Days 4 to 6: every active DSP against the HCSP registry, with an expiry calendar for six months. Day 7: a 30 minute call with your staffing manager to correct what we misread. Days 8 to 11: incidents against the 24 hour rule and the state categories, read on site, and the interviews. Days 10 to 12: the opportunities sized from your numbers. Days 12 to 15: the written report. Day 15: a ninety minute walkthrough with both founders, in person.";

    it("splits How it runs into nine stops and keeps every word", () => {
      expect(page.audit.steps.map((step) => step.label)).toEqual([
        "Day 0",
        "Days 1 to 3",
        "Days 2 to 6",
        "Days 3 to 7",
        "Days 4 to 6",
        "Day 7",
        "Days 8 to 11",
        "Days 10 to 12 and Days 12 to 15",
        "Day 15",
      ]);
      // The combined stop keeps both of its sentences as the sheet has
      // them, day ranges included; every other stop drops only its label.
      const rebuilt = page.audit.steps
        .map((step) =>
          step.label === "Days 10 to 12 and Days 12 to 15"
            ? step.text
            : `${step.label}: ${step.text}`,
        )
        .join(" ");
      expect(rebuilt).toBe(howItRuns);
    });

    it("pins the stop for Day 0", () => {
      expect(
        page.audit.steps.find((step) => step.label === "Day 0")?.text,
      ).toBe(
        "a 45 minute kickoff, in person at Washington Pointe if you prefer, the inputs agreed.",
      );
    });

    it("pins the stop for Days 1 to 3", () => {
      expect(
        page.audit.steps.find((step) => step.label === "Days 1 to 3")?.text,
      ).toBe(
        "schedule, timekeeping, roster and claims exports loaded into a private, access logged database built for this audit alone; residents appear only as counts. Shift notes and incident reports are never exported: we read them on your screens, on site, or your staff redact names before we see them.",
      );
    });

    it("pins the stop for Days 2 to 6", () => {
      expect(
        page.audit.steps.find((step) => step.label === "Days 2 to 6")?.text,
      ).toBe(
        "a random sample of shifts across homes, nights and weekends, each checked for staff present as scheduled, certified and trained on the date, a complete note within 24 hours, EVV where required, and units billed against hours worked and the authorization, with a cited rule for every pass or failure.",
      );
    });

    it("pins the stop for Days 3 to 7", () => {
      expect(
        page.audit.steps.find((step) => step.label === "Days 3 to 7")?.text,
      ).toBe(
        "call-offs, fill times, overtime and open shifts from your logs, and a map of the call-off process as it runs today.",
      );
    });

    it("pins the stop for Days 4 to 6", () => {
      expect(
        page.audit.steps.find((step) => step.label === "Days 4 to 6")?.text,
      ).toBe(
        "every active DSP against the HCSP registry, with an expiry calendar for six months.",
      );
    });

    it("pins the stop for Day 7", () => {
      expect(
        page.audit.steps.find((step) => step.label === "Day 7")?.text,
      ).toBe(
        "a 30 minute call with your staffing manager to correct what we misread.",
      );
    });

    it("pins the stop for Days 8 to 11", () => {
      expect(
        page.audit.steps.find((step) => step.label === "Days 8 to 11")?.text,
      ).toBe(
        "incidents against the 24 hour rule and the state categories, read on site, and the interviews.",
      );
    });

    it("pins the stop for Days 10 to 12 and Days 12 to 15", () => {
      expect(
        page.audit.steps.find(
          (step) => step.label === "Days 10 to 12 and Days 12 to 15",
        )?.text,
      ).toBe(
        "Days 10 to 12: the opportunities sized from your numbers. Days 12 to 15: the written report.",
      );
    });

    it("pins the stop for Day 15", () => {
      expect(
        page.audit.steps.find((step) => step.label === "Day 15")?.text,
      ).toBe("a ninety minute walkthrough with both founders, in person.");
    });

    it("pins the box What we need from you", () => {
      expect(
        page.audit.boxes.find((box) => box.title === "What we need from you")
          ?.text,
      ).toBe(
        "Schedule and timekeeping exports from AccelTrax for 90 days; the on-call log in whatever form your office keeps it, nothing from anyone's personal phone; an hours summary; a DSP roster with hire, HCSP, Core A/B, background check and training dates; the incident log for twelve months, categories and dates only; claims and remittances for 90 days; the Notices of Action by home. One hour of your staffing manager, thirty minutes each from two house supervisors and a QIDP, with you in the room if you wish, and 45 minutes of yours at the start and 90 at the end. Pulling the exports is about a day of office time. No pay data beyond the posted rate, no resident names.",
      );
    });

    it("pins the box What you receive", () => {
      expect(
        page.audit.boxes.find((box) => box.title === "What you receive")?.text,
      ).toBe(
        "A written findings report of fifteen to twenty pages: the sampled shift results by the inspector general's categories; call-offs, fill times, overtime and open shifts by home; the registry and training expiry calendar; incident timeliness and trends; the call-off process map; your supervisors' manual hours; three to five opportunities with the money, the cost and the payback for each, the recommended order, what we would not build, and your readiness for a state review. Every rule cited.",
      );
    });

    it("pins the box What the audit is likely to find", () => {
      expect(
        page.audit.boxes.find(
          (box) => box.title === "What the audit is likely to find",
        )?.text,
      ).toBe(
        "A tight operation with a small leak, in which case the audit is half price. A staffing leak: long fills, most fills on overtime, open shifts, supervisors on the phone nightly. A compliance leak: certifications or trainings lapsing, notes late or missing an element, incidents filed late. A billing leak: units or modifiers off the authorization, the October 28 edit, hourly and daily confusion. Usually staffing and one other.",
      );
    });

    it("keeps the note about shift notes and incident reports with Days 1 to 3", () => {
      expect(page.audit.steps[1].text).toContain(
        "Shift notes and incident reports are never exported: we read them on your screens, on site, or your staff redact names before we see them.",
      );
    });
  });

  it("heads its sheets page for the on-call desk", () => {
    expect(page.sheetsPage.heading).toBe(
      "Reference sheets for Quinton Residential Living's on-call desk",
    );
  });

  it("prints its own permanent sheets address", () => {
    expect(page.sheets.address).toBe("nahltech.com/quinton/sheets");
    expect(page.sheets.always).toContain(page.sheets.address);
  });

  it("links the inspector general's report on the sentence that cites it", () => {
    expect(page.changed.bodyLink).toEqual({
      text: "In October 2025 the federal inspector general reported 246 instances of noncompliance at thirty Indiana residential settings run by twenty providers.",
      href: "https://oig.hhs.gov/reports/all/2025/indiana-did-not-fully-comply-with-federal-waiver-and-state-health-safety-and-administrative-requirements-at-30-residential-settings",
    });
  });
});
