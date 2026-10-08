import { describe, expect, it } from "vitest";

import { allLetterPages } from "./registry";

/**
 * The page for Arrow Services Indiana, pinned word for word.
 *
 * The copy below is the approved text of the letter's second half. Any
 * change to the config that is not also made here, on purpose, fails.
 */
describe("the arrow letter page", () => {
  const page = allLetterPages().find((p) => p.slug === "arrow")!;

  it("keeps its address and token", () => {
    expect(page.token).toBe("arrow-services-3054120467");
    expect(page.company.name).toBe("Arrow Services Indiana");
  });

  it("keeps its tab title, title and subtitle", () => {
    expect(page.tabTitle).toBe("Arrow Services Indiana: the applicant funnel");
    expect(page.title).toBe(
      "The first five minutes after a DSP applies to Arrow",
    );
    expect(page.subtitle).toBe("A thirty-day pilot on the applicant funnel.");
  });

  it("keeps its four blocks, in order", () => {
    expect(page.blocks.map((block) => block.heading)).toEqual([
      "The handoff",
      "The rule",
      "What we build",
      "Thirty days",
    ]);
    expect(page.blocks[0].body).toBe(
      "An applicant who hears nothing for a day takes the other job at the same fifteen dollars. Half of booked interviews do not show. Every hire must clear the state's HCSP registry before a first shift. The recruiter's week goes to texting and chasing.",
    );
    expect(page.blocks[1].body).toBe(
      "Home care agencies hire about 13 percent of the people who apply (Activated Insights, Home Care Benchmarking 2024). Indiana providers lost 37.5 percent of their direct support staff last year (National Core Indicators, State of the Workforce 2024, Indiana data). Since August 1, 2026 providers cannot add counties or services for six months (Indiana Medicaid bulletin BT2026124).",
    );
    expect(page.blocks[2].body).toBe(
      "The funnel. An applicant arrives from Indeed or your site. Within five minutes a text screen starts. The qualified ones book an interview on your calendar. The registry is checked. Onboarding drives itself. Your team sees one board of who is where. Names and certifications only, nothing clinical.",
    );
    expect(page.blocks[3].body).toBe(
      "Week one is the count from your current flow: time to first contact, interview show rate, days from application to first shift. Then the funnel runs for the rest of the month, and you read the same three numbers against the count. Fixed fee $1,950. Stop any time. If your recruiter already has tools that do this, we say so on the first call.",
    );
  });

  it("links its sources only in the rule, on the source's own name", () => {
    expect(page.blocks[0].links).toEqual([]);
    expect(page.blocks[2].links).toEqual([]);
    expect(page.blocks[3].links).toEqual([]);
    expect(page.blocks[1].links).toEqual([
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
    ]);
  });

  it("keeps its sources line", () => {
    expect(page.sources).toBe(
      "Sources: arrow-in.com and Indeed postings, October 2026. Activated Insights, Home Care Benchmarking 2024, via Home Health Care News. National Core Indicators, State of the Workforce 2024. Indiana Medicaid bulletin BT2026124.",
    );
  });
});
