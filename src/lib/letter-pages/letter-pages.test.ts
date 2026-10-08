import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import sitemap from "@/app/sitemap";
import { allDashboards as templateOne } from "@/lib/dashboards/registry";
import { allDashboards as templateTwo } from "@/lib/dashboards/v2/registry";
import { allRoutePaths } from "@/lib/routes";

import {
  allLetterPages,
  letterPageByToken,
  letterPageRedirects,
  letterSharedCopy,
} from "./registry";
import { letterPageSchema, letterSectionKeys } from "./schema";

describe("letter pages", () => {
  const pages = allLetterPages();

  it("loads and validates, with the shared contact block", () => {
    expect(pages.length).toBeGreaterThan(0);
    expect(() => letterSharedCopy()).not.toThrow();
  });

  it("has slugs and tokens no other prospect page uses", () => {
    const others = [...templateOne(), ...templateTwo()];
    const slugs = [...pages, ...others].map((p) => p.slug);
    const tokens = [...pages, ...others].map((p) => p.token);
    expect(new Set(slugs).size).toBe(slugs.length);
    expect(new Set(tokens).size).toBe(tokens.length);
  });

  it("never shadows a real site route with its short address", () => {
    const taken = new Set(allRoutePaths.map((p) => p.split("/")[1]));
    for (const page of pages) expect(taken.has(page.slug)).toBe(false);
  });

  it("gives each token the provider's name and ten hex characters", () => {
    for (const page of pages) {
      expect(page.token, page.slug).toMatch(/^[a-z]+(-[a-z]+)*-[0-9a-f]{10}$/);
    }
  });

  it("redirects each short address to its tokenized page, temporarily", () => {
    const redirects = letterPageRedirects();
    expect(redirects).toHaveLength(pages.length);
    for (const page of pages) {
      expect(redirects).toContainEqual({
        source: `/${page.slug}`,
        destination: `/m3/${page.token}`,
        permanent: false,
      });
    }
  });

  it("finds a page by its token and nothing by any other", () => {
    for (const page of pages) {
      expect(letterPageByToken(page.token)?.slug).toBe(page.slug);
    }
    expect(letterPageByToken("not-a-token-0000000000")).toBeUndefined();
  });

  it("stays out of the sitemap", () => {
    const paths = sitemap().map((entry) => new URL(entry.url).pathname);
    for (const page of pages) {
      expect(paths).not.toContain(`/${page.slug}`);
    }
    expect(paths.filter((path) => path.startsWith("/m3"))).toEqual([]);
  });

  it("rejects a source link whose words are not in the body", () => {
    const [page] = pages;
    const broken = {
      ...page,
      rule: {
        ...page.rule,
        links: [
          ...page.rule.links,
          {
            text: "a phrase the body never says",
            href: "https://example.com/",
          },
        ],
      },
    };
    expect(letterPageSchema.safeParse(broken).success).toBe(false);
  });

  it("rejects a figure card that says anything the rule does not", () => {
    const [page] = pages;
    const withCard = (card: { figure: string; line: string; source: string }) =>
      letterPageSchema.safeParse({
        ...page,
        rule: { ...page.rule, figures: [card] },
      }).success;
    const [real] = page.rule.figures;

    expect(withCard(real)).toBe(true);
    expect(withCard({ ...real, line: "A sentence of our own." })).toBe(false);
    expect(withCard({ ...real, figure: "99 percent" })).toBe(false);
    expect(withCard({ ...real, source: "A source we did not cite" })).toBe(
      false,
    );
  });

  it("rejects a result line that names a figure the model does not compute", () => {
    const [page] = pages;
    const broken = {
      ...page,
      example: { ...page.example, result: "{usd} ({exact}) and {made} up" },
    };
    expect(letterPageSchema.safeParse(broken).success).toBe(false);
  });

  it("never fills in a provider's own number", () => {
    // A metric is a name and nothing else: the schema has no field for a
    // value, so the page cannot print one.
    for (const page of pages) {
      for (const metric of page.thirtyDays.metrics) {
        expect(metric, page.slug).not.toMatch(/\d/);
      }
    }
  });

  it("uses only invented first names in its illustration", () => {
    const real = [
      "Kendall",
      "Coleman",
      "Alex",
      "March",
      "Crussana",
      "Hill",
      "Oluranti",
      "Ladapo",
      "Udaay",
      "Sikder",
      "Mohieminul",
      "Khan",
    ];
    for (const page of pages) {
      const words = JSON.stringify(page.morning);
      for (const name of real) {
        expect(words, `${page.slug} names ${name}`).not.toMatch(
          new RegExp(`\\b${name}\\b`),
        );
      }
    }
  });
});

