import { describe, expect, it } from "vitest";

import { getPublishedPosts } from "./blog";
import { getPublishedResearch } from "./research";
import {
  canadaFundingGuidePath,
  manufacturingPiecePaths,
  routes,
  serviceRouteKeys,
  siteUrl,
} from "./routes";
import {
  breadcrumbSchema,
  dictionaryFaqSchema,
  localServiceSchema,
  manufacturingServiceSchema,
  organizationSchema,
} from "./schema-org";

import sitemap from "@/app/sitemap";
import en from "@/lib/i18n/dictionaries/en.json";

import type { Dictionary } from "@/lib/i18n/get-dictionary";

/**
 * `/manufacturing` makes the claims the city and market pages make — prices,
 * which must agree with /pricing, and territory, which must agree with the
 * graph — plus one of its own: it sends four links into the content
 * collections by title, and a title is the thing an edit most casually
 * changes. Each is checked here rather than by eye, because every failure on
 * this list is a page that still renders.
 *
 * Verbatim rendering is asserted against the draft in
 * `IndustryLandingTemplate.test.tsx`; this file holds the invariants that
 * reach outside the page.
 */
const t: Dictionary = en;
const page = t.manufacturing;
const meta = t.pages.manufacturing;

/** Every string the page renders, as one blob to search. */
const copy = JSON.stringify({ meta, page });

describe("metadata", () => {
  it("ships the draft header's title and description", () => {
    expect(meta.metaTitle).toBe(
      "AI and Automation for Manufacturers | Nahl Technologies",
    );
    expect(meta.description).toBe(
      "AI consulting for job shops, contract manufacturers, machine builders, and plastics processors. Measured ROI first, published prices, and we come to the floor.",
    );
    expect(meta.title).toBe("AI and automation for manufacturers");
  });

  it("measures 159, inside the 165-character guard", () => {
    // The draft header labels it 156; the sentence measures 159. The label
    // was the miscount, and this pins the measured figure so a later edit
    // has to notice it moved.
    expect(meta.description.length).toBeLessThanOrEqual(165);
    expect(meta.description).toHaveLength(159);
  });
});

describe("prices agree with /pricing", () => {
  const audit = t.pricing.tiers.find(
    (tier) => tier.name === "AI Opportunity Audit",
  )!;
  const automation = t.pricing.projects.find(
    (project) => project.name === "AI Automation build",
  )!;

  it("quotes the audit fee and its 90-day credit as the rate card does", () => {
    expect(audit.price).toBe("$2,500");
    expect(audit.description).toContain("within 90 days");
    expect(page.faq.items[2].answer).toContain(
      "The audit is $2,500, fully credited toward your first project within 90 days.",
    );
    expect(page.engagement.paragraph.before).toContain("a $2,500 audit");
  });

  it("quotes the automation entry point the rate card publishes", () => {
    // Not $6,000. That is the cheapest build of any kind, which the other
    // landing pages quote; this copy says "Automation builds", and the
    // automation row's figure is the one it has to match.
    expect(automation.price).toBe("from $7,500");
    expect(page.engagement.paragraph.before).toContain(
      "Automation builds start at $7,500",
    );
    expect(page.faq.items[2].answer).toContain(
      "Automation builds start at $7,500",
    );
  });

  it("promises the rate card's 75 days", () => {
    expect(t.pricing.guarantee).toContain("75 days");
    expect(page.engagement.paragraph.before).toContain("75 days");
    expect(page.faq.items[2].answer).toContain("75-day delivery guarantee");
  });

  it("names no other dollar figure except the grant arithmetic", () => {
    // $50,000 and $100,000 are an award and its matched total, not prices.
    // Anything else with a dollar sign is a price, and must be published.
    const published = new Set(
      [
        ...t.pricing.tiers.map((tier) => tier.price),
        ...t.pricing.projects.map((project) => project.price),
      ]
        .join(" ")
        .match(/\$\d{1,3}(?:,\d{3})*/g),
    );
    const grantFigures = new Set(["$50,000", "$100,000"]);

    for (const figure of copy.match(/\$\d{1,3}(?:,\d{3})*/g) ?? []) {
      expect(
        published.has(figure) || grantFigures.has(figure),
        `unpublished figure ${figure}`,
      ).toBe(true);
    }
  });
});

