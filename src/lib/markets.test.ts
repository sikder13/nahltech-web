import { describe, expect, it } from "vitest";

import { getPublishedPosts } from "./blog";
import {
  canadaFundingGuidePath,
  canadaFundingGuideSlug,
  marketDictionaryKeys,
  marketRouteKeys,
  routes,
  siteUrl,
} from "./routes";
import {
  breadcrumbSchema,
  marketServiceSchema,
  organizationSchema,
} from "./schema-org";

import en from "@/lib/i18n/dictionaries/en.json";

import type { Dictionary } from "@/lib/i18n/get-dictionary";

/**
 * The four market pages make the same two kinds of claim the Indianapolis
 * page does — prices, which must agree with /pricing, and territory, which
 * must agree with the identity phrase and with the graph — but they make them
 * in prose rather than in a table.
 *
 * That difference is the whole reason this file exists. `pricing-mirror`
 * cannot govern a figure inside a sentence: the sentence is approved copy and
 * rewriting it to interpolate a value would be rewriting the copy. So the
 * guarantee is taken the other way round — read every figure back out of the
 * copy and refuse any the rate card does not publish. Same invariant, checked
 * from the opposite end.
 */
const t: Dictionary = en;

const marketSlices = marketRouteKeys.map((key) => ({
  routeKey: key,
  dictionaryKey: marketDictionaryKeys[key],
  page: t.pages[key],
  content: t.markets[marketDictionaryKeys[key]],
}));

/** Every string one market page renders, as one blob to search. */
function copyOf(key: (typeof marketRouteKeys)[number]): string {
  return JSON.stringify({
    page: t.pages[key],
    content: t.markets[marketDictionaryKeys[key]],
  });
}

/** Every dollar figure the rate card publishes, as it publishes it. */
const publishedFigures = new Set(
  [
    ...t.pricing.tiers.map((tier) => tier.price),
    ...t.pricing.projects.map((project) => project.price),
    ...t.pricing.projects.map((project) => project.note),
  ]
    .join(" ")
    .match(/\$[\d,]+/g) ?? [],
);

/**
 * Dollar figures in approved copy that are not prices, by page — named one
 * at a time rather than by pattern, so the gate below stays shut to every
 * other figure.
 *
 * `$200,000` is what the Canada page's concentration passage says a
 * specialist hire costs a client — the thing we are the alternative to,
 * not something we charge.
 */
const notPrices: Partial<Record<(typeof marketRouteKeys)[number], string[]>> = {
  marketCanada: ["$200,000"],
};

describe("market pages quote only published prices", () => {
  it.each(marketSlices)(
    "$routeKey names no figure /pricing does not publish",
    ({ routeKey }) => {
      // The failure this catches is a draft that says $5,000 where the rate
      // card says $6,000 — which is exactly what the Indianapolis draft did
      // in four places, and the reason that page reads its table from
      // `t.pricing` instead of carrying one.
      const figures = copyOf(routeKey).match(/\$[\d,]+/g) ?? [];
      expect(figures.length).toBeGreaterThan(0);
      for (const figure of figures) {
        if (notPrices[routeKey]?.includes(figure)) continue;
        expect(publishedFigures, `${routeKey} quotes ${figure}`).toContain(
          figure,
        );
      }
    },
  );

  it("exempts only figures the copy still carries", () => {
    // An exemption outliving its sentence would be a hole in the gate with
    // nothing in it — the next draft to quote that figure as a price would
    // pass unchecked.
    for (const [routeKey, figures] of Object.entries(notPrices)) {
      for (const figure of figures) {
        expect(
          copyOf(routeKey as (typeof marketRouteKeys)[number]),
          `${routeKey} no longer says ${figure}`,
        ).toContain(figure);
      }
    }
  });

  it("agrees with the rate card on the delivery guarantee", () => {
    // The pages state the promise in their own approved words rather than
    // rendering `pricing.guarantee`, so the number is what has to match. If
    // the rate card ever moves off 75 days, these sentences are stale and
    // this fails rather than letting two pages promise different terms.
    expect(t.pricing.guarantee).toContain("75 days");
    for (const { routeKey } of marketSlices) {
      expect(copyOf(routeKey), routeKey).toContain("75 days");
    }
  });

  it("puts the price-anchoring line after the block that quotes the figures", () => {
    // The approved sentences open "For context:" and comment on numbers the
    // reader has just met. A section that carries one must therefore be the
    // section that carries the figures — otherwise "for context" refers to
    // nothing, which is a copy bug that renders perfectly.
    for (const { routeKey, content } of marketSlices) {
      const anchored = content.sections.filter(
        (section) => "priceAnchor" in section,
      );
      expect(anchored, routeKey).toHaveLength(1);

      const section = anchored[0] as {
        paragraphs?: readonly string[];
        items?: readonly string[];
        priceAnchor: string;
      };
      const body = [
        ...(section.paragraphs ?? []),
        ...(section.items ?? []),
      ].join(" ");

      expect(section.priceAnchor, routeKey).toMatch(/^For context:/);
      expect(body, routeKey).toContain("$2,500");
      expect(body, routeKey).toContain("75 days");
    }
  });
});

