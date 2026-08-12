import { describe, expect, it } from "vitest";

import { extractFaq, validatePost } from "./blog";

const SIBLINGS = new Set(["sibling-one", "sibling-two", "post"]);

function frontmatter(overrides: Record<string, unknown> = {}) {
  const base: Record<string, unknown> = {
    title: "A title",
    description: "A description",
    date: "2026-03-01",
    author: "Udaay Sikder",
    cluster: "field-notes",
    targetKeyword: "a keyword",
    serviceLinks: [],
    draft: false,
    ...overrides,
  };
  const lines = Object.entries(base).map(
    ([key, value]) => `${key}: ${JSON.stringify(value)}`,
  );
  return `---\n${lines.join("\n")}\n---\n`;
}

/** A body that satisfies the non-exempt gates: one offer link, two siblings. */
const PASSING_BODY = `
Some prose with a [product](/products/hafsa-sastho) link.

More prose linking [one](/blog/sibling-one) and [two](/blog/sibling-two).
`;

function build(fm: Record<string, unknown>, body = PASSING_BODY) {
  return frontmatter(fm) + body;
}

describe("validatePost — frontmatter", () => {
  it("names the file when frontmatter is invalid", () => {
    // A build log that says "invalid frontmatter" without the filename costs
    // more time than the gate saves.
    expect(() =>
      validatePost("broken.mdx", build({ title: "" }), SIBLINGS),
    ).toThrow(/content\/blog\/broken\.mdx/);
  });

  it("reports which field failed", () => {
    expect(() =>
      validatePost("broken.mdx", build({ date: "March 2026" }), SIBLINGS),
    ).toThrow(/date.*YYYY-MM-DD/);
  });

  it("rejects a cluster outside the known set", () => {
    expect(() =>
      validatePost("broken.mdx", build({ cluster: "musings" }), SIBLINGS),
    ).toThrow(/content\/blog\/broken\.mdx/);
  });

  it("defaults draft to false when omitted", () => {
    const raw = `---
title: "T"
description: "D"
date: "2026-03-01"
author: "Udaay Sikder"
cluster: "brand"
targetKeyword: null
serviceLinks: []
---
Body.`;
    expect(validatePost("post.mdx", raw, SIBLINGS).draft).toBe(false);
  });
});

describe("validatePost — link gates", () => {
  it("accepts a field-notes post that satisfies every gate", () => {
    const post = validatePost("post.mdx", build({}), SIBLINGS);
    expect(post.slug).toBe("post");
    expect(post.cluster).toBe("field-notes");
  });

  it("fails a non-exempt post with no targetKeyword", () => {
    expect(() =>
      validatePost("post.mdx", build({ targetKeyword: null }), SIBLINGS),
    ).toThrow(/requires a targetKeyword/);
  });

  it("fails a non-exempt post with no service, product or pricing link", () => {
    const body = `Prose linking [one](/blog/sibling-one) and [two](/blog/sibling-two).`;
    expect(() => validatePost("post.mdx", build({}, body), SIBLINGS)).toThrow(
      /at least one link to a \/services\/\*, \/products\/\* or \/pricing page/,
    );
  });

  it("fails a non-exempt post with fewer than two sibling links", () => {
    const body = `Prose with [a product](/products/hafsa-sastho) and [one](/blog/sibling-one).`;
    expect(() => validatePost("post.mdx", build({}, body), SIBLINGS)).toThrow(
      /at least two links to sibling posts; found 1/,
    );
  });

  it("does not count a self-link as a sibling", () => {
    const body = `[product](/products/hafsa-sastho) [self](/blog/post) [one](/blog/sibling-one)`;
    expect(() => validatePost("post.mdx", build({}, body), SIBLINGS)).toThrow(
      /found 1/,
    );
  });

  it("waives the keyword and link gates for brand and archive", () => {
    // Heritage and company-story essays are not SEO plays. Forcing a service
    // link into them would mean writing a dishonest link.
    for (const cluster of ["brand", "archive"]) {
      const post = validatePost(
        "post.mdx",
        build({ cluster, targetKeyword: null }, "Prose with no links at all."),
        SIBLINGS,
      );
      expect(post.cluster).toBe(cluster);
    }
  });
});

