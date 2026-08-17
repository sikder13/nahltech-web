import { describe, expect, it } from "vitest";

import {
  getPublishedResearch,
  getResearchBySlug,
  getResearchForHub,
  validateResearch,
} from "./research";
import { datasetSchema, researchArticleSchema } from "./schema-org";

const ENGAGEMENTS = [
  "sample-engagement-indianapolis-hvac",
  "sample-engagement-indianapolis-logistics",
  "sample-engagement-kestrel-beverage",
];

describe("the research collection", () => {
  const articles = getPublishedResearch();

  it("publishes all five artifacts", () => {
    expect(articles.map((a) => a.slug).sort()).toEqual(
      ["crawlmouse-dataset-report", "how-we-measure", ...ENGAGEMENTS].sort(),
    );
  });

  it("orders the hub by kind: data, then method, then engagements", () => {
    // Original data leads — it is the strongest thing in the section. The
    // methodology follows as the spine every other artifact points at, and the
    // engagements last, since they illustrate the method on fictional clients.
    expect(getResearchForHub().map((a) => a.kind)).toEqual([
      "data-report",
      "methodology",
      "sample-engagement",
      "sample-engagement",
      "sample-engagement",
    ]);
  });

  it("orders deterministically when dates tie", () => {
    // All three engagements share a date, so without the slug tie-break the
    // order is readdir order — which differs between machines.
    expect(
      getResearchForHub()
        .filter((a) => a.kind === "sample-engagement")
        .map((a) => a.slug),
    ).toEqual(ENGAGEMENTS);
  });

  it("features the data report on the home page", () => {
    // The home page takes the hub's first entry, so the ordering above is what
    // decides what the flagship slot shows.
    expect(getResearchForHub()[0].slug).toBe("crawlmouse-dataset-report");
  });

  it("carries a disclosure banner on exactly the fictional-client artifacts", () => {
    // The banner's presence is driven by the frontmatter field, so this is the
    // assertion that the three engagements disclose and the methodology — which
    // describes no client — does not.
    const withBanner = articles
      .filter((a) => a.sampleBanner)
      .map((a) => a.slug)
      .sort();
    expect(withBanner).toEqual([...ENGAGEMENTS].sort());
    expect(getResearchBySlug("how-we-measure")?.sampleBanner).toBeUndefined();
    // The data report is real data, not a walkthrough of an invented client.
    expect(
      getResearchBySlug("crawlmouse-dataset-report")?.sampleBanner,
    ).toBeUndefined();
  });

  it("says the client is fictional in every banner", () => {
    // The whole point of the panel. If a banner ever stopped saying this, the
    // page would be presenting invented figures as a real engagement.
    for (const slug of ENGAGEMENTS) {
      expect(getResearchBySlug(slug)?.sampleBanner, slug).toMatch(/fictional/i);
    }
  });

  it("gives every artifact a table of contents", () => {
    for (const article of articles) {
      expect(article.headings.length, article.slug).toBeGreaterThan(1);
    }
  });

  it("leaves no h1 in the body, because the template renders the title", () => {
    // The methodology and the three engagements each open with an h1
    // repeating their own title; the loader strips it. Rendering both would
    // ship two h1s per page — the same heading-structure error as a skipped
    // level, and worse for anyone navigating by heading. The data report
    // opens with prose and needs no strip, which is why this asserts the
    // outcome rather than the edit.
    for (const article of articles) {
      expect(article.body, article.slug).not.toMatch(/^#\s+/m);
    }
  });
});

describe("research link resolution", () => {
  it("rejects a cross-link to an artifact that does not exist", () => {
    const raw = `---
title: "T"
description: "D"
date: "2026-08-13"
author: "Udaay Sikder"
kind: "methodology"
targetKeyword: null
draft: false
---

See [the other one](/research/does-not-exist).
`;
    expect(() =>
      validateResearch("t.mdx", raw, new Set(["t"]), new Set()),
    ).toThrow(/does-not-exist/);
  });

  it("rejects a link to a route that is not in the registry", () => {
    const raw = `---
title: "T"
description: "D"
date: "2026-08-13"
author: "Udaay Sikder"
kind: "methodology"
targetKeyword: null
draft: false
---

See [nowhere](/not-a-route).
`;
    expect(() =>
      validateResearch("t.mdx", raw, new Set(["t"]), new Set()),
    ).toThrow(/not-a-route/);
  });

  it("accepts an unquoted YAML date, which parses as a Date", () => {
    // The four artifacts are written with `date: 2026-08-13`, unquoted.
    const raw = `---
title: "T"
description: "D"
date: 2026-08-13
author: "Udaay Sikder"
kind: "methodology"
targetKeyword: null
draft: false
---

Body.
`;
    expect(validateResearch("t.mdx", raw, new Set(["t"]), new Set()).date).toBe(
      "2026-08-13",
    );
  });
});

describe("research schema", () => {
  it("never asserts that a fictional company exists", () => {
    // Redbud, Kestrel and Limestone are invented. Emitting an Organization or
    // a Review for any of them would tell a search engine that a real company
    // was really measured — the exact claim the on-page banner exists to
    // prevent. The only Organization in the graph is ours, as publisher.
    for (const article of getPublishedResearch()) {
      const json = JSON.stringify(researchArticleSchema(article));
      for (const name of ["Redbud", "Kestrel", "Limestone"]) {
        expect(json, `${article.slug} names ${name}`).not.toContain(name);
      }
      expect(json).not.toContain("Review");
      expect(json).not.toContain("aggregateRating");
    }
  });

  it("points each Article at its own research URL", () => {
    for (const article of getPublishedResearch()) {
      expect(researchArticleSchema(article).url).toBe(
        `https://nahltech.com/research/${article.slug}`,
      );
    }
  });
});

describe("dataset schema", () => {
  it("is emitted for the data report only", () => {
    for (const article of getPublishedResearch()) {
      const dataset = datasetSchema(article);
      if (article.kind === "data-report") {
        expect(dataset, article.slug).not.toBeNull();
      } else {
        // A Dataset node on a document that publishes no data would claim one
        // exists. The registry is keyed by slug so this fails safe.
        expect(dataset, article.slug).toBeNull();
      }
    }
  });

  it("describes the corpus without inventing an identifier", () => {
    const dataset = datasetSchema(
      getResearchBySlug("crawlmouse-dataset-report")!,
    ) as Record<string, unknown>;

    expect(dataset.name).toBe(
      "Crawlmouse Small-Business Website Structure Dataset (2026)",
    );
    expect(dataset.temporalCoverage).toBe("2026-06-15/2026-08-16");
    expect(dataset.variableMeasured).toHaveLength(5);
    expect(dataset.isBasedOn).toBe("https://crawlmouse.com");
    // No DOI exists, so none is published — a fabricated persistent
    // identifier is worse than an absent one.
    expect(dataset).not.toHaveProperty("identifier");
    expect(JSON.stringify(dataset)).not.toContain("aggregateRating");
  });
});
