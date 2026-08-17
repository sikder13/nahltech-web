import { describe, expect, it } from "vitest";

import sitemap from "./sitemap";

import { routes, serviceRouteKeys } from "@/lib/routes";

/**
 * The sitemap is where a navigation decision would leak into SEO if anyone
 * ever confused the two.
 *
 * Research came out of the header bar; it did not come out of the site. This
 * asserts the separation directly, because "presentation only" is a claim
 * that is cheap to make and cheap to break — a later tidy-up that derives the
 * sitemap from the nav would pass every other test in this repo.
 */

describe("sitemap", () => {
  const entries = sitemap();
  const paths = entries.map((entry) => new URL(entry.url).pathname);

  it("emits every route the header no longer links to", () => {
    expect(paths).toContain(routes.research);
    expect(paths).toContain(routes.blog);
  });

  it("still lists the research articles themselves", () => {
    const articles = paths.filter(
      (path) => path.startsWith("/research/") && path !== routes.research,
    );
    expect(articles.length).toBeGreaterThan(0);
  });

  it("lists every service page and the hub", () => {
    expect(paths).toContain(routes.services);
    for (const key of serviceRouteKeys) {
      expect(paths, key).toContain(routes[key]);
    }
  });

  it("lists contact, which the header now links to", () => {
    expect(paths).toContain(routes.contact);
  });

  it("emits absolute, deduplicated URLs", () => {
    for (const entry of entries) {
      expect(entry.url).toMatch(/^https:\/\//);
    }
    expect(new Set(paths).size).toBe(paths.length);
  });
});
