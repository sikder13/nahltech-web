import { describe, expect, it } from "vitest";

import {
  getPublishedResearch,
  getResearchBySlug,
  getResearchForHub,
  validateResearch,
} from "./research";
import { researchArticleSchema } from "./schema-org";

const ENGAGEMENTS = [
  "sample-engagement-indianapolis-hvac",
  "sample-engagement-indianapolis-logistics",
  "sample-engagement-kestrel-beverage",
];

describe("the research collection", () => {
  const articles = getPublishedResearch();

  it("publishes all four artifacts", () => {
    expect(articles.map((a) => a.slug).sort()).toEqual(
      ["how-we-measure", ...ENGAGEMENTS].sort(),
    );
  });

  it("puts the methodology first on the hub, then the engagements", () => {
    // The methodology is the spine: every engagement points at it, and it is
    // what makes the others checkable. It leads regardless of date.
    const hub = getResearchForHub();
    expect(hub[0].slug).toBe("how-we-measure");
    expect(hub.slice(1).map((a) => a.kind)).toEqual([
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
        .slice(1)
        .map((a) => a.slug),
    ).toEqual(ENGAGEMENTS);
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
    // All four files open with an h1 repeating their own title. Rendering both
    // would ship two h1s per page — the same heading-structure error as a
    // skipped level, and worse for anyone navigating by heading.
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
