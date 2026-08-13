import { describe, expect, it } from "vitest";

import {
  breadcrumbSchema,
  crawlmouseSchema,
  hafsaSasthoSchema,
  localBusinessSchema,
  offerCatalogSchema,
  organizationSchema,
  parsePublishedPrice,
  serviceSchema,
  webSiteSchema,
} from "./schema-org";
import { contactDetails, routes, serviceRouteKeys } from "./routes";

import en from "@/lib/i18n/dictionaries/en.json";

import type { Dictionary } from "@/lib/i18n/get-dictionary";

const t = en as Dictionary;

describe("parsePublishedPrice", () => {
  it("reads a single published figure", () => {
    expect(parsePublishedPrice("$2,500")).toBe(2500);
    expect(parsePublishedPrice("from $7,500")).toBe(7500);
  });

  it("treats zero as a published price, not a missing one", () => {
    // The free scan really does cost $0. That is a fact about the offer, so
    // the Offer carries it rather than omitting price as if it were unknown.
    expect(parsePublishedPrice("$0")).toBe(0);
  });

  it("refuses a range", () => {
    // Publishing one end of "$15,000–$45,000" as "the price" would be a claim
    // the page does not make.
    expect(parsePublishedPrice("$15,000–$45,000")).toBeNull();
  });

  it("refuses copy with no figure at all", () => {
    expect(parsePublishedPrice("custom")).toBeNull();
  });
});

describe("service schema", () => {
  it("covers all five services", () => {
    for (const key of serviceRouteKeys) {
      expect(serviceSchema(t, key), key).toMatchObject({ "@type": "Service" });
    }
  });

  it("prices the services whose pages publish a figure", () => {
    expect(serviceSchema(t, "aiSearchVisibility").offers).toMatchObject({
      price: 2500,
      priceCurrency: "USD",
    });
    expect(serviceSchema(t, "aiAutomation").offers).toMatchObject({
      price: 7500,
    });
    expect(serviceSchema(t, "webDevelopment").offers).toMatchObject({
      price: 6000,
    });
    expect(serviceSchema(t, "aiConsultancy").offers).toMatchObject({
      price: 2500,
    });
  });

  it("ships software development without a price", () => {
    // The page quotes a range after an audit, so there is no single number to
    // publish — the Offer exists, the price does not.
    const offers = serviceSchema(t, "softwareDevelopment").offers as Record<
      string,
      unknown
    >;
    expect(offers["@type"]).toBe("Offer");
    expect(offers).not.toHaveProperty("price");
  });

  it("marks a monthly retainer as recurring", () => {
    // Without this, $2,500/month is indistinguishable from a one-off $2,500.
    const offers = serviceSchema(t, "aiSearchVisibility").offers as Record<
      string,
      unknown
    >;
    expect(offers.priceSpecification).toMatchObject({
      "@type": "UnitPriceSpecification",
      unitCode: "MON",
      billingDuration: 1,
    });
  });

  it("does not mark a fixed-price build as recurring", () => {
    const offers = serviceSchema(t, "webDevelopment").offers as Record<
      string,
      unknown
    >;
    expect(offers).not.toHaveProperty("priceSpecification");
  });
});

describe("breadcrumbSchema", () => {
  it("emits nothing for the home page", () => {
    // A trail of one is not a trail.
    expect(breadcrumbSchema(t, routes.home)).toBeNull();
  });

  it("builds Home > Services > Service", () => {
    const crumbs = breadcrumbSchema(t, routes.aiConsultancy) as Record<
      string,
      unknown
    >;
    expect(crumbs.itemListElement).toEqual([
      {
        "@type": "ListItem",
        position: 1,
        name: "Nahl Technologies",
        item: "https://nahltech.com/",
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Services",
        item: "https://nahltech.com/services",
      },
      {
        "@type": "ListItem",
        position: 3,
        name: "AI Consultancy",
        item: "https://nahltech.com/services/ai-consultancy",
      },
    ]);
  });

  it("skips a path segment that is not a real page", () => {
    // There is no /legal hub, so no crumb may link to one — hard rule 7
    // applied to structured data.
    const crumbs = breadcrumbSchema(t, routes.privacy) as Record<
      string,
      unknown
    >;
    const items = crumbs.itemListElement as { item: string }[];
    expect(items).toHaveLength(2);
    expect(items.map((i) => i.item)).not.toContain(
      "https://nahltech.com/legal",
    );
  });

  it("names a blog post's crumb from its own title", () => {
    const crumbs = breadcrumbSchema(
      t,
      `${routes.blog}/some-post`,
      "Some Post Title",
    ) as Record<string, unknown>;
    const items = crumbs.itemListElement as { name: string }[];
    expect(items.map((i) => i.name)).toEqual([
      "Nahl Technologies",
      "Blog",
      "Some Post Title",
    ]);
  });
});