describe("the four manufacturing pieces", () => {
  const documents = [
    ...getPublishedPosts().map((post) => ({
      path: `${routes.blog}/${post.slug}`,
      title: post.title,
    })),
    ...getPublishedResearch().map((article) => ({
      path: `${routes.research}/${article.slug}`,
      title: article.title,
    })),
  ];

  it.each(Object.entries(manufacturingPiecePaths))(
    "%s resolves to a published document",
    (_key, path) => {
      expect(
        documents.find((document) => document.path === path),
        `${path} is not published; /manufacturing links it`,
      ).toBeDefined();
    },
  );

  it.each(Object.entries(manufacturingPiecePaths))(
    "%s is linked on its own title",
    (key, path) => {
      // Title-based anchors, as the draft writes them: the full title, or
      // the title up to its colon. A retitled piece fails here instead of
      // leaving the page linking it under a name it no longer has.
      const { anchor } =
        page.work.items[key as keyof typeof manufacturingPiecePaths];
      const { title } = documents.find((document) => document.path === path)!;
      expect(title === anchor || title.startsWith(`${anchor}: `), title).toBe(
        true,
      );
    },
  );

  it("links the Canada guide and /pricing on the relay's anchors", () => {
    expect(canadaFundingGuidePath).toBe(
      "/blog/ai-funding-canada-small-business",
    );
    expect(page.grants.paragraph.anchor).toBe("our Canadian AI funding guide");
    expect(page.engagement.paragraph.anchor).toBe("our pricing page");
  });
});

describe("the graph", () => {
  const service = manufacturingServiceSchema(t) as {
    "@type": string;
    name: string;
    url: string;
    description: string;
    provider: { "@id": string };
    areaServed: unknown[];
    offers?: unknown;
  };

  it("carries a Service node provided by the Organization", () => {
    expect(service["@type"]).toBe("Service");
    expect(service.name).toBe("AI and Automation for Manufacturers");
    expect(service.url).toBe(`${siteUrl}/manufacturing`);
    expect(service.provider["@id"]).toBe(`${siteUrl}/#organization`);
    expect(service.description).toBe(meta.description);
  });

  it("serves exactly the Organization's ten countries", () => {
    const organization = organizationSchema(t) as { areaServed: unknown[] };
    expect(service.areaServed).toHaveLength(10);
    expect(service.areaServed).toEqual(organization.areaServed);
  });

  it("emits no City node and no offers", () => {
    // The Indianapolis page is the graph's sole City exception. Driving to
    // plants in Indiana is a travel radius, not a service area.
    expect(JSON.stringify(service)).not.toContain("City");
    expect(JSON.stringify(localServiceSchema(t))).toContain('"City"');
    expect(service.offers).toBeUndefined();
  });

  it("builds FAQPage from the four rendered questions", () => {
    const faq = dictionaryFaqSchema(page.faq.items) as {
      mainEntity: { name: string; acceptedAnswer: { text: string } }[];
    };
    expect(faq.mainEntity).toHaveLength(4);
    expect(faq.mainEntity.map((entry) => entry.name)).toEqual(
      page.faq.items.map((item) => item.question),
    );
  });

  it("builds a two-crumb breadcrumb", () => {
    const breadcrumb = breadcrumbSchema(t, routes.manufacturing) as {
      itemListElement: { name: string; item: string }[];
    };
    expect(breadcrumb.itemListElement).toEqual([
      expect.objectContaining({
        name: "Nahl Technologies",
        item: `${siteUrl}/`,
      }),
      expect.objectContaining({
        name: "AI and automation for manufacturers",
        item: `${siteUrl}/manufacturing`,
      }),
    ]);
  });
});

describe("the site around it", () => {
  it("is in the sitemap", () => {
    const paths = sitemap().map((entry) => new URL(entry.url).pathname);
    expect(paths).toContain("/manufacturing");
  });

  it("does not become a sixth service", () => {
    expect(serviceRouteKeys).toHaveLength(5);
    expect(serviceRouteKeys).not.toContain("manufacturing");
  });

  it("uses a distinct anchor at each inbound placement", () => {
    // Three placements, three phrases, all approved verbatim. Distinct so
    // the page does not collect one phrase three times over.
    const anchors = Object.values(page.inboundLinks).map((link) => link.anchor);
    expect(anchors).toEqual([
      "AI for manufacturers",
      "manufacturers",
      "AI and automation for manufacturers",
    ]);
    expect(new Set(anchors).size).toBe(anchors.length);
  });

  it("carries no banned word and no draft markup", () => {
    for (const word of [
      "empower",
      "leverage",
      "unlock",
      "transform",
      "harness",
      "cutting-edge",
      "innovative",
      "world-class",
    ]) {
      expect(copy.toLowerCase(), word).not.toContain(word);
    }
    expect(copy).not.toContain("[PLACEHOLDER");
    expect(copy).not.toMatch(/\]\(\//);
  });
});
