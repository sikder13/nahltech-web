import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { getPublishedPosts } from "./blog";
import { getResearchBySlug } from "./research";
import {
  marketRouteKeys,
  nzGuidePaths,
  nzStudySlug,
  nzTourismLinkPaths,
  routes,
  siteUrl,
} from "./routes";
import {
  breadcrumbSchema,
  dictionaryFaqSchema,
  nzTourismServiceSchema,
} from "./schema-org";

import sitemap from "@/app/sitemap";
import en from "@/lib/i18n/dictionaries/en.json";

import type { Dictionary } from "@/lib/i18n/get-dictionary";

/**
 * `/nz` sells one package at one price, in copy approved word for word, and
 * it sits directly above a set of private pages: the per-prospect previews
 * at `/nz/<business>/preview`. So three things are held here rather than by
 * eye. The copy is what was approved; the price is the same figure on every
 * page that quotes it; and nothing beneath `/nz` reaches a surface a crawler
 * reads.
 *
 * Rendering is asserted in `MarketTemplate.test.tsx`.
 */
const t: Dictionary = en;
const page = t.nzTourism;
const meta = t.pages.nzTourism;

/** Every string the page renders that belongs to it, as one blob. */
const copy = JSON.stringify({ meta, page });

const join = (segments: readonly { text: string }[]) =>
  segments.map((segment) => segment.text).join("");

describe("metadata", () => {
  it("ships the approved title, description and h1", () => {
    expect(meta.metaTitle).toBe(
      "Tourism Website Rebuilds and AI Visibility for NZ Operators | Nahl Technologies",
    );
    expect(meta.description).toBe(
      "A full website rebuild and AI visibility setup for New Zealand tour and activity operators. NZ$1,490 fixed, with a refundable 30 percent deposit.",
    );
    expect(meta.title).toBe(
      "Website rebuilds and AI visibility for New Zealand tourism operators",
    );
  });

  it("measures 145, inside the 165-character guard", () => {
    expect(meta.description).toHaveLength(145);
  });
});

describe("the approved copy", () => {
  it("has the seven sections in order", () => {
    expect(page.sections.map((section) => section.heading)).toEqual([
      "What you get for NZ$1,490",
      "How it works",
      "Prices, plainly",
      "Why now",
      "What we do not promise",
      "Who we are",
      "Guides for New Zealand operators",
    ]);
  });

  it("ends Who we are on the study sentence, linking the study", () => {
    // The paragraph is stored cut at its anchor so the new last sentence can
    // carry the link. Rejoined, it must read exactly as approved.
    const section = page.sections.find((s) => s.heading === "Who we are");
    const linked = section?.linkedParagraph;
    expect(linked).toBeDefined();
    expect(`${linked!.before} ${linked!.anchor}${linked!.after}`).toBe(
      "Nahl Technologies is a small software firm in Indianapolis, in the United States. We have no New Zealand office. We work your mornings, which are our afternoons, and we answer email the same day. We built and run our own website auditing product, Crawlmouse, and we publish every price we charge. In October 2026 we published a study of 80 New Zealand tourism websites using the same tools.",
    );
    expect(linked!.anchor).toBe("a study of 80 New Zealand tourism websites");
    expect(getResearchBySlug(nzStudySlug)?.draft).toBe(false);
  });

  it("closes on the approved line, with Email us as its one link", () => {
    expect(join(page.cta.body)).toBe(
      "Questions first? Email us and we will reply within one New Zealand business day.",
    );
    expect(
      page.cta.body.flatMap((segment) =>
        "link" in segment ? [[segment.text, segment.link]] : [],
      ),
    ).toEqual([["Email us", "email"]]);
  });

  it("states the terms the outreach emails make", () => {
    // A prospect who reads the email and then this page must meet one offer:
    // a full rebuild, a refundable 30 percent deposit, 70 percent at launch.
    // The old terms are named so that neither can drift back in.
    expect(copy).toContain("refundable 30 percent deposit");
    expect(copy).toContain("the remaining 70 percent is due at launch");
    expect(copy).not.toContain("50 percent");
    expect(copy).not.toMatch(/homepage rebuild|preview/i);
  });

  it("keeps New Zealand spelling and uses no dash character", () => {
    // Both are deliberate. An Americanised word or a dash arriving in a
    // later edit is a change to approved copy, not a tidy up.
    expect(copy).toContain("travellers");
    expect(copy).toContain("colours");
    expect(copy).not.toMatch(/travelers|colors/);
    expect(copy).not.toMatch(/[‒-―]/);
  });

  it("carries no banned word and no placeholder", () => {
    for (const word of [
      "empower",
      "leverage",
      "unlock",
      "transform",
      "harness",
      "cutting-edge",
      "innovative",
      "world-class",
      "solutions",
    ]) {
      expect(copy.toLowerCase(), word).not.toContain(word);
    }
    expect(copy).not.toContain("[PLACEHOLDER");
  });

  it("does not restate the identity phrase in a variant", () => {
    // The template renders no identity line, so the page must not carry a
    // near copy of one either. The frozen phrase lives on /about.
    expect(copy).not.toContain("serving businesses across");
    expect(t.about.intro).toContain(
      "serving businesses across North America, the Gulf region, Central Asia, and New Zealand",
    );
  });
});

