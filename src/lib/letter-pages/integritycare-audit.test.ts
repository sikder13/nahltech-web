import { describe, expect, it } from "vitest";

import { allAuditPages } from "./registry";

/**
 * The audit page for Integrity Care, pinned word for word.
 *
 * Everything below is approved text: the hero, the eight sections, every
 * card, every arithmetic line, the audit's steps and price as the printed
 * audit sheet states them, and every question and answer. Any change to the
 * config that is not also made here, on purpose, fails.
 */
const approved = {
  kind: "audit",
  slug: "integritycare",
  token: "integrity-care-ed133386b7",
  company: {
    name: "Integrity Care",
  },
  tabTitle: "Integrity Care: your two sheets, the morning board, and the audit",
  eyebrow:
    "Nahl Technologies Inc. · Indianapolis · Prepared for Integrity Care LLC, Lafayette · October 9, 2026",
  firm: "Nahl Technologies",
  hero: {
    title: "Six payers, one office, and the audit the state is already running",
    lead: "Two reference sheets for your billing desk, a preview of what your office could see each morning, and a ten day audit that uses your own numbers.",
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
    lead: "Both are built from the state's and the plans' own documents, dated October 2026. They are yours whether or not we ever speak, and they stay here.",
    cards: [
      {
        sheet: "evv-denial-decoder",
        title: "EVV denial decoder",
        line: "Every EVV denial code your office can receive, with the cause and the fix, on one page.",
      },
      {
        sheet: "indiana-medicaid-payer-reference",
        title: "Indiana Medicaid payer reference",
        line: "Portals, filing clocks, contacts, denial names and rates for Anthem, Humana, UnitedHealthcare and fee for service, on one page.",
      },
    ],
    download: "Download PDF",
    meta: "1 page · PDF · updated October 2026",
    always:
      "Always here: nahltech.com/integritycare/sheets. When the state or a plan changes a rule, the sheet is updated and the date on it changes. Bookmark that address or keep the printed copy; both carry it.",
    address: "nahltech.com/integritycare/sheets",
  },
  changed: {
    title: "What changed this year",
    eyebrow: "Why now",
    lead: "Three things happened in 2026 that make this the year to know your own error rate before an auditor does.",
    cards: [
      {
        figure: "625 claim lines",
        line: "In April the state sampled 625 attendant care claims from Indiana's five largest providers, found errors in nearly all of them, and is seeking about $200 million back.",
        source: "Indiana Capital Chronicle, April 23, 2026",
        href: "https://indianacapitalchronicle.com/2026/04/23/fssa-seeks-return-of-200-million-in-improper-payments-to-attendant-care-providers/",
      },
      {
        figure: "AI before payment",
        line: "In June the state and CMS began a ninety day test of software that flags claims before they are paid.",
        source: "Indiana Capital Chronicle, June 24, 2026",
        href: "https://indianacapitalchronicle.com/2026/06/24/indiana-fssa-to-use-ai-to-detect-medicaid-fraud/",
      },
      {
        figure: "90 days",
        line: "Every PathWays claim must be filed within ninety days, and a clean claim is paid within seven business days, under all three plans.",
        source: "FSSA joint MCE claims training",
        href: "https://www.in.gov/pathways/files/AllMCEJointProviderClaims.pdf",
      },
    ],
    body: "The failures the state found were ordinary: EVV not activated or at the wrong location, consent forms and service plans missing or incomplete, visit notes missing, services billed under the wrong code, background checks late or undated. Expanded audits and prepayment review were announced the same day. Anthem, Humana and UnitedHealthcare each speak their own EVV denial language. An office with six payers and a small staff cannot know its own error rate until a remittance or an auditor says so.",
  },
  preview: {
    title: "What your office could see each morning",
    eyebrow: "The preview",
    lead: "This is what Integrity Care would have after the audit, if the recommended pieces are built: one screen that reads your EVV export, your schedule, your remittances and your caregiver roster every night and shows Ms. Unger Moder, before the first batch leaves, every line that would deny and why, the claims nearest the ninety day edge, cash by payer, the caregiver files an auditor would open, the structured family caregiving claims that need a note, and the inquiries and applicants of the week. Names and numbers below are invented. In the real version they are yours.",
    frameTitle: "Integrity Care morning board (prototype)",
    open: "Open the full preview",
    captions: [
      "Pre-bill check: nine lines caught before submit",
      "The ninety day clock: three claims past 75 days",
      "Cash by payer: days to pay and open dollars",
      "Caregiver files: the five items the state checked",
    ],
  },
  money: {
    title: "Where the money usually is",
    eyebrow: "What the audit would size",
    lead: "Five places software usually pays in an office like yours. The figures are examples with our assumptions, tagged, so you can see the shape; the audit replaces every one of them with your own count.",
    show: "Show the arithmetic",
    rows: [
      {
        title: "The nightly pre-bill check",
        line: "Your EVV export and schedule matched against the draft batch each night; lines that would deny listed by cause before submit.",
        arithmetic:
          "Per thousand visits, denied lines and rework at 2 to 6 percent denied (ASSUMED), $60 to $120 a visit (ASSUMED), 30 to 60 minutes rework each at $20 to $25 an hour (ASSUMED): $1,000 to $10,000 at risk (exact: $1,400 and $8,700), plus 30 to 60 days of cash delay on each denied line.",
      },
      {
        title: "The ninety day clock and corrected claim tracker",
        line: "Every claim's filing deadline and corrected claim window by payer, with a list of what must leave this week.",
        arithmetic:
          "Anthem alone denied $182,000 for late filing across Indiana in the first seven months of 2026 (BENCHMARK, IHCP Works 2026 Anthem Top Denials).",
      },
      {
        title: "The caregiver file gate",
        line: "Background check, training hours, consent and service plan dated before the first shift, for every caregiver who worked the month; the five items the state checked in April.",
        arithmetic:
          "Error categories from the state's audit (BENCHMARK); your count from your roster.",
      },
      {
        title: "The structured family caregiving gate",
        line: "The NAME and REL claim note on every SFC and attendant care claim, and no attendant care billed in an SFC month.",
        arithmetic:
          "Denial 4405 and recoupment 6492 (BENCHMARK, IHCP bulletin BT2024183 for SFC claims; IHCP Works 2025 Gainwell FFS HCBS deck for attendant care claims).",
      },
      {
        title: "Inquiries and applicants, tracked",
        line: "Every client inquiry and every applicant logged with time to first contact and source.",
        arithmetic:
          "Agencies that track every inquiry report median revenue of $3.15 million against $1.40 million for those that do not; a correlation the survey reports, not a cause it proves (BENCHMARK, Activated2026).",
      },
    ],
    after:
      "The audit says which of these are yours, in what order, and what each would cost. It also says which ones not to build.",
  },
  proof: {
    title: "What agencies like yours are doing",
    eyebrow: "Proof",
    cards: [
      {
        line: "57 percent of 465 HCBS providers are using, testing or evaluating AI; the top planned uses are scheduling and shift filling, caregiver compliance tracking and claims processing",
        source: "HHAeXchange 2026 survey",
        href: "https://www.hhaexchange.com/press-releases/2026-hhaexchange-survey-homecare-providers-investing-in-stability",
      },
      {
        line: "A 130 caregiver agency cut shift fill time from 45 minutes to under 15 with automated text outreach",
        source: "phoebe.work",
        href: "https://www.phoebe.work/customers/right-at-home-florida",
      },
      {
        line: "If you ever want a neighboring county, Humana adds counties and services by email to its contracting desk",
        source: "IHCP Works 2025 Humana Waiver Services",
        href: "https://secure.in.gov/medicaid/providers/files/IHCP-Works-2025-Humana-Waiver-Services.pdf",
      },
    ],
    after:
      "What we build runs beside what you already use. If a tool you already own does the job, the audit says so.",
  },
  audit: {
    title: "The audit, step by step",
    eyebrow: "The roadmap and the price",
    steps: [
      {
        label: "Step zero, free",
        text: "send one remittance from any one payer under a signed business associate agreement; within two business days you receive its denied lines by code and what each would have paid.",
      },
      {
        label: "Day 0 kickoff",
        text: "a 45 minute kickoff by video, the inputs agreed.",
      },
      {
        label: "Days 1 to 2 exports into a private database",
        text: "your exports loaded into a private, access logged database built for this audit alone, deleted thirty days after the report.",
      },
      {
        label: "Days 2 to 5 the claim sample",
        text: "a random sample of your claim lines, stratified by payer, each checked against its EVV record, its authorization, its claim note and its caregiver file, with a cited rule for every pass or failure; denials and days to cash computed from your remittances.",
      },
      {
        label: "Day 5 the thirty minute call",
        text: "a 30 minute call with Ms. Unger Moder to correct what we misread.",
      },
      {
        label: "Days 6 to 8 the maps and the read",
        text: "the payer rules map, the manual time map from her own timings, the workforce and intake read against published benchmarks.",
      },
      {
        label: "Days 8 to 10 the written report",
        text: "the written report.",
      },
      {
        label: "Day 10 the walkthrough",
        text: "a one hour walkthrough with both founders, in Lafayette if you prefer.",
      },
    ],
    boxes: [
      {
        title: "What we need from you",
        text: "Remittance advices and the claim submission log for the last 90 days, the EVV export and schedule for the same period, your current notices of action, and a caregiver roster with hire, background check, training and consent dates. No pay data, no social security numbers, no clinical records. About a day of your office manager's time across the ten days, most of it pulling the exports, plus two calls of 45 and 30 minutes; one hour of yours at the end.",
      },
      {
        title: "What you receive",
        text: "A written findings report of twelve to eighteen pages: your sampled error rate by the state's categories, your denials, cash timing and open dollars by payer, a map of every manual step with minutes attached, your workforce and intake position against the benchmarks, three to five opportunities with the money, the cost and the payback for each, the recommended order, what we would not build, and your readiness for a prepayment review. Every rule cited so the report can be handed to an auditor.",
      },
      {
        title: "What the audit is likely to find",
        text: "One of four pictures. A clean office with a small leak, in which case the audit is half price and the recommendation is small. A timing leak: claims leaving before uploads, month boundary errors, 90 day misses. A documentation leak: caregiver files missing dated items, claim notes missing, SFC notes thin. A growth leak: inquiries untracked, applicants waiting days, a county ceiling. Usually two of these at once.",
      },
    ],
    stepZero: {
      title: "Step zero, free",
      text: "Send one remittance from any one payer under a signed business associate agreement. Within two business days you get its denied lines by code and what each would have paid. No charge, no obligation.",
    },
    price: {
      amount: "$2,500",
      term: "Ten business days",
      lines: [
        "Invoiced at kickoff.",
        "Credited in full toward any project we do together within 90 days of the report.",
        "If the denied lines, late filings and open dollars in your own remittances add up to less than $2,500 over the 90 days sampled, a figure we both read off the same files, the audit is half price.",
        "Your data is deleted thirty days after the report unless you continue.",
        "After the audit you receive a written quote for anything worth building, priced from the findings, and you decide. Or nothing, and the report is yours.",
      ],
    },
  },
  questions: {
    title: "What you will ask me",
    eyebrow: "Honest answers",
    items: [
      {
        q: "Who are you?",
        a: "Two people in Indianapolis. Udaay Sikder builds the software; master's in cloud computing, years in regulated health software. Mohieminul Khan checks the count; PhD in engineering, Six Sigma trained. We have no home care clients yet. This audit is how we earn the first one, which is why it is priced to be a fair trade and not a favor.",
      },
      {
        q: "Why not my billing service or my EVV vendor?",
        a: "If they already do what the audit finds, the report says so and recommends keeping them. We charge for the finding, not for replacing what works.",
      },
      {
        q: "What does this cost my office in time?",
        a: "About a day of your office manager's time across the ten days, most of it pulling the exports, plus two calls of 45 and 30 minutes, and one hour of yours at the end. No staff interviews beyond that unless you want them.",
      },
      {
        q: "Who decides whether the half price clause applies?",
        a: "The remittances do. The denied lines, late filings and open dollars are read off the same files by both of us at the walkthrough; if they add up to less than $2,500 over the 90 days sampled, you pay $1,250.",
      },
      {
        q: "What is the free first step?",
        a: "Send one remittance from any one payer under a signed business associate agreement. Within two business days you get its denied lines by code and what each would have paid. No charge, no obligation, and you will know whether we read your business correctly before you spend anything.",
      },
      {
        q: "What about member data?",
        a: "A business associate agreement is signed before any file arrives. Files go into a private database built for this audit only, with access logs. Nothing is pasted into any public AI tool. Data is deleted thirty days after the report unless you continue. The one thing this page records is that it was opened, so we know the letter arrived; no name, no cookie.",
      },
      {
        q: "What if the audit finds nothing?",
        a: "Then it is half price, and you have a report an auditor would accept that says your office is clean. That is worth something this year.",
      },
      {
        q: "What happens after the audit?",
        a: "You get a written quote for anything worth building, priced from what the audit found, with the $2,500 credited in full if we start within 90 days. You can take it, take part of it, or take the report to someone else. Nothing is priced before the audit, because nothing should be.",
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
    "Sources: Indiana Capital Chronicle, April 23 and June 24, 2026. FSSA joint MCE claims training, April 2024. IHCP bulletins BT202248, BT2024183, BT2025105, BT202614. IHCP Works 2025 and 2026 decks from Gainwell, Humana, UnitedHealthcare and Anthem. HHAeXchange 2026 provider survey. Activated Insights 2026 benchmarking. integritycarewl.com, Better Business Bureau, Indiana Department of Health, October 2026.",
  sheetsPage: {
    heading: "Reference sheets for Integrity Care's billing desk",
    line: "These stay here. When a rule changes, the sheet changes and the date changes; older versions stay linked below.",
  },
};

describe("the integritycare audit page", () => {
  const page = allAuditPages().find((p) => p.slug === "integritycare")!;

  it("matches the approved copy exactly", () => {
    expect(page).toEqual(approved);
  });

  it("states one price and nothing that was ruled out", () => {
    const words = JSON.stringify(page);
    // No build price, no monthly price, no guarantee wording.
    for (const banned of [
      "$7,500",
      "$450",
      "guarantee",
      "monthly support",
      "a month",
    ]) {
      expect(words, banned).not.toContain(banned);
    }
    expect(page.audit.price.amount).toBe("$2,500");
  });

  it("prints its own permanent sheets address", () => {
    expect(page.sheets.address).toBe("nahltech.com/integritycare/sheets");
    expect(page.sheets.always).toContain(page.sheets.address);
  });
});