describe("the first wave of letter pages", () => {
  it("is exactly the four providers the letters name", () => {
    expect(allLetterPages().map((page) => page.slug)).toEqual([
      "arrow",
      "dayafterday",
      "integritycare",
      "quinton",
    ]);
  });

  it("has every token recorded in the ledger, against its short address", () => {
    const ledger = readFileSync(
      path.join(process.cwd(), "docs", "anchor-ledger.md"),
      "utf8",
    );
    expect(ledger).toContain("## Prospect page tokens");
    for (const page of allLetterPages()) {
      expect(ledger).toContain(`\n/${page.slug}: ${page.token}\n`);
    }
  });
});

describe("the copy every letter page shares", () => {
  it("matches the approved copy exactly", () => {
    // The section names and eyebrows, the three chips, the timeline, the
    // metric placeholder, the fee terms, who the reader would work with, the
    // contact block and the promise.
    expect(letterSharedCopy()).toEqual({
      firm: "Nahl Technologies",
      topLine:
        "Nahl Technologies Inc. · Indianapolis · Prepared for {provider}",
      chips: [
        "Two to three minutes to read",
        "Nothing about you is recorded here",
        "A no is a fair answer",
      ],
      sections: {
        handoff: {
          name: "The handoff",
          eyebrow: "Where it goes wrong today",
        },
        whyNow: {
          name: "Why this is a problem now",
        },
        rule: {
          name: "The rule",
          eyebrow: "What the state does when it fails",
        },
        build: {
          name: "What we build",
          eyebrow: "The software",
        },
        whyItWorks: {
          name: "Why it works",
        },
        example: {
          name: "A worked example",
        },
        morning: {
          name: "What the morning looks like",
        },
        thirtyDays: {
          name: "Thirty days",
          eyebrow: "How the pilot runs",
        },
        team: {
          name: "Who you would work with",
          eyebrow: "Two people, both in Indianapolis",
        },
        contact: {
          name: "Tell me where this is wrong",
        },
      },
      failLabel: "Failure point",
      neverTouchesTitle: "What it never touches",
      example: {
        disclaimer:
          "This is an example, not a claim about your business. Every input is ours until you move it. Your records in week one replace all of it.",
        lowLabel: "low end",
        highLabel: "high end",
        typeLabel: "Type an exact figure for {label}",
        typeHint: "Enter one figure. Both handles close on it.",
      },
      illustrationLabel:
        "Illustration with made-up names. Your version uses your staff and your records.",
      timeline: [
        {
          when: "Day 1 to 7",
          what: "The count",
          days: 7,
        },
        {
          when: "Day 8 to 30",
          what: "It runs",
          days: 23,
        },
        {
          when: "Day 30",
          what: "The readout",
          days: 0,
        },
      ],
      metric: {
        placeholder: "Your number, from your records, week one",
        again: "read again at day thirty",
      },
      receive: {
        title: "What you receive",
        eyebrow: "Deliverables",
      },
      fee: {
        title: "The fee",
        eyebrow: "Fixed, in writing",
        terms: [
          "Fixed fee, agreed before we start.",
          "Stop any time; you keep the count and everything built to that day.",
          "Nothing clinical leaves your systems; a business associate agreement is signed before any file that could contain it.",
          "If a tool you already own does this, we say so on the first call and go home.",
        ],
      },
      team: {
        people: [
          {
            name: "Udaay Sikder",
            role: "Co-Founder and Chief Executive Officer",
            initials: "US",
            lines: [
              "Builds the software.",
              "Master's in cloud computing; years in regulated health software before Nahl.",
              "Reads every log himself.",
            ],
          },
          {
            name: "Mohieminul Khan",
            role: "Co-Founder",
            initials: "MK",
            lines: [
              "PhD in mechanical engineering; Six Sigma trained.",
              "Built the voice and text agent stack that the call-off line and the funnel run on.",
            ],
          },
        ],
        line: "Two people, no sales team, no subcontractors. The person you call is the person who builds it.",
      },
      contact: {
        heading: "Tell me where this is wrong",
        line: "Whichever route is easiest. I keep seven to eight in the morning open for these calls.",
        book: "Book fifteen minutes",
        call: {
          label: "Call or text (317) 507-4303",
          href: "tel:+13175074303",
        },
        text: {
          label: "Text Udaay",
          number: "+13175074303",
          body: "Read your letter. Call me at ",
        },
        email: {
          address: "udaay@nahltech.com",
          subject: "Your letter",
        },
        form: {
          placeholder: "Your phone or email, and one line if you like",
          send: "Send",
          success: "Got it. I will reply within one business day.",
          failure: "That did not go through. Text me at (317) 507-4303.",
        },
      },
      closing: "No one will call you because you visited this page.",
    });
  });

  it("numbers ten sections, in the order the page shows them", () => {
    const shared = letterSharedCopy();
    expect(letterSectionKeys.map((key) => shared.sections[key].name)).toEqual([
      "The handoff",
      "Why this is a problem now",
      "The rule",
      "What we build",
      "Why it works",
      "A worked example",
      "What the morning looks like",
      "Thirty days",
      "Who you would work with",
      "Tell me where this is wrong",
    ]);
  });
});