describe("the price, wherever it is quoted", () => {
  const figures = (text: string) => text.match(/NZ\$\d+(?:,\d{3})*/g) ?? [];

  it("is NZ$1,490 and NZ$149 a month on the page and nothing else", () => {
    expect(new Set(figures(copy))).toEqual(new Set(["NZ$1,490", "NZ$149"]));
  });

  it("reads on /pricing as approved, linking the page", () => {
    expect(join(t.pricing.otherMarkets.note)).toBe(
      "New Zealand tourism operators: full website rebuild and AI visibility setup, NZ$1,490 fixed, 30 percent deposit refundable if you do not like the design; optional care NZ$149 a month. Details.",
    );
    expect(
      t.pricing.otherMarkets.note.flatMap((segment) =>
        "link" in segment ? [[segment.text, segment.link]] : [],
      ),
    ).toEqual([["Details", "nzTourism"]]);
  });

  it("stays out of the US price cards", () => {
    const cards = JSON.stringify([t.pricing.tiers, t.pricing.projects]);
    expect(cards).not.toContain("NZ$");
    expect(cards).not.toContain("New Zealand");
  });

  it("reads on /markets/new-zealand as approved, after the price anchor", () => {
    const section = t.markets.newZealand.sections.find(
      (item) => item.heading === "How we work with Kiwi businesses",
    ) as
      | {
          priceAnchor?: string;
          linkedAfterword?: readonly { text: string; link?: string }[];
        }
      | undefined;

    expect(section?.priceAnchor).toMatch(/^For context:/);
    expect(join(section!.linkedAfterword!)).toBe(
      "For tour and activity operators we offer one fixed price package: a full website rebuild and AI visibility setup for NZ$1,490, with a homepage redesign to see before you pay. See the tourism operator package. Our guides cover what booking platforms charge NZ operators and how to get named in AI travel answers.",
    );
    expect(
      section!.linkedAfterword!.flatMap((segment) =>
        segment.link
          ? [
              [
                segment.text,
                nzTourismLinkPaths[
                  segment.link as keyof typeof nzTourismLinkPaths
                ],
              ],
            ]
          : [],
      ),
    ).toEqual([
      ["the tourism operator package", "/nz"],
      ["what booking platforms charge NZ operators", nzGuidePaths.commission],
      ["how to get named in AI travel answers", nzGuidePaths.aiSearch],
    ]);
  });
});