describe("market page metadata", () => {
  it.each(marketSlices)(
    "$routeKey stays inside the 165-character guard",
    ({ page }) => {
      expect(page.description.length).toBeLessThanOrEqual(165);
    },
  );

  it.each(marketSlices)(
    "$routeKey has an h1 and a distinct meta title",
    ({ page }) => {
      expect(page.title.length).toBeGreaterThan(0);
      expect(page.metaTitle).toContain("Nahl Technologies");
      expect(page.metaTitle).not.toBe(page.title);
    },
  );

  it("gives every market its own title and description", () => {
    // Four near-identical pages are four chances to ship the same metadata
    // twice, which reads to a crawler as duplicate content.
    const titles = marketSlices.map((slice) => slice.page.metaTitle);
    const descriptions = marketSlices.map((slice) => slice.page.description);
    expect(new Set(titles).size).toBe(titles.length);
    expect(new Set(descriptions).size).toBe(descriptions.length);
  });
});

describe("the markets sentence", () => {
  it("names every market, in the descriptor's order", () => {
    expect(marketSlices.map((slice) => slice.content.anchor)).toEqual([
      "Canada",
      "the Gulf region",
      "Central Asia",
      "New Zealand",
    ]);
  });

  it("is the founder's sentence, assembled", () => {
    // `MarketsLine` renders the prefix, the four anchors, and the commas
    // between them. Only the punctuation is code, and this is what it has to
    // add up to — the sentence approved verbatim for the Indianapolis page,
    // which /about and the home page render from the same key.
    const anchors = marketSlices.map((slice) => slice.content.anchor);
    const assembled = `${t.markets.sentencePrefix} ${anchors
      .slice(0, -1)
      .join(", ")}, and ${anchors.at(-1)}.`;

    expect(assembled).toBe(
      "We also work remotely with businesses in Canada, the Gulf region, " +
        "Central Asia, and New Zealand.",
    );
  });
});

describe("market pages in the graph", () => {
  it.each(marketSlices)("$routeKey carries a Service node", ({ routeKey }) => {
    const schema = marketServiceSchema(t, routeKey) as {
      "@type": string;
      url: string;
      provider: { "@id": string };
      description: string;
    };

    expect(schema["@type"]).toBe("Service");
    expect(schema.url).toBe(`${siteUrl}${routes[routeKey]}`);
    expect(schema.provider["@id"]).toBe(`${siteUrl}/#organization`);
    expect(schema.description).toBe(t.pages[routeKey].description);
  });

  it("claims no country the Organization does not", () => {
    // The graph's outer boundary is `AREA_SERVED`. A market page narrows it;
    // it must never widen it, or the site claims territory its identity node
    // does not.
    const organization = organizationSchema(t) as {
      areaServed: { name: string }[];
    };
    const claimed = new Set(organization.areaServed.map((c) => c.name));

    for (const routeKey of marketRouteKeys) {
      const schema = marketServiceSchema(t, routeKey) as {
        areaServed: { "@type": string; name: string }[];
      };
      expect(schema.areaServed.length, routeKey).toBeGreaterThan(0);
      for (const country of schema.areaServed) {
        expect(claimed, `${routeKey} claims ${country.name}`).toContain(
          country.name,
        );
      }
    }
  });

  it("uses Country objects and never a City", () => {
    // The Indianapolis page is the only City in the graph and stays the only
    // one. A market page's subject is a territory, and the Gulf page says out
    // loud that there is no Gulf office — markup that implied one would
    // contradict the page's own sentence.
    for (const routeKey of marketRouteKeys) {
      const json = JSON.stringify(marketServiceSchema(t, routeKey));
      expect(json, routeKey).toContain('"@type":"Country"');
      expect(json, routeKey).not.toContain("City");
    }
  });

  it("builds a breadcrumb that skips the hub route it has no page for", () => {
    // There is no /markets page in this batch. The breadcrumb therefore runs
    // Home → the market page, with nothing pointing at a path that 404s —
    // hard rule 7, applied to structured data.
    const breadcrumb = breadcrumbSchema(t, routes.marketCanada) as {
      itemListElement: { name: string; item: string }[];
    } | null;

    expect(breadcrumb).not.toBeNull();
    expect(breadcrumb!.itemListElement.map((entry) => entry.item)).toEqual([
      `${siteUrl}/`,
      `${siteUrl}${routes.marketCanada}`,
    ]);
  });
});

