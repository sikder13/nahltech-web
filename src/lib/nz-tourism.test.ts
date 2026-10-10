import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { getPublishedPosts } from "./blog";
import {
  marketRouteKeys,
  nzGuidePaths,
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
      "Tourism Websites and AI Visibility for NZ Operators | Nahl Technologies",
    );
    expect(meta.description).toBe(
      "A homepage rebuild and AI visibility setup for New Zealand tour and activity operators. NZ$1,490 fixed, and you see the new homepage before you pay.",
    );
    expect(meta.title).toBe(
      "Websites and AI visibility for New Zealand tourism operators",
    );
  });

  it("measures 148, inside the 165-character guard", () => {
    expect(meta.description).toHaveLength(148);
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
      "New Zealand tourism operators: homepage rebuild and AI visibility setup, NZ$1,490 fixed, preview before payment; optional care NZ$149 a month. Details.",
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
      "For tour, activity and cellar door operators we offer one fixed price package: a homepage rebuild and AI visibility setup for NZ$1,490, with a private preview before you pay. See the tourism operator package. Our guides cover what booking platforms charge NZ operators and how to get named in AI travel answers.",
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

  it("keeps every international meta description inside the guard", () => {
    const cluster = published.filter(
      (post) => post.cluster === "international",
    );
    expect(cluster).toHaveLength(7);
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