describe("the guides", () => {
  const published = getPublishedPosts();

  it("lists the four with the approved anchors, each on its own post", () => {
    const guides = page.sections.at(-1) as {
      linkItems: readonly { text: string; link: string }[];
    };
    expect(
      guides.linkItems.map((item) => [
        item.text,
        nzGuidePaths[item.link as keyof typeof nzGuidePaths],
      ]),
    ).toEqual([
      [
        "Viator and GetYourGuide commission for NZ operators",
        "/blog/viator-getyourguide-commission-nz-tour-operators",
      ],
      [
        "How NZ operators get recommended by ChatGPT and Google AI",
        "/blog/ai-search-new-zealand-tourism-operators",
      ],
      [
        "Is Qualmark worth it for a small operator",
        "/blog/qualmark-worth-it-small-tourism-operator",
      ],
      [
        "The tour operator homepage checklist",
        "/blog/tourism-website-design-nz-tour-operators",
      ],
    ]);
  });

  it("points every anchor at a published international post", () => {
    // Hard rule 7 for links that cross from a page into the post collection.
    for (const [key, href] of Object.entries(nzGuidePaths)) {
      const post = published.find((item) => `/blog/${item.slug}` === href);
      expect(post, `${key} -> ${href}`).toBeDefined();
      expect(post!.cluster, key).toBe("international");
    }
  });

  it("points the AI search guide at the study, after the playbook list", () => {
    const post = published.find(
      (p) => `${routes.blog}/${p.slug}` === nzGuidePaths.aiSearch,
    )!;
    const paragraph =
      "When we audited 80 small New Zealand tourism websites in October 2026, every one let AI crawlers in, but 53 percent of their pages carried no structured data and half the sites had pages nothing linked to. The full results are in our [study of 80 NZ tourism websites](/research/ai-search-readiness-study-new-zealand-tourism-websites).";
    // The playbook paragraph ends on a colon and introduces its list, so the
    // new paragraph follows the list rather than splitting the two.
    expect(post.body).toContain(
      `and check them every 90 days.\n\n${paragraph}\n\n## The steps, in order`,
    );
    expect(post.updatedAt).toBe("2026-10-16");
  });

  it("keeps every international meta description inside the guard", () => {
    const cluster = published.filter(
      (post) => post.cluster === "international",
    );
    expect(cluster).toHaveLength(8);
    for (const post of cluster) {
      expect(post.description.length, post.slug).toBeLessThanOrEqual(165);
    }
  });
});

describe("structured data", () => {
  it("carries a Service node for New Zealand, provided by the organisation", () => {
    const schema = nzTourismServiceSchema(t) as {
      "@type": string;
      name: string;
      url: string;
      provider: { "@id": string };
      areaServed: { name: string }[];
    };
    expect(schema["@type"]).toBe("Service");
    expect(schema.name).toBe(meta.title);
    expect(schema.url).toBe(`${siteUrl}/nz`);
    expect(schema.provider["@id"]).toBe(`${siteUrl}/#organization`);
    expect(schema.areaServed.map((country) => country.name)).toEqual(["NZ"]);
  });

  it("builds FAQPage from the five questions the accordion renders", () => {
    const schema = dictionaryFaqSchema(page.faq.items) as {
      "@type": string;
      mainEntity: { name: string }[];
    };
    expect(schema["@type"]).toBe("FAQPage");
    expect(schema.mainEntity.map((entity) => entity.name)).toEqual([
      "How much does a tourism website cost with you?",
      "Do I pay anything before I see the new homepage?",
      "Can you guarantee my business will appear in ChatGPT?",
      "Will my booking system still work?",
      "Is GST added?",
    ]);
  });

  it("has a two-step breadcrumb", () => {
    const crumbs = breadcrumbSchema(t, routes.nzTourism) as {
      itemListElement: { item: string }[];
    };
    expect(crumbs.itemListElement.map((entry) => entry.item)).toEqual([
      `${siteUrl}/`,
      `${siteUrl}/nz`,
    ]);
  });
});

describe("the site around it", () => {
  const llms = readFileSync(
    path.join(process.cwd(), "public/llms.txt"),
    "utf8",
  );
  const sitemapPaths = sitemap().map((entry) => new URL(entry.url).pathname);

  it("is in the sitemap and in llms.txt", () => {
    expect(sitemapPaths).toContain("/nz");
    expect(llms).toContain(`(${siteUrl}/nz) `);
  });

  it("does not become a fifth market", () => {
    expect(marketRouteKeys).toHaveLength(4);
    expect(marketRouteKeys).not.toContain("nzTourism");
  });

  it("lets nothing beneath /nz into the registry, the sitemap or llms.txt", () => {
    // The previews at /nz/<business>/preview are private. They are kept off
    // these surfaces by never being registered, and this is what notices if
    // one ever is.
    for (const route of Object.values(routes)) {
      expect(route.startsWith("/nz/"), route).toBe(false);
    }
    expect(sitemapPaths.filter((item) => item.startsWith("/nz/"))).toEqual([]);
    expect(llms).not.toContain(`${siteUrl}/nz/`);
  });

  it("links to no preview from its own copy", () => {
    expect(copy).not.toContain("/nz/");
    expect(copy).not.toContain("/preview");
  });
});