describe("localBusinessSchema", () => {
  const schema = localBusinessSchema(t);

  it("is the ProfessionalService subtype", () => {
    expect(schema["@type"]).toBe("ProfessionalService");
  });

  it("carries NAP character-identical to the footer", () => {
    // The footer and the markup read the same constants. If either is ever
    // hand-edited away from the other, this fails.
    expect(schema.address).toMatchObject({
      streetAddress: en.footer.street,
      postalCode: "46250",
      addressLocality: "Indianapolis",
      addressRegion: "IN",
    });
    expect(schema.telephone).toBe(en.footer.phoneDisplay);
    expect(schema.email).toBe(en.footer.email);
    expect(
      `${schema.address && (schema.address as Record<string, string>).addressLocality}, ${(schema.address as Record<string, string>).addressRegion} ${(schema.address as Record<string, string>).postalCode}`,
    ).toBe(en.footer.cityRegionPostal);
  });

  it("omits geo rather than guessing coordinates", () => {
    // The authoritative pin is the Google Business Profile's, added after
    // cutover. A city centroid would sit ~10 miles from the street address in
    // the same block.
    expect(schema).not.toHaveProperty("geo");
  });

  it("uses the same phone the site renders", () => {
    expect(schema.telephone).toBe(contactDetails.phoneDisplay);
  });
});

describe("product schemas", () => {
  it("prices Crawlmouse at zero, which is its published price", () => {
    expect(crawlmouseSchema(t).offers).toEqual({
      "@type": "Offer",
      price: 0,
      priceCurrency: "USD",
    });
  });

  it("points Hafsa Sastho at our own page while it has no store URL", () => {
    // productLinks.hafsaSastho is null until the Play Store listing exists;
    // guessing a store URL is the same error as a dead "Try it live" button.
    expect(hafsaSasthoSchema(t).url).toBe(
      "https://nahltech.com/products/hafsa-sastho",
    );
    expect(hafsaSasthoSchema(t)).not.toHaveProperty("offers");
  });

  it("labels Hafsa Sastho as the beta the site says it is", () => {
    expect(hafsaSasthoSchema(t)).toMatchObject({
      operatingSystem: "Android",
      softwareVersion: "beta",
      releaseDate: "2026-09-01",
    });
  });
});

describe("offerCatalogSchema", () => {
  const catalog = offerCatalogSchema(t) as Record<string, unknown>;
  const items = catalog.itemListElement as Record<string, unknown>[];

  it("enumerates the whole published ladder", () => {
    expect(items).toHaveLength(
      en.pricing.tiers.length + en.pricing.projects.length,
    );
  });

  it("keeps the page's own order", () => {
    expect(items[0].name).toBe(en.pricing.tiers[0].name);
    expect(items.at(-1)?.name).toBe(en.pricing.projects.at(-1)?.name);
  });

  it("lists the custom build without a price", () => {
    const custom = items.find((i) => i.name === "Software Development");
    expect(custom).toBeDefined();
    expect(custom).not.toHaveProperty("price");
  });
});

describe("site-wide invariants", () => {
  const everything = [
    organizationSchema(t),
    webSiteSchema(t),
    localBusinessSchema(t),
    offerCatalogSchema(t),
    crawlmouseSchema(t),
    hafsaSasthoSchema(t),
    ...serviceRouteKeys.map((key) => serviceSchema(t, key)),
  ];

  it("never emits aggregateRating", () => {
    // Hard invariant, not a preference: we have no review corpus, and an
    // unsubstantiated rating is the one piece of markup that is both trivially
    // faked and specifically penalised.
    for (const schema of everything) {
      expect(JSON.stringify(schema)).not.toContain("aggregateRating");
    }
  });

  it("never emits a review count or rating value", () => {
    for (const schema of everything) {
      const json = JSON.stringify(schema);
      expect(json).not.toContain("ratingValue");
      expect(json).not.toContain("reviewCount");
    }
  });

  it("declares no site search action, because there is no site search", () => {
    expect(webSiteSchema(t)).not.toHaveProperty("potentialAction");
  });

  it("uses absolute https URLs everywhere a url appears", () => {
    for (const schema of everything) {
      for (const url of JSON.stringify(schema).matchAll(
        /"(?:url|item|logo)":"([^"]+)"/g,
      )) {
        expect(url[1], JSON.stringify(schema).slice(0, 80)).toMatch(
          /^https:\/\//,
        );
      }
    }
  });
});
