import { describe, expect, it } from "vitest";

import {
  getPublishedPosts,
  getRelatedPosts,
  loadAllPosts,
  type Post,
} from "./blog";

/**
 * Assertions about the actual corpus in content/blog, as opposed to the
 * fixture-driven gate tests in blog.test.ts. These are the migration's
 * acceptance criteria expressed as a test, so a future edit that drops a
 * byline fix or a product link fails the run rather than the review.
 */

/**
 * The five posts brought over from the old repo. Scoped deliberately: these
 * assertions are the migration's acceptance criteria, and posts written since
 * are not bound by them — a new post has no obligation to link to Hafsa
 * Sastho unless it has an honest reason to.
 */
const MIGRATED = [
  "building-ai-in-bengali-the-language-challenge-nobody-talks-about",
  "postpartum-depression-without-a-word-for-it",
  "the-data-gap-bangladeshs-4-million-births-invisible-to-ai",
  "two-immigrants-one-mission-why-we-are-building-for-home",
  "why-we-named-our-company-after-the-honeybee",
];

/**
 * Unpublished 13 Aug 2026 on the founder's instruction. They keep their files
 * — the prose is not deleted, only withdrawn — and `next.config.ts` redirects
 * both old URLs to /about, because they were live and someone may still hold
 * the link.
 */
const UNPUBLISHED = [
  "two-immigrants-one-mission-why-we-are-building-for-home",
  "why-we-named-our-company-after-the-honeybee",
];

const STILL_PUBLISHED = MIGRATED.filter((slug) => !UNPUBLISHED.includes(slug));

describe("the migrated collection", () => {
  const posts = getPublishedPosts().filter((post) =>
    MIGRATED.includes(post.slug),
  );

  it("publishes the three that were not withdrawn, newest first", () => {
    expect(posts.map((post) => post.slug).sort()).toEqual(
      [...STILL_PUBLISHED].sort(),
    );
    const dates = posts.map((post) => post.date);
    expect([...dates].sort().reverse()).toEqual(dates);
  });

  it("keeps the withdrawn two out of every published surface", () => {
    // getPublishedPosts is what the hub, the feed and the sitemap all read,
    // so this one assertion covers all three at once.
    const all = getPublishedPosts().map((post) => post.slug);
    for (const slug of UNPUBLISHED) {
      expect(all, `${slug} is still published`).not.toContain(slug);
    }
    expect(all).toEqual(expect.arrayContaining(STILL_PUBLISHED));
  });

  it("keeps the withdrawn files rather than deleting the prose", () => {
    // Withdrawn, not destroyed: a redirect and draft:true are reversible.
    const everything = loadAllPosts().map((post) => post.slug);
    for (const slug of UNPUBLISHED) {
      expect(everything, slug).toContain(slug);
    }
  });

  it("credits Udaay Sikder on every post", () => {
    // One legacy file carried the byline "Udaay Sikker".
    for (const post of posts) {
      expect(post.author, post.slug).toBe("Udaay Sikder");
    }
  });

  it("links each post to the product exactly once", () => {
    for (const post of posts) {
      const hits = post.body.match(/\]\(\/products\/hafsa-sastho\)/g) ?? [];
      expect(hits.length, post.slug).toBe(1);
    }
  });

  it("leaves three field-notes published and no brand posts", () => {
    // Both brand posts were the ones withdrawn, so the published remainder of
    // the migration is field-notes only.
    const byCluster = posts.reduce<Record<string, number>>((acc, post) => {
      acc[post.cluster] = (acc[post.cluster] ?? 0) + 1;
      return acc;
    }, {});
    expect(byCluster).toEqual({ "field-notes": 3 });
  });

  it("gives every field-notes post a keyword and a service link", () => {
    for (const post of posts.filter((p) => p.cluster === "field-notes")) {
      expect(post.targetKeyword, post.slug).toBeTruthy();
      expect(post.serviceLinks.length, post.slug).toBeGreaterThan(0);
      for (const href of post.serviceLinks) {
        expect(post.body, `${post.slug} declares ${href}`).toContain(
          `](${href})`,
        );
      }
    }
  });

  it("gives every post a table of contents", () => {
    for (const post of posts) {
      expect(post.headings.length, post.slug).toBeGreaterThan(1);
    }
  });

  it("orders related posts by cluster, then recency", () => {
    const post = posts.find((p) => p.cluster === "field-notes") as Post;
    const related = getRelatedPosts(post);
    expect(related.length).toBeGreaterThan(0);
    expect(related.map((r) => r.slug)).not.toContain(post.slug);
    expect(related[0].cluster).toBe("field-notes");
  });
});
