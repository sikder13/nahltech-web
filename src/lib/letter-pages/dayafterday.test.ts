import { describe, expect, it } from "vitest";

import { allLetterPages } from "./registry";

/**
 * The page for A Day After Day Home Care Agency, pinned word for word.
 *
 * The copy below is the approved text of the letter's second half. Any
 * change to the config that is not also made here, on purpose, fails.
 */
describe("the dayafterday letter page", () => {
  const page = allLetterPages().find((p) => p.slug === "dayafterday")!;

  it("keeps its address and token", () => {
    expect(page.token).toBe("dayafterday-homecare-e7102e9628");
    expect(page.company.name).toBe("A Day After Day Home Care Agency");
  });

  it("keeps its tab title, title and subtitle", () => {
    expect(page.tabTitle).toBe("A Day After Day: the intake gate");
    expect(page.title).toBe(
      "Waiver intake at A Day After Day, before the first unpaid visit",
    );
    expect(page.subtitle).toBe(
      "The checklist before the first unpaid visit, proven in thirty days.",
    );
  });

  it("keeps its four blocks, in order", () => {
    expect(page.blocks.map((block) => block.heading)).toEqual([
      "The handoff",
      "The rule",
      "What we build",
      "Thirty days",
    ]);
    expect(page.blocks[0].body).toBe(
      "A waiver case can start before eligibility, the notice of action, the authorized units and the EVV enrollment are all in place. Every day of service before the authorization is active is a visit given away, or a client turned down.",
    );
    expect(page.blocks[1].body).toBe(
      "Since 2024 Indiana denies a claim with no matching EVV record outright, codes 0950 and 0952, with no grace period on PathWays (Indiana FSSA, EVV frequently asked questions). Under the new assessments the state's denial rate rose from about one percent to between five and sixteen (Indiana House statement, 2026). Since August 1, 2026 providers cannot add services for six months (Indiana Medicaid bulletin BT2026124).",
    );
    expect(page.blocks[2].body).toBe(
      "The intake gate. One tracker from referral to first billable visit: eligibility, notice of action, authorized units, EVV enrollment, caregiver assigned, with a hold and a call before any unpaid visit. It lives in the forms you already use. Names and dates, no clinical record.",
    );
    expect(page.blocks[3].body).toBe(
      "Week one is the count from your last two quarters of intakes: days to first billable visit, visits never billed. Then the gate runs for the rest of the month, and you read the same two numbers against the count. Fixed fee $1,450. Stop any time. If your office runs on ChatGPT and Google today, a half-day review of that setup may be the better first step, and we say so on the call.",
    );
  });

  it("links its sources only in the rule, on the source's own name", () => {
    expect(page.blocks[0].links).toEqual([]);
    expect(page.blocks[2].links).toEqual([]);
    expect(page.blocks[3].links).toEqual([]);
    expect(page.blocks[1].links).toEqual([
      {
        text: "Indiana FSSA, EVV frequently asked questions",
        href: "https://www.in.gov/medicaid/providers/files/Electronic_Visit_Verification_FAQs.pdf",
      },
      {
        text: "Indiana House statement, 2026",
        href: "https://www.indianahousedemocrats.org/news/shackleford-demands-immediate-pause-on-medicaid-waiver-denials-following-sharp-spike-in-care-cuts-for-hoosiers-with-special-needs",
      },
      {
        text: "Indiana Medicaid bulletin BT2026124",
        href: "https://www.in.gov/medicaid/providers/files/bulletins/BT2026124.pdf",
      },
    ]);
  });

  it("keeps its sources line", () => {
    expect(page.sources).toBe(
      "Sources: dayafterdayhomecare.com and the agency's postings, October 2026. Better Business Bureau. IAHHC directory. Indiana FSSA, EVV frequently asked questions and Gainwell EVV training, 2024. Indiana House statement on waiver denials, 2026. Indiana Medicaid bulletin BT2026124.",
    );
  });
});
