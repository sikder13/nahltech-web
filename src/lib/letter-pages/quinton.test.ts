import { describe, expect, it } from "vitest";

import { allLetterPages } from "./registry";

/**
 * The page for Quinton Residential Living, pinned word for word.
 *
 * The copy below is the approved text of the letter's second half. Any
 * change to the config that is not also made here, on purpose, fails.
 */
describe("the quinton letter page", () => {
  const page = allLetterPages().find((p) => p.slug === "quinton")!;

  it("keeps its address and token", () => {
    expect(page.token).toBe("quinton-residential-2419d6c0f8");
    expect(page.company.name).toBe("Quinton Residential Living");
  });

  it("keeps its tab title, title and subtitle", () => {
    expect(page.tabTitle).toBe("Quinton Residential Living: the call-off line");
    expect(page.title).toBe("The hour after a call-off at Quinton");
    expect(page.subtitle).toBe(
      "A thirty-day pilot on one region's night and weekend shifts.",
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
      "A call-off at nine at night goes to a supervisor with a list. The substitute must clear the state's HCSP registry before working. Overtime goes to whoever answers. An open shift is unbilled hours and an incident report. Nobody counts the hour, the overtime, or the shifts left open.",
    );
    expect(page.blocks[1].body).toBe(
      "Indiana providers lost 37.5 percent of their direct support staff last year, and one in five had been there under six months (National Core Indicators, State of the Workforce 2024, Indiana data from 170 agencies). Every DSP serving under the CIH or FSW must hold HCSP certification, checked on the state's public registry. Since August 1, 2026 providers cannot add counties or services for six months (Indiana Medicaid bulletin BT2026124).",
    );
    expect(page.blocks[2].body).toBe(
      "A call-off line. Staff text or call one number. It finds eligible people by certification, distance and hours worked, offers the shift by text and voice, confirms, writes it back to the schedule, and logs every step. It holds names, certifications and times, never a clinical record. It lives inside what you already run.",
    );
    expect(page.blocks[3].body).toBe(
      "Week one is the count from your on-call log: time to fill, overtime, open shifts. Then the line runs for the rest of the month, and you read the same three numbers against the count. Fixed fee $1,950. Stop any time. If AccelTrax already does this well for you, we say so on the first call.",
    );
  });

  it("links its sources only in the rule, on the source's own name", () => {
    expect(page.blocks[0].links).toEqual([]);
    expect(page.blocks[2].links).toEqual([]);
    expect(page.blocks[3].links).toEqual([]);
    expect(page.blocks[1].links).toEqual([
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
    ]);
  });

  it("keeps its sources line", () => {
    expect(page.sources).toBe(
      "Sources: qrlcares.com and intrinsicbehavioral.com, October 2026. CARF listings. National Core Indicators, State of the Workforce 2024. Indiana FSSA, HCSP training registry. Indiana Medicaid bulletin BT2026124.",
    );
  });
});