describe("validatePost — dead links", () => {
  it("rejects a sibling link to a post that does not exist", () => {
    const body = `[product](/products/hafsa-sastho) [one](/blog/sibling-one) [ghost](/blog/no-such-post)`;
    expect(() => validatePost("post.mdx", build({}, body), SIBLINGS)).toThrow(
      /\/blog\/no-such-post, which is not a post/,
    );
  });

  it("rejects a link to a path that is not a route", () => {
    const body = `[nope](/services/quantum-astrology) [one](/blog/sibling-one) [two](/blog/sibling-two)`;
    expect(() => validatePost("post.mdx", build({}, body), SIBLINGS)).toThrow(
      /not a route in lib\/routes\.ts/,
    );
  });

  it("checks dead links on exempt clusters too", () => {
    // The waiver is about requiring links, not about tolerating broken ones.
    const body = `[ghost](/blog/no-such-post)`;
    expect(() =>
      validatePost(
        "post.mdx",
        build({ cluster: "brand", targetKeyword: null }, body),
        SIBLINGS,
      ),
    ).toThrow(/not a post in content\/blog/);
  });
});

describe("validatePost — headings", () => {
  it("extracts h2s with slugs matching rehype-slug", () => {
    const body = `## First Heading\n\ntext\n\n## Second: With Punctuation!\n\ntext`;
    const post = validatePost(
      "post.mdx",
      build({ cluster: "brand", targetKeyword: null }, body),
      SIBLINGS,
    );
    expect(post.headings).toEqual([
      { id: "first-heading", text: "First Heading" },
      { id: "second-with-punctuation", text: "Second: With Punctuation!" },
    ]);
  });
});

describe("validatePost — sibling gate threshold", () => {
  const soloBody = `Prose citing [pricing](/pricing) and nothing else.`;

  it("waives the sibling requirement below the cluster threshold", () => {
    // First post in a cluster has no siblings to link to. Requiring two would
    // either block it or force a link to an unrelated cluster.
    for (const size of [1, 2]) {
      const post = validatePost(
        "post.mdx",
        build({ cluster: "decision" }, soloBody),
        SIBLINGS,
        size,
      );
      expect(post.cluster, `cluster size ${size}`).toBe("decision");
    }
  });

  it("enforces the sibling requirement once the cluster reaches three", () => {
    expect(() =>
      validatePost(
        "post.mdx",
        build({ cluster: "decision" }, soloBody),
        SIBLINGS,
        3,
      ),
    ).toThrow(/at least two links to sibling posts; found 0/);
  });

  it("still requires an offer link below the threshold", () => {
    // The waiver covers sibling links only. A post that sells nothing and
    // links nowhere is still an orphan.
    expect(() =>
      validatePost(
        "post.mdx",
        build({ cluster: "decision" }, "Prose alone."),
        SIBLINGS,
        1,
      ),
    ).toThrow(/at least one link to a/);
  });

  it("enforces the sibling gate when the caller does not supply a size", () => {
    // Defaulting to the strict behaviour: an uninformed caller should not get
    // a silent waiver.
    expect(() =>
      validatePost("post.mdx", build({}, `[pricing](/pricing)`), SIBLINGS),
    ).toThrow(/at least two links to sibling posts/);
  });

  it("accepts /pricing as an offer link", () => {
    const body = `[pricing](/pricing) [one](/blog/sibling-one) [two](/blog/sibling-two)`;
    expect(validatePost("post.mdx", build({}, body), SIBLINGS).slug).toBe(
      "post",
    );
  });
});

describe("frontmatter dates", () => {
  it("accepts an unquoted YAML date, which parses as a Date not a string", () => {
    const raw = `---
title: "T"
description: "D"
date: 2026-08-12
author: "Udaay Sikder"
cluster: "brand"
targetKeyword: null
serviceLinks: []
draft: false
---
Body.`;
    expect(validatePost("post.mdx", raw, SIBLINGS).date).toBe("2026-08-12");
  });
});

describe("extractFaq", () => {
  const body = `## Intro

Not a question.

## Frequently asked questions

### First question?

First answer with **bold** and a [link](/pricing).

### Second question?

Second answer.

---

*Trailing note that is not an answer.*`;

  it("pairs each h3 with the prose beneath it", () => {
    expect(extractFaq(body)).toEqual([
      {
        question: "First question?",
        answer: "First answer with bold and a link.",
      },
      { question: "Second question?", answer: "Second answer." },
    ]);
  });

  it("stops at the thematic break, so trailing prose is not an answer", () => {
    expect(
      extractFaq(body)
        .map((e) => e.answer)
        .join(" "),
    ).not.toContain("Trailing note");
  });

  it("returns nothing when the post has no FAQ section", () => {
    expect(extractFaq("## Something else\n\nProse.")).toEqual([]);
  });
});
