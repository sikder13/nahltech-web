import { describe, expect, it } from "vitest";

import { localPricingRows } from "./pricing-mirror";
import { routes } from "./routes";
import { localServiceSchema } from "./schema-org";

import en from "@/lib/i18n/dictionaries/en.json";

import type { Dictionary } from "@/lib/i18n/get-dictionary";

/**
 * The Indianapolis landing page makes two kinds of claim that can rot
 * silently: prices, which must agree with /pricing, and cities, which must
 * agree with the prose a visitor reads. Both are checked here rather than by
 * eye, because the failure mode of both is a page that still renders.
 */
const t: Dictionary = en;
const page = t.aiConsultingIndianapolis;
const rows = localPricingRows(t);

/** Every string the page renders, as one blob to search. */
const copy = JSON.stringify(page);

describe("the pricing table mirrors /pricing", () => {
  it("quotes the rate card's audit fee, not the draft's range", () => {
    // The draft said $1,500–$3,500. The rate card says $2,500, and the rate
    // card wins — this is the specific contradiction the mirror exists for.
    const audit = rows.find((row) => row.engagement === "AI Opportunity Audit");
    expect(audit).toBeDefined();
    expect(audit!.price).toBe("$2,500, fully credited");
    expect(copy).not.toContain("$1,500");
    expect(copy).not.toContain("$3,500");
  });

  it("carries each build row exactly as /pricing publishes it", () => {
    for (const name of [
      "AI Automation build",
      "Web Development",
      "Software Development",
    ]) {
      const project = t.pricing.projects.find((p) => p.name === name);
      const row = rows.find((r) => r.engagement === name);
      expect(row, name).toBeDefined();
      expect(row!.price, name).toBe(project!.price);
      expect(row!.detail, name).toBe(project!.note);
    }
  });

  it("throws rather than dropping a row when the rate card is renamed", () => {
    // A silently shorter table is the failure this must never have.
    const renamed = {
      ...t,
      pricing: {
        ...t.pricing,
        projects: t.pricing.projects.map((p) =>
          p.name === "Web Development" ? { ...p, name: "Websites" } : p,
        ),
      },
    } as Dictionary;

    expect(() => localPricingRows(renamed)).toThrow(/Web Development/);
  });

  it("takes the 75-day promise from the rate card, not a copy of it", () => {
    // /pricing renders this same key under its builds. A guarantee worded
    // one way here and another way there is two different promises.
    expect(t.pricing.guarantee).toBe(
      "Scoped automation and software builds go live in 75 days, or your money back.",
    );
    // The standalone line under the table comes from that key, so the page's
    // pricing block must not hold a second copy of the sentence. The lead
    // paragraph does state it in prose — that is the founder's approved lead,
    // not a duplicate of the rate-card line.
    expect(page.pricing).not.toHaveProperty("guarantee");
    expect(page.lead.join(" ")).toContain(t.pricing.guarantee);
  });

  it("states the build entry point the FAQ quotes", () => {
    // The founder's replacement sentence says builds start at $6,000, which
    // is only true while $6,000 is the cheapest build on the rate card.
    const cheapest = rows
      .map((row) => /^from \$([\d,]+)$/.exec(row.price)?.[1])
      .filter(Boolean)
      .map((amount) => Number(amount!.replace(/,/g, "")));

    expect(Math.min(...cheapest)).toBe(6000);
    expect(page.faq.items[0].answer).toContain("$6,000");
  });
});

describe("the Service node", () => {
  const schema = localServiceSchema(t) as {
    areaServed: { "@type": string; name: string }[];
    offers: { name: string; price?: number }[];
    aggregateRating?: unknown;
  };

  it("claims only cities the page names out loud", () => {
    // A city in the markup that a reader cannot find in the prose is a claim
    // the page does not support.
    for (const city of schema.areaServed) {
      expect(city["@type"]).toBe("City");
      expect(copy, city.name).toContain(city.name);
    }
  });

  it("offers exactly the rows the table shows", () => {
    expect(schema.offers.map((o) => o.name)).toEqual(
      rows.map((row) => row.engagement),
    );
  });

  it("prices the free scan at zero and leaves 'custom' unpriced", () => {
    const scan = schema.offers.find((o) => o.name === "AI Opportunity Scan");
    const custom = schema.offers.find((o) => o.name === "Software Development");
    expect(scan!.price).toBe(0);
    expect(custom!.price).toBeUndefined();
  });

  it("emits no aggregateRating", () => {
    expect(schema.aggregateRating).toBeUndefined();
  });
});

describe("page copy", () => {
  it("carries no banned word", () => {
    // Hard rule 15. "transform" is the one the draft arrived with.
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
  });

  it("keeps the meta description inside the draft's own length guard", () => {
    expect(
      t.pages.aiConsultingIndianapolis.description.length,
    ).toBeLessThanOrEqual(165);
  });

  it("publishes all six approved questions", () => {
    expect(page.faq.items).toHaveLength(6);
  });
});

describe("internal links", () => {
  it("uses one anchor string everywhere the site points here", () => {
    // The relay specified the anchor text verbatim. Keeping it in one key
    // means the five inbound links cannot drift from each other.
    expect(page.anchor).toBe("AI consulting in Indianapolis");
  });

  it("is linked from both blog posts with the approved sentence", async () => {
    const { readFileSync } = await import("node:fs");
    const sentence = `our [${page.anchor}](${routes.aiConsultingIndianapolis}) page covers pricing and how we work.`;

    for (const slug of [
      "seo-cost-indianapolis",
      "indianapolis-business-chatgpt-visibility",
    ]) {
      const body = readFileSync(`content/blog/${slug}.mdx`, "utf8");
      expect(body, slug).toContain(sentence);
    }
  });

  it("does not become a sixth service", () => {
    // The route registry gained an entry; the service list must not have.
    expect(routes.aiConsultingIndianapolis).toBe("/ai-consulting-indianapolis");
    expect(Object.keys(t.services)).toHaveLength(5);
  });
});
