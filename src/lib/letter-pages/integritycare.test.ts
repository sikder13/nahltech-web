import { describe, expect, it } from "vitest";

import { allLetterPages } from "./registry";

/**
 * The page for Integrity Care, pinned word for word.
 *
 * The copy below is the approved text of the letter's second half. Any
 * change to the config that is not also made here, on purpose, fails.
 */
describe("the integritycare letter page", () => {
  const page = allLetterPages().find((p) => p.slug === "integritycare")!;

  it("keeps its address and token", () => {
    expect(page.token).toBe("integrity-care-ed133386b7");
    expect(page.company.name).toBe("Integrity Care");
  });

  it("keeps its tab title, title and subtitle", () => {
    expect(page.tabTitle).toBe("Integrity Care: the nightly EVV check");
    expect(page.title).toBe(
      "The EVV denial list at Integrity Care, built the night before",
    );
    expect(page.subtitle).toBe("A nightly check, proven in thirty days.");
  });

  it("keeps its four blocks, in order", () => {
    expect(page.blocks.map((block) => block.heading)).toEqual([
      "The handoff",
      "The rule",
      "What we build",
      "Thirty days",
    ]);
    expect(page.blocks[0].body).toBe(
      "You learn which visits failed when the remittance arrives, after the claim went out, across three managed care portals and the state portal.",
    );
    expect(page.blocks[1].body).toBe(
      "Since 2024 Indiana denies a claim with no matching EVV record outright, codes 0950 and 0952, no grace period on PathWays (Indiana FSSA, EVV frequently asked questions). The state's own training lists the causes: units above what the aggregator holds, exceptions nobody cleared, visits entered by hand, the wrong service code, a claim sent before the vendor uploaded (Gainwell, IHCP Works). In a comparable state program, seven in ten visits needed a manual fix before billing (North Carolina Medicaid, EVV provider forum, June 2024).",
    );
    expect(page.blocks[2].body).toBe(
      "The nightly check. Your EVV export and your schedule against the draft claim line, every evening, with the lines that will fail listed by cause before anyone presses submit. Member identifiers stay in your systems under a signed business associate agreement.",
    );
    expect(page.blocks[3].body).toBe(
      "Week one is the count from your last two remittances: denials by code, days to resubmit. Then the check runs for the rest of the month, and you read the same two numbers against the count. Fixed fee $1,450. Stop any time. If your EVV vendor or a billing service already catches these, we say so on the first call.",
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
        text: "Gainwell, IHCP Works",
        href: "https://www.in.gov/medicaid/providers/files/IHCP-Works-2022-Gainwell-EVV-Pitfalls-and-Prevention.pdf",
      },
      {
        text: "North Carolina Medicaid, EVV provider forum, June 2024",
        href: "https://medicaid.ncdhhs.gov/evv-presentation-ltss-provider-forum-june-25-2024/download",
      },
    ]);
  });

  it("keeps its sources line", () => {
    expect(page.sources).toBe(
      "Sources: integritycarewl.com, October 2026. Better Business Bureau. Indiana Department of Health, personal services agency directory. Indiana FSSA, EVV frequently asked questions and Gainwell EVV training, 2024. North Carolina Medicaid, EVV provider forum, June 2024.",
    );
  });
});