describe("the Canada funding-guide link", () => {
  it("points at a published post, not a slug that used to exist", () => {
    // The anchor lives in a React component, so nothing in the blog gates
    // checks it — those only see links written inside MDX. This is the check
    // that stands in for them: hard rule 7 applied to the one link on the
    // site that crosses from a page into the post collection.
    const post = getPublishedPosts().find(
      (item) => item.slug === canadaFundingGuideSlug,
    );
    expect(
      post,
      `${canadaFundingGuideSlug} is not a published post; /markets/canada links it`,
    ).toBeDefined();
    expect(canadaFundingGuidePath).toBe(`/blog/${canadaFundingGuideSlug}`);
  });

  it("keeps the anchor text beside the sentence that carries it", () => {
    const section = t.markets.canada.sections.find(
      (item) => "trailingLinkAnchor" in item,
    ) as { items: readonly string[]; trailingLinkAnchor: string } | undefined;

    expect(section).toBeDefined();
    expect(section!.trailingLinkAnchor).toBe("Canada AI funding guide");
    // It rides the last bullet, and that bullet is the funding one — the
    // template appends the link there, so if the copy is ever reordered this
    // fails rather than moving the link onto an unrelated sentence.
    expect(section!.items.at(-1)).toContain("The funding question");
  });

  it("leaves no placeholder marker behind", () => {
    expect(JSON.stringify(t.markets.canada)).not.toContain("[LINK");
  });
});

describe("the Canada concentration passage", () => {
  const sections = t.markets.canada.sections;
  const index = sections.findIndex(
    (section) => section.heading === "Where our Canadian work concentrates",
  );

  it("sits after the execution gap and before the practical questions", () => {
    expect(sections.map((section) => section.heading)).toEqual([
      "The execution gap, Canadian edition",
      "Where our Canadian work concentrates",
      "Practical things Canadian clients ask about",
    ]);
    expect(index).toBe(1);
  });

  it("rejoins to the approved paragraph character for character", () => {
    // The template renders `before`, one space, the anchor, then `after`.
    const { before, anchor, after } = (
      sections[index] as {
        linkedParagraph: { before: string; anchor: string; after: string };
      }
    ).linkedParagraph;

    expect(`${before} ${anchor}${after}`).toBe(
      "Most of our Canadian conversations come from Ontario's manufacturing belt and the Prairie cities: Toronto and the towns around it, Guelph, Cambridge, Peterborough, Winnipeg. That is not an accident. Mid-size Canadian cities are full of manufacturers and service firms too small to hire a $200,000 AI specialist and too busy to become one, which is exactly who we built our engagement model for. Everything runs remotely, in your time zone, and our study of how AI funding actually works in Canada right now is where many of those conversations start.",
    );
    expect(anchor).toBe(
      "study of how AI funding actually works in Canada right now",
    );
  });

  it("uses a different anchor from the page's other link to the same guide", () => {
    // Both links on this page go to the funding guide. Identical text twice
    // from one page is the concentration crawl-check exists to catch.
    const { anchor } = (
      sections[index] as { linkedParagraph: { anchor: string } }
    ).linkedParagraph;
    const other = sections.find(
      (section) => "trailingLinkAnchor" in section,
    ) as { trailingLinkAnchor: string } | undefined;
    expect(anchor).not.toBe(other!.trailingLinkAnchor);
  });
});

describe("market copy obeys the house rules", () => {
  it("contains no banned word", () => {
    // Hard rule 15 has no automated gate site-wide; it has one here, for the
    // copy this relay added. The list is the rule's, minus "solutions",
    // which the rule bans only as a standalone noun and which grep cannot
    // tell apart from a legitimate use.
    const banned = [
      "empower",
      "leverage",
      "unlock",
      "transform",
      "harness",
      "cutting-edge",
      "innovative",
      "world-class",
    ];
    for (const { routeKey } of marketSlices) {
      const copy = copyOf(routeKey).toLowerCase();
      for (const word of banned) {
        expect(copy, `${routeKey} uses "${word}"`).not.toContain(word);
      }
    }
  });

  it("leaves no draft markup in the shipped copy", () => {
    // The Canada draft marked a future link inline. It renders as prose until
    // the funding guide exists, and the marker itself must not survive into
    // the page.
    for (const { routeKey } of marketSlices) {
      const copy = copyOf(routeKey);
      expect(copy, routeKey).not.toContain("[LINK");
      expect(copy, routeKey).not.toContain("[PLACEHOLDER");
      expect(copy, routeKey).not.toMatch(/\]\(\//);
    }
  });
});
