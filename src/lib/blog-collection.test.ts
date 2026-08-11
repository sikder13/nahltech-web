import { describe, expect, it } from "vitest";

import { getPublishedPosts, getRelatedPosts, type Post } from "./blog";

/**
 * Assertions about the actual corpus in content/blog, as opposed to the
 * fixture-driven gate tests in blog.test.ts. These are the migration's
 * acceptance criteria expressed as a test, so a future edit that drops a
 * byline fix or a product link fails the run rather than the review.
 */

describe("the migrated collection", () => {
  const posts = getPublishedPosts();

  it("loads all five posts, newest first", () => {
    expect(posts).toHaveLength(5);
    const dates = posts.map((post) => post.date);
    expect([...dates].sort().reverse()).toEqual(dates);
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

  it("splits the collection three field-notes to two brand", () => {
    const byCluster = posts.reduce<Record<string, number>>((acc, post) => {
      acc[post.cluster] = (acc[post.cluster] ?? 0) + 1;
      return acc;
    }, {});
    expect(byCluster).toEqual({ "field-notes": 3, brand: 2 });
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
